"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  ReferenceLine,
} from "recharts";
import { AggregatedPoint, CATEGORIES } from "@/lib/data";
import { ForecastPoint } from "@/lib/analytics";

type ChartRow = Record<string, string | number | undefined>;

/** Appends a dashed forecast continuation to a historical series, without duplicating the anchor x-position. */
function mergeForecast(points: AggregatedPoint[], forecast: ForecastPoint[] | undefined, keys: ("received" | "resolved" | "slaMetPct")[]): ChartRow[] {
  const base: ChartRow[] = points.map((p) => ({ label: p.label, ...Object.fromEntries(keys.map((k) => [k, p[k]])) }));
  if (!forecast || forecast.length < 2 || base.length === 0) return base;
  const anchor = base[base.length - 1];
  for (const k of keys) anchor[k + "Forecast"] = anchor[k];
  for (const f of forecast.slice(1)) {
    const row: ChartRow = { label: f.label };
    for (const k of keys) row[k + "Forecast"] = f[k];
    base.push(row);
  }
  return base;
}

const CAT_COLORS: Record<string, string> = {
  civil: "var(--cat-1)",
  electrical: "var(--cat-2)",
  horticulture: "var(--cat-3)",
};

function TT({ active, payload, label }: { active?: boolean; payload?: { color?: string; name?: string; value?: number }[]; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="viz-tooltip">
      <div className="tt-title">{label}</div>
      {payload.map((p, i) => (
        <div className="tt-row" key={i}>
          <span>
            <span className="tt-swatch" style={{ background: p.color }} />
            {p.name}
          </span>
          <span style={{ fontWeight: 700 }}>{typeof p.value === "number" ? p.value.toLocaleString("en-IN") : p.value}</span>
        </div>
      ))}
    </div>
  );
}

const axisStyle = { fontSize: 11, fill: "var(--text-muted)" };

/** Volume trend: Received vs Resolved, single axis (counts). Optional dashed forecast continuation. */
export function VolumeTrendChart({ points, forecast }: { points: AggregatedPoint[]; forecast?: ForecastPoint[] }) {
  const data = mergeForecast(points, forecast, ["received", "resolved"]);
  const tickEvery = Math.max(1, Math.floor(data.length / 7));
  return (
    <>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 6, right: 14, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--gridline)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={axisStyle}
            interval={tickEvery}
            axisLine={{ stroke: "var(--axis)" }}
            tickLine={false}
          />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={46} />
          <Tooltip content={<TT />} />
          <Line type="monotone" dataKey="received" name="Received" stroke="var(--cat-1)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="resolved" name="Resolved" stroke="var(--cat-3)" strokeWidth={2} dot={false} />
          {forecast && (
            <>
              <Line type="monotone" dataKey="receivedForecast" name="Received (forecast)" stroke="var(--cat-1)" strokeWidth={2} strokeDasharray="5 4" dot={false} />
              <Line type="monotone" dataKey="resolvedForecast" name="Resolved (forecast)" stroke="var(--cat-3)" strokeWidth={2} strokeDasharray="5 4" dot={false} />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
      <div className="legend-row">
        <span className="legend-item"><span className="legend-swatch" style={{ background: "var(--cat-1)" }} />Complaints received</span>
        <span className="legend-item"><span className="legend-swatch" style={{ background: "var(--cat-3)" }} />Complaints resolved</span>
        {forecast && <span className="legend-item"><span className="legend-swatch" style={{ background: "var(--text-muted)" }} />- - - Forecast (linear projection)</span>}
      </div>
    </>
  );
}

/** SLA / TAT adherence trend, single axis (%), with breach-threshold reference line. Optional dashed forecast continuation. */
export function SlaTrendChart({ points, threshold = 72, forecast }: { points: AggregatedPoint[]; threshold?: number; forecast?: ForecastPoint[] }) {
  const data = mergeForecast(points, forecast, ["slaMetPct"]);
  const tickEvery = Math.max(1, Math.floor(data.length / 7));
  return (
    <>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 6, right: 14, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--gridline)" vertical={false} />
          <XAxis dataKey="label" tick={axisStyle} interval={tickEvery} axisLine={{ stroke: "var(--axis)" }} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={40} domain={[0, 100]} />
          <Tooltip content={<TT />} />
          <ReferenceLine y={threshold} stroke="var(--status-critical)" strokeDasharray="4 4" />
          <Line type="monotone" dataKey="slaMetPct" name="SLA / TAT adherence (%)" stroke="var(--seq-550)" strokeWidth={2.2} dot={false} />
          {forecast && (
            <Line type="monotone" dataKey="slaMetPctForecast" name="SLA / TAT adherence (forecast)" stroke="var(--seq-550)" strokeWidth={2.2} strokeDasharray="5 4" dot={false} />
          )}
        </LineChart>
      </ResponsiveContainer>
      <div className="legend-row">
        <span className="legend-item"><span className="legend-swatch" style={{ background: "var(--seq-550)" }} />SLA / TAT adherence</span>
        <span className="legend-item"><span className="legend-swatch" style={{ background: "var(--status-critical)" }} />Breach threshold ({threshold}%)</span>
        {forecast && <span className="legend-item"><span className="legend-swatch" style={{ background: "var(--text-muted)" }} />- - - Forecast (linear projection)</span>}
      </div>
    </>
  );
}

/** Category split (Civil / Electrical / Horticulture) as grouped bars across time buckets or as a single total. */
export function CategoryBars({ points }: { points: AggregatedPoint[] }) {
  const data = points.map((p) => ({ label: p.label, ...p.category }));
  const tickEvery = Math.max(1, Math.floor(data.length / 6));
  return (
    <>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 6, right: 14, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--gridline)" vertical={false} />
          <XAxis dataKey="label" tick={axisStyle} interval={tickEvery} axisLine={{ stroke: "var(--axis)" }} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={42} />
          <Tooltip content={<TT />} />
          {CATEGORIES.map((c) => (
            <Bar key={c.id} dataKey={c.id} name={c.label} stackId="cat" fill={CAT_COLORS[c.id]} radius={0} />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div className="legend-row">
        {CATEGORIES.map((c) => (
          <span className="legend-item" key={c.id}>
            <span className="legend-swatch" style={{ background: CAT_COLORS[c.id] }} />
            {c.label}
          </span>
        ))}
      </div>
    </>
  );
}

/** Horizontal comparison bars across arbitrary named entities (e.g. zones, circles). Rows with an `id` can be clickable for cross-filtering. */
export function CompareBars({
  rows,
  valueLabel,
  format,
  onRowClick,
  activeId,
}: {
  rows: { name: string; value: number; color: string; id?: string }[];
  valueLabel: string;
  format?: (v: number) => string;
  onRowClick?: (id: string) => void;
  activeId?: string | null;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((r) => {
        const clickable = !!(onRowClick && r.id);
        const isActive = !!(activeId && r.id === activeId);
        const row = (
          <>
            <div style={{ width: 128, fontSize: 12, color: "var(--text-secondary)", flexShrink: 0, textAlign: "right" }}>{r.name}</div>
            <div style={{ flex: 1, background: "var(--gridline)", borderRadius: 5, height: 16, position: "relative", overflow: "hidden" }}>
              <div
                style={{
                  width: `${Math.max(2, (r.value / max) * 100)}%`,
                  background: r.color,
                  height: "100%",
                  borderRadius: 5,
                  opacity: activeId && !isActive ? 0.45 : 1,
                }}
              />
            </div>
            <div style={{ width: 92, fontSize: 12.5, fontWeight: 700, color: "var(--psi-navy)", fontVariantNumeric: "tabular-nums" }}>
              {format ? format(r.value) : r.value.toLocaleString("en-IN")}
            </div>
          </>
        );
        if (clickable) {
          return (
            <button
              key={r.name}
              type="button"
              className={"compare-bar-row compare-bar-clickable" + (isActive ? " active" : "")}
              onClick={() => onRowClick!(r.id!)}
              title={isActive ? "Click to clear cross-filter" : "Click to focus this entity"}
            >
              {row}
            </button>
          );
        }
        return (
          <div key={r.name} className="compare-bar-row">
            {row}
          </div>
        );
      })}
      <div className="legend-row" style={{ marginTop: 0 }}>
        <span className="legend-item">{valueLabel}</span>
        {onRowClick && <span className="legend-item" style={{ color: "var(--text-muted)" }}>Click a row to cross-filter the dashboard</span>}
      </div>
    </div>
  );
}

/** Multi-series comparison line chart (up to 4 entities), fixed categorical slot order. */
const COMPARE_COLORS = ["var(--cat-1)", "var(--cat-2)", "var(--cat-3)", "var(--cat-4)"];
export function ComparisonLineChart({
  series,
}: {
  series: { name: string; points: AggregatedPoint[] }[];
}) {
  if (!series.length) return <div className="empty-note">Select at least one location to compare.</div>;
  const length = series[0].points.length;
  const merged = Array.from({ length }, (_, i) => {
    const row: Record<string, string | number> = { label: series[0].points[i]?.label ?? "" };
    series.forEach((s) => {
      row[s.name] = s.points[i]?.slaMetPct ?? 0;
    });
    return row;
  });
  const tickEvery = Math.max(1, Math.floor(length / 7));
  return (
    <>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={merged} margin={{ top: 6, right: 14, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--gridline)" vertical={false} />
          <XAxis dataKey="label" tick={axisStyle} interval={tickEvery} axisLine={{ stroke: "var(--axis)" }} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={40} domain={[0, 100]} />
          <Tooltip content={<TT />} />
          {series.map((s, i) => (
            <Line key={s.name} type="monotone" dataKey={s.name} name={s.name} stroke={COMPARE_COLORS[i % 4]} strokeWidth={2.2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="legend-row">
        {series.map((s, i) => (
          <span className="legend-item" key={s.name}>
            <span className="legend-swatch" style={{ background: COMPARE_COLORS[i % 4] }} />
            {s.name} — SLA/TAT adherence
          </span>
        ))}
      </div>
    </>
  );
}

/** Multi-series volume comparison (received), grouped bars. */
export function ComparisonVolumeBars({ series }: { series: { name: string; points: AggregatedPoint[] }[] }) {
  if (!series.length) return <div className="empty-note">Select at least one location to compare.</div>;
  const totals = series.map((s) => ({
    name: s.name,
    value: s.points.reduce((a, p) => a + p.received, 0),
  }));
  const max = Math.max(1, ...totals.map((t) => t.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {totals.map((t, i) => (
        <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 128, fontSize: 12, color: "var(--text-secondary)", flexShrink: 0, textAlign: "right" }}>{t.name}</div>
          <div style={{ flex: 1, background: "var(--gridline)", borderRadius: 5, height: 16, position: "relative", overflow: "hidden" }}>
            <div style={{ width: `${Math.max(2, (t.value / max) * 100)}%`, background: COMPARE_COLORS[i % 4], height: "100%", borderRadius: 5 }} />
          </div>
          <div style={{ width: 92, fontSize: 12.5, fontWeight: 700, color: "var(--psi-navy)" }}>{t.value.toLocaleString("en-IN")}</div>
        </div>
      ))}
    </div>
  );
}
