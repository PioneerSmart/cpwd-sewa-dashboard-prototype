// Synthetic data engine for the PSI Public Works Intelligence Platform demo.
// All figures are deterministically generated (seeded PRNG) — illustrative only,
// not live departmental data. The data model mirrors a representative KPI set:
// volume, category split, SLA/TAT adherence, overdue backlog.

import { ALL_DIVISIONS, Division, leafDivisionsUnder } from "./geography";

export const DATA_START = { y: 2010, m: 1 };
export const DATA_END = { y: 2026, m: 11 }; // latest month represented in the demo

export type Category = "civil" | "electrical" | "horticulture";
export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "civil", label: "Civil" },
  { id: "electrical", label: "Electrical" },
  { id: "horticulture", label: "Horticulture" },
];

export type MonthKey = number; // y*12+m, m is 0-11 for convenience internally

export function toMonthKey(y: number, m1to12: number): MonthKey {
  return y * 12 + (m1to12 - 1);
}
export function fromMonthKey(k: MonthKey): { y: number; m: number } {
  return { y: Math.floor(k / 12), m: (k % 12) + 1 };
}
export const START_KEY = toMonthKey(DATA_START.y, DATA_START.m);
export const END_KEY = toMonthKey(DATA_END.y, DATA_END.m);

export const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function monthLabel(k: MonthKey): string {
  const { y, m } = fromMonthKey(k);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

// ---------- seeded PRNG (mulberry32) ----------
function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seededRandom(key: string): number {
  return mulberry32(hashStr(key))();
}

// ---------- per-division monthly generation ----------
export type MonthlyStats = {
  received: number;
  resolved: number;
  slaMetPct: number; // % of resolved this month that met TAT
  avgResolutionDays: number;
  overdueOpen: number; // open complaints past TAT as of month end
  category: Record<Category, number>; // counts within `received`
};

// Smooth seasonal multiplier: civil/horticulture peak in monsoon/summer, electrical peaks in summer.
function seasonalFactor(m1to12: number) {
  const x = ((m1to12 - 1) / 12) * Math.PI * 2;
  return 1 + 0.12 * Math.sin(x - Math.PI / 3) + 0.05 * Math.sin(2 * x);
}

function divisionBaseline(divisionId: string): number {
  // deterministic per-division base monthly volume in 2010, scaled later by weight+growth
  const r = seededRandom(divisionId + ":base");
  return 55 + r * 35; // 55-90 complaints/month in division in 2010
}

const monthlyCache = new Map<string, MonthlyStats>();

export function monthlyStatsForDivision(division: Division, key: MonthKey): MonthlyStats {
  const cacheKey = division.id + ":" + key;
  const cached = monthlyCache.get(cacheKey);
  if (cached) return cached;

  const { y, m } = fromMonthKey(key);
  const yearsSinceStart = y - DATA_START.y + (m - 1) / 12;
  const base = divisionBaseline(division.id) * division.weight;
  const growth = Math.pow(1.105, yearsSinceStart); // ~10.5% CAGR, compounding since 2010
  const seasonal = seasonalFactor(m);
  const noise = 0.9 + seededRandom(division.id + ":noise:" + key) * 0.22;

  const received = Math.max(3, Math.round(base * growth * seasonal * noise));

  // SLA performance drifts slightly over time (gradual improvement) with monthly noise
  const slaDrift = Math.min(8, yearsSinceStart * 0.35); // process maturity improves adherence slowly
  const slaBase = 71 + slaDrift - 6 * Math.sin(((m - 1) / 12) * Math.PI * 2 + 1.1); // seasonal dip
  const slaNoise = (seededRandom(division.id + ":sla:" + key) - 0.5) * 10;
  let slaMetPct = Math.min(97, Math.max(45, slaBase + slaNoise));

  // Occasional anomaly months: sharp SLA dips (simulates monsoon flooding / staff shortage events)
  const anomalyRoll = seededRandom(division.id + ":anom:" + key);
  let anomalyTag = false;
  if (anomalyRoll > 0.978) {
    slaMetPct = Math.max(30, slaMetPct - (18 + seededRandom(division.id + ":anommag:" + key) * 18));
    anomalyTag = true;
  }

  const avgResolutionDays = Math.max(1.2, 9.5 - slaMetPct / 14 + (seededRandom(division.id + ":res:" + key) - 0.5) * 1.6);

  const resolved = Math.round(received * (0.86 + seededRandom(division.id + ":resolved:" + key) * 0.1));
  const overdueOpen = Math.max(0, Math.round((received - resolved) * (1 - slaMetPct / 100) * 1.4 + seededRandom(division.id + ":overdue:" + key) * 4));

  const civilShare = 0.42 + (seededRandom(division.id + ":cat1:" + key) - 0.5) * 0.08;
  const electricalShare = 0.37 + (seededRandom(division.id + ":cat2:" + key) - 0.5) * 0.08;
  const horticultureShare = Math.max(0.08, 1 - civilShare - electricalShare);
  const sum = civilShare + electricalShare + horticultureShare;

  const stats: MonthlyStats = {
    received,
    resolved,
    slaMetPct: Math.round(slaMetPct * 10) / 10,
    avgResolutionDays: Math.round(avgResolutionDays * 10) / 10,
    overdueOpen,
    category: {
      civil: Math.round(received * (civilShare / sum)),
      electrical: Math.round(received * (electricalShare / sum)),
      horticulture: Math.round(received * (horticultureShare / sum)),
    },
  };
  (stats as MonthlyStats & { _anomaly?: boolean })._anomaly = anomalyTag;
  monthlyCache.set(cacheKey, stats);
  return stats;
}

export function monthRange(fromKey: MonthKey, toKey: MonthKey): MonthKey[] {
  const out: MonthKey[] = [];
  for (let k = fromKey; k <= toKey; k++) out.push(k);
  return out;
}

export type AggregatedPoint = {
  key: MonthKey;
  label: string;
  received: number;
  resolved: number;
  slaMetPct: number;
  avgResolutionDays: number;
  overdueOpen: number;
  category: Record<Category, number>;
};

// Aggregate monthly stats across all leaf divisions under one or more node ids, for a month range.
export function aggregateSeries(nodeIds: string[], fromKey: MonthKey, toKey: MonthKey): AggregatedPoint[] {
  const divisions = Array.from(new Set(nodeIds.flatMap((id) => leafDivisionsUnder(id).map((d) => d.id))))
    .map((id) => ALL_DIVISIONS.find((d) => d.id === id)!)
    .filter(Boolean);

  const months = monthRange(fromKey, toKey);
  return months.map((key) => {
    let received = 0, resolved = 0, overdueOpen = 0;
    let slaWeighted = 0, resWeighted = 0;
    const category: Record<Category, number> = { civil: 0, electrical: 0, horticulture: 0 };
    for (const d of divisions) {
      const s = monthlyStatsForDivision(d, key);
      received += s.received;
      resolved += s.resolved;
      overdueOpen += s.overdueOpen;
      slaWeighted += s.slaMetPct * s.resolved;
      resWeighted += s.avgResolutionDays * s.resolved;
      category.civil += s.category.civil;
      category.electrical += s.category.electrical;
      category.horticulture += s.category.horticulture;
    }
    return {
      key,
      label: monthLabel(key),
      received,
      resolved,
      slaMetPct: resolved > 0 ? Math.round((slaWeighted / resolved) * 10) / 10 : 0,
      avgResolutionDays: resolved > 0 ? Math.round((resWeighted / resolved) * 10) / 10 : 0,
      overdueOpen,
      category,
    };
  });
}

export function summarize(points: AggregatedPoint[]) {
  const totalReceived = points.reduce((a, p) => a + p.received, 0);
  const totalResolved = points.reduce((a, p) => a + p.resolved, 0);
  const avgSla = points.length ? points.reduce((a, p) => a + p.slaMetPct * p.resolved, 0) / Math.max(1, totalResolved) : 0;
  const avgRes = points.length ? points.reduce((a, p) => a + p.avgResolutionDays * p.resolved, 0) / Math.max(1, totalResolved) : 0;
  const lastOverdue = points.length ? points[points.length - 1].overdueOpen : 0;
  const category = points.reduce(
    (acc, p) => {
      acc.civil += p.category.civil;
      acc.electrical += p.category.electrical;
      acc.horticulture += p.category.horticulture;
      return acc;
    },
    { civil: 0, electrical: 0, horticulture: 0 } as Record<Category, number>
  );
  return {
    totalReceived,
    totalResolved,
    avgSla: Math.round(avgSla * 10) / 10,
    avgResolutionDays: Math.round(avgRes * 10) / 10,
    overdueOpen: lastOverdue,
    category,
  };
}

// Month-over-month % change helper
export function momChange(points: AggregatedPoint[], field: "received" | "slaMetPct" | "overdueOpen") {
  if (points.length < 2) return 0;
  const last = points[points.length - 1][field];
  const prev = points[points.length - 2][field];
  if (prev === 0) return 0;
  return Math.round(((last - prev) / prev) * 1000) / 10;
}

// AI-assisted anomaly surfacing: scan the last N months across all divisions for the sharpest
// SLA drop, surfaced as a single explainable callout (computed from the underlying data, not scripted).
export function detectTopAnomaly(withinMonths = 6) {
  let best: { division: Division; key: MonthKey; drop: number } | null = null;
  const toKey = END_KEY;
  const fromKey = toKey - withinMonths + 1;
  for (const d of ALL_DIVISIONS) {
    for (let k = fromKey; k <= toKey; k++) {
      const cur = monthlyStatsForDivision(d, k);
      const prev = monthlyStatsForDivision(d, k - 1);
      const drop = prev.slaMetPct - cur.slaMetPct;
      if (drop > 10 && (!best || drop > best.drop)) {
        best = { division: d, key: k, drop: Math.round(drop * 10) / 10 };
      }
    }
  }
  return best;
}

// SLA breach list: divisions whose latest-month SLA adherence is below a threshold.
export function slaBreachList(nodeIds: string[], threshold = 72) {
  const divisions = Array.from(new Set(nodeIds.flatMap((id) => leafDivisionsUnder(id).map((d) => d.id))))
    .map((id) => ALL_DIVISIONS.find((d) => d.id === id)!)
    .filter(Boolean);
  return divisions
    .map((d) => ({ division: d, stats: monthlyStatsForDivision(d, END_KEY) }))
    .filter((x) => x.stats.slaMetPct < threshold)
    .sort((a, b) => a.stats.slaMetPct - b.stats.slaMetPct);
}

// ---------- officer / ticket level synthetic detail (Division/Officer tier) ----------
const FIRST_NAMES = ["Anil", "Priya", "Rakesh", "Sunita", "Vikram", "Meera", "Arvind", "Kavita", "Sanjay", "Neha", "Deepak", "Pooja"];
const LAST_NAMES = ["Sharma", "Verma", "Nair", "Reddy", "Singh", "Gupta", "Iyer", "Kulkarni", "Chatterjee", "Pillai"];

export type Officer = { id: string; name: string; assigned: number; resolved: number; avgDays: number };

export function officersForDivision(division: Division): Officer[] {
  const count = 3 + Math.floor(seededRandom(division.id + ":offcount") * 3);
  const stats = monthlyStatsForDivision(division, END_KEY);
  const out: Officer[] = [];
  let remainingAssigned = stats.received;
  let remainingResolved = stats.resolved;
  for (let i = 0; i < count; i++) {
    const r1 = seededRandom(division.id + ":off:" + i + ":a");
    const share = i === count - 1 ? 1 : 0.2 + r1 * 0.35;
    const assigned = i === count - 1 ? remainingAssigned : Math.round(remainingAssigned * share);
    const resolved = i === count - 1 ? remainingResolved : Math.round(remainingResolved * share);
    remainingAssigned -= assigned;
    remainingResolved -= resolved;
    const fn = FIRST_NAMES[Math.floor(seededRandom(division.id + ":fn:" + i) * FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(seededRandom(division.id + ":ln:" + i) * LAST_NAMES.length)];
    out.push({
      id: division.id + "-off-" + i,
      name: `${fn} ${ln}`,
      assigned: Math.max(1, assigned),
      resolved: Math.max(0, resolved),
      avgDays: Math.round((stats.avgResolutionDays + (seededRandom(division.id + ":offdays:" + i) - 0.5) * 2) * 10) / 10,
    });
  }
  return out;
}

export type Ticket = {
  id: string;
  colony: string;
  category: Category;
  status: "Open" | "In Progress" | "Resolved" | "Overdue";
  daysOpen: number;
  officer: string;
};

const STATUS_LIST: Ticket["status"][] = ["Open", "In Progress", "Resolved", "Overdue"];

export function recentTicketsForDivision(division: Division, count = 14): Ticket[] {
  const officers = officersForDivision(division);
  const tickets: Ticket[] = [];
  for (let i = 0; i < count; i++) {
    const seed = division.id + ":ticket:" + i;
    const cat = CATEGORIES[Math.floor(seededRandom(seed + ":c") * CATEGORIES.length)].id;
    const statusRoll = seededRandom(seed + ":s");
    const status = STATUS_LIST[Math.floor(statusRoll * STATUS_LIST.length)];
    const colony = division.colonies[Math.floor(seededRandom(seed + ":col") * division.colonies.length)];
    const officer = officers[Math.floor(seededRandom(seed + ":off") * officers.length)];
    tickets.push({
      id: `CS-${division.id.toUpperCase()}-${10000 + i}`,
      colony,
      category: cat,
      status,
      daysOpen: Math.max(0, Math.round(seededRandom(seed + ":days") * 25)),
      officer: officer.name,
    });
  }
  return tickets;
}
