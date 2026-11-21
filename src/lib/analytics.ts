// "Advanced BI" layer on top of the synthetic data engine in data.ts:
// an ad-hoc pivot/report builder, simple linear-regression forecasting,
// a generalized (multi-hit) anomaly scan, CSV export, and bookmark persistence.
// Everything here is derived client-side from the same deterministic synthetic
// dataset — illustrative only, not a real BI/forecast engine.

import {
  AggregatedPoint,
  END_KEY,
  aggregateSeries,
  monthLabel,
  monthlyStatsForDivision,
  summarize,
} from "./data";
import { ZONES, findDivision, leafDivisionsUnder } from "./geography";

// ---------- pivot / report builder ----------

export type PivotDimension = "zone" | "circle" | "division";

export type PivotRow = {
  id: string;
  label: string;
  secondary?: string;
  received: number;
  resolved: number;
  slaMetPct: number;
  avgResolutionDays: number;
  overdueOpen: number;
};

export const MEASURES: { id: keyof Omit<PivotRow, "id" | "label" | "secondary">; label: string; format: (v: number) => string }[] = [
  { id: "received", label: "Complaints received", format: (v) => v.toLocaleString("en-IN") },
  { id: "resolved", label: "Complaints resolved", format: (v) => v.toLocaleString("en-IN") },
  { id: "slaMetPct", label: "SLA / TAT adherence (%)", format: (v) => v.toFixed(1) + "%" },
  { id: "avgResolutionDays", label: "Avg. resolution time (days)", format: (v) => v.toFixed(1) },
  { id: "overdueOpen", label: "Overdue backlog", format: (v) => v.toLocaleString("en-IN") },
];

function circlesUnder(nodeIds: string[]) {
  const seen = new Set<string>();
  const out: { id: string; label: string; secondary: string }[] = [];
  for (const z of ZONES) {
    for (const c of z.circles) {
      if ((nodeIds.includes(z.id) || nodeIds.includes(c.id)) && !seen.has(c.id)) {
        seen.add(c.id);
        out.push({ id: c.id, label: c.name, secondary: z.name });
      }
    }
  }
  return out;
}

function divisionsUnder(nodeIds: string[]) {
  const seen = new Set<string>();
  const out: { id: string; label: string; secondary: string }[] = [];
  for (const n of nodeIds) {
    for (const d of leafDivisionsUnder(n)) {
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      const found = findDivision(d.id);
      out.push({
        id: d.id,
        label: d.name,
        secondary: found ? `${found.zone.name} › ${found.circle.name}` : "",
      });
    }
  }
  return out;
}

/** Entities available to break a report down by, given the dimension and the scope's root node ids. */
export function pivotEntities(rootNodeIds: string[], dimension: PivotDimension) {
  if (dimension === "zone") return ZONES.filter((z) => rootNodeIds.includes(z.id)).map((z) => ({ id: z.id, label: z.name, secondary: "" }));
  if (dimension === "circle") return circlesUnder(rootNodeIds);
  return divisionsUnder(rootNodeIds);
}

export function buildPivot(rootNodeIds: string[], dimension: PivotDimension, fromKey: number, toKey: number): PivotRow[] {
  const entities = pivotEntities(rootNodeIds, dimension);
  return entities
    .map((e) => {
      const series = aggregateSeries([e.id], fromKey, toKey);
      const s = summarize(series);
      return {
        id: e.id,
        label: e.label,
        secondary: e.secondary || undefined,
        received: s.totalReceived,
        resolved: s.totalResolved,
        slaMetPct: s.avgSla,
        avgResolutionDays: s.avgResolutionDays,
        overdueOpen: s.overdueOpen,
      };
    })
    .sort((a, b) => b.received - a.received);
}

// ---------- forecasting (simple linear regression over the recent trend) ----------

export type ForecastPoint = { key: number; label: string; received: number; resolved: number; slaMetPct: number };

export function forecastSeries(points: AggregatedPoint[], periodsAhead = 3, lookback = 6): ForecastPoint[] {
  if (points.length < 2 || periodsAhead <= 0) return [];
  const tail = points.slice(-Math.min(lookback, points.length));
  const n = tail.length;

  function regress(field: "received" | "resolved" | "slaMetPct") {
    const xs = tail.map((_, i) => i);
    const ys = tail.map((p) => p[field]);
    const xMean = xs.reduce((a, b) => a + b, 0) / n;
    const yMean = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (xs[i] - xMean) * (ys[i] - yMean);
      den += (xs[i] - xMean) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;
    const intercept = yMean - slope * xMean;
    return (x: number) => slope * x + intercept;
  }

  const recvFn = regress("received");
  const resFn = regress("resolved");
  const slaFn = regress("slaMetPct");

  const last = points[points.length - 1];
  const out: ForecastPoint[] = [
    // repeat the last actual point so the dashed projection connects with no gap
    { key: last.key, label: last.label, received: last.received, resolved: last.resolved, slaMetPct: last.slaMetPct },
  ];
  for (let i = 1; i <= periodsAhead; i++) {
    const x = n - 1 + i;
    out.push({
      key: last.key + i,
      label: monthLabel(last.key + i),
      received: Math.max(0, Math.round(recvFn(x))),
      resolved: Math.max(0, Math.round(resFn(x))),
      slaMetPct: Math.min(100, Math.max(0, Math.round(slaFn(x) * 10) / 10)),
    });
  }
  return out;
}

// ---------- anomaly scan (generalized: top N divisions by sharpest SLA drop, scoped) ----------

export type AnomalyHit = {
  divisionId: string;
  divisionName: string;
  zoneName: string;
  circleName: string;
  key: number;
  monthLabel: string;
  drop: number;
  latestSla: number;
};

export function topAnomalies(rootNodeIds: string[], limit = 5, withinMonths = 6, minDrop = 8): AnomalyHit[] {
  const ids = new Set<string>();
  for (const n of rootNodeIds) for (const d of leafDivisionsUnder(n)) ids.add(d.id);

  const toKey = END_KEY;
  const fromKey = toKey - withinMonths + 1;
  const hits: AnomalyHit[] = [];

  for (const id of ids) {
    const found = findDivision(id);
    if (!found) continue;
    let best: { key: number; drop: number } | null = null;
    for (let k = fromKey; k <= toKey; k++) {
      const cur = monthlyStatsForDivision(found.division, k);
      const prev = monthlyStatsForDivision(found.division, k - 1);
      const drop = Math.round((prev.slaMetPct - cur.slaMetPct) * 10) / 10;
      if (drop > minDrop && (!best || drop > best.drop)) best = { key: k, drop };
    }
    if (best) {
      const latest = monthlyStatsForDivision(found.division, best.key);
      hits.push({
        divisionId: id,
        divisionName: found.division.name,
        zoneName: found.zone.name,
        circleName: found.circle.name,
        key: best.key,
        monthLabel: monthLabel(best.key),
        drop: best.drop,
        latestSla: latest.slaMetPct,
      });
    }
  }
  return hits.sort((a, b) => b.drop - a.drop).slice(0, limit);
}

// ---------- CSV export ----------

export function toCSV(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
}

export function downloadCSV(filename: string, csv: string) {
  if (typeof window === "undefined") return;
  try {
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".csv") ? filename : filename + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    // best-effort only
  }
}

// ---------- bookmarks (saved views) ----------

export type Bookmark<T = Record<string, unknown>> = {
  id: string;
  name: string;
  createdAt: number;
  state: T;
};

const BOOKMARKS_KEY = "cpwd-sewa-demo:bookmarks:v1";

export function loadBookmarks<T = Record<string, unknown>>(): Bookmark<T>[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Bookmark<T>[]) : [];
  } catch {
    return [];
  }
}

export function saveBookmarks<T = Record<string, unknown>>(list: Bookmark<T>[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
  } catch {
    // best-effort only
  }
}
