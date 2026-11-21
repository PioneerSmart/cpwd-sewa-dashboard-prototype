"use client";

import { useMemo, useState } from "react";
import { ZONES } from "@/lib/geography";
import { aggregateSeries, summarize, momChange, slaBreachList, monthLabel } from "@/lib/data";
import { forecastSeries, topAnomalies } from "@/lib/analytics";
import { useWidgetLayout } from "@/lib/widgets";
import { DurationPicker } from "../pickers/DurationPicker";
import { KpiTile, StatusBadge, slaStatus } from "../Kpi";
import { VolumeTrendChart, SlaTrendChart, CategoryBars, CompareBars } from "../charts/Charts";
import { WidgetFrame } from "../WidgetFrame";
import { ExportButton } from "../Toast";

type Metric = "received" | "slaMetPct" | "overdueOpen";
const METRICS: { id: Metric; label: string; format: (v: number) => string }[] = [
  { id: "received", label: "Complaint volume", format: (v) => v.toLocaleString("en-IN") },
  { id: "slaMetPct", label: "SLA / TAT adherence", format: (v) => v.toFixed(1) + "%" },
  { id: "overdueOpen", label: "Overdue backlog", format: (v) => v.toLocaleString("en-IN") },
];

const DEFAULT_WIDGET_ORDER = ["kpis", "volume-trend", "zone-compare", "sla-trend", "category-split", "anomalies", "breach-table"];
const WIDGET_TITLES: Record<string, string> = {
  kpis: "National KPI summary",
  "volume-trend": "Complaint volume trend",
  "zone-compare": "Zone-wise comparison",
  "sla-trend": "SLA / TAT adherence trend",
  "category-split": "Category split",
  anomalies: "Anomalies & alerts",
  "breach-table": "SLA-breach alerts table",
};
const WIDGET_SIZE: Record<string, "full" | "half"> = {
  kpis: "full",
  "volume-trend": "half",
  "zone-compare": "half",
  "sla-trend": "half",
  "category-split": "half",
  anomalies: "full",
  "breach-table": "full",
};

export function HqView({
  fromKey,
  toKey,
  setDuration,
  onToast,
  openZone,
}: {
  fromKey: number;
  toKey: number;
  setDuration: (f: number, t: number) => void;
  onToast: (m: string) => void;
  openZone: (zoneId: string) => void;
}) {
  const [metric, setMetric] = useState<Metric>("received");
  const [focusZoneId, setFocusZoneId] = useState<string | null>(null);
  const [showForecast, setShowForecast] = useState(true);

  const scopeIds = useMemo(() => (focusZoneId ? [focusZoneId] : ZONES.map((z) => z.id)), [focusZoneId]);
  const national = useMemo(() => aggregateSeries(scopeIds, fromKey, toKey), [scopeIds, fromKey, toKey]);
  const s = useMemo(() => summarize(national), [national]);
  const deltaReceived = momChange(national, "received");
  const deltaSla = momChange(national, "slaMetPct");
  const deltaOverdue = momChange(national, "overdueOpen");
  const forecast = useMemo(() => (showForecast ? forecastSeries(national, 3) : undefined), [national, showForecast]);
  const anomalies = useMemo(() => topAnomalies(scopeIds, 6, 6), [scopeIds]);
  const breaches = useMemo(() => slaBreachList(scopeIds, 70).slice(0, 8), [scopeIds]);

  const focusedZone = focusZoneId ? ZONES.find((z) => z.id === focusZoneId) : null;

  const zoneRows = useMemo(() => {
    const m = METRICS.find((x) => x.id === metric)!;
    return ZONES.map((z) => {
      const series = aggregateSeries([z.id], fromKey, toKey);
      const sm = summarize(series);
      const value = metric === "received" ? sm.totalReceived : metric === "slaMetPct" ? sm.avgSla : sm.overdueOpen;
      return { id: z.id, name: z.name, value, color: z.color, fmt: m.format };
    }).sort((a, b) => b.value - a.value);
  }, [fromKey, toKey, metric]);

  const widgets = useWidgetLayout("hq", DEFAULT_WIDGET_ORDER);

  function toggleFocus(zoneId: string) {
    setFocusZoneId((prev) => (prev === zoneId ? null : zoneId));
  }

  const content: Record<string, React.ReactNode> = {
    kpis: (
      <div className="kpi-grid">
        <KpiTile label="Complaints received" value={s.totalReceived.toLocaleString("en-IN")} delta={Math.abs(deltaReceived) + "% MoM"} deltaDir={deltaReceived >= 0 ? "up" : "down"} />
        <KpiTile label="Complaints resolved" value={s.totalResolved.toLocaleString("en-IN")} />
        <KpiTile label="SLA / TAT adherence" value={s.avgSla.toFixed(1)} suffix="%" delta={Math.abs(deltaSla) + "% MoM"} deltaDir={deltaSla >= 0 ? "up" : "down"} />
        <KpiTile label="Avg. resolution time" value={s.avgResolutionDays.toFixed(1)} suffix="days" />
        <KpiTile label="Overdue backlog" value={s.overdueOpen.toLocaleString("en-IN")} delta={Math.abs(deltaOverdue) + "% MoM"} deltaDir={deltaOverdue <= 0 ? "up" : "down"} />
      </div>
    ),
    "volume-trend": (
      <div className="card card-pad">
        <div className="card-head">
          <h3>Complaint volume trend — received vs. resolved{focusedZone ? ` · ${focusedZone.name}` : ""}</h3>
          <span className="hint">{monthLabel(fromKey)} – {monthLabel(toKey)}</span>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>
          <input type="checkbox" checked={showForecast} onChange={(e) => setShowForecast(e.target.checked)} />
          Show 3-month forecast (linear projection from recent trend)
        </label>
        <VolumeTrendChart points={national} forecast={forecast} />
      </div>
    ),
    "zone-compare": (
      <div className="card card-pad">
        <div className="card-head">
          <h3>Zone-wise comparison</h3>
        </div>
        <div className="chip-row" style={{ marginBottom: 12 }}>
          {METRICS.map((m) => (
            <button key={m.id} className={"chip" + (metric === m.id ? " active" : "")} onClick={() => setMetric(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
        <CompareBars
          rows={zoneRows.map((r) => ({ name: r.name, value: r.value, color: r.color, id: r.id }))}
          valueLabel={METRICS.find((m) => m.id === metric)!.label}
          format={METRICS.find((m) => m.id === metric)!.format}
          onRowClick={toggleFocus}
          activeId={focusZoneId}
        />
        <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-muted)" }}>
          Click a zone to cross-filter this whole dashboard in place, or use the <b>GIS Map View</b> / nav to open its full Zone dashboard.
        </div>
      </div>
    ),
    "sla-trend": (
      <div className="card card-pad">
        <div className="card-head">
          <h3>SLA / TAT adherence trend{focusedZone ? ` · ${focusedZone.name}` : ""}</h3>
        </div>
        <SlaTrendChart points={national} forecast={forecast} />
      </div>
    ),
    "category-split": (
      <div className="card card-pad">
        <div className="card-head">
          <h3>Category split — Civil / Electrical / Horticulture{focusedZone ? ` · ${focusedZone.name}` : ""}</h3>
        </div>
        <CategoryBars points={national} />
      </div>
    ),
    anomalies: (
      <div className="card card-pad">
        <div className="card-head">
          <h3>Anomalies &amp; alerts</h3>
          <span className="hint">Sharpest SLA/TAT drops in the last 6 months, auto-surfaced from the trend data</span>
        </div>
        {anomalies.length === 0 ? (
          <div className="empty-note">No significant anomalies detected in the current scope.</div>
        ) : (
          <div className="anomaly-list">
            {anomalies.map((a) => (
              <div className="insight-banner" key={a.divisionId + a.key} style={{ marginBottom: 8 }}>
                <span className="icon">AI</span>
                <div>
                  <b>{a.divisionName}</b> ({a.zoneName} › {a.circleName}) — {a.monthLabel}: a {a.drop}-point SLA/TAT adherence
                  drop month-on-month, now at {a.latestSla.toFixed(1)}%.{" "}
                  <span style={{ color: "var(--text-muted)" }}>(auto-surfaced from the trend data — illustrative)</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    "breach-table": (
      <div className="card card-pad">
        <div className="card-head">
          <h3>SLA-breach alerts — divisions below 70% adherence (latest month)</h3>
          <span className="hint">{focusedZone ? focusedZone.name : "National roll-up"}, lowest first</span>
        </div>
        {breaches.length === 0 ? (
          <div className="empty-note">No divisions currently below threshold.</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Division</th>
                  <th>Zone</th>
                  <th className="num">SLA / TAT adherence</th>
                  <th className="num">Overdue (open)</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {breaches.map((b) => {
                  const zone = ZONES.find((z) => z.circles.some((c) => c.divisions.some((d) => d.id === b.division.id)));
                  return (
                    <tr key={b.division.id}>
                      <td>{b.division.name}</td>
                      <td>{zone?.name}</td>
                      <td className="num">{b.stats.slaMetPct.toFixed(1)}%</td>
                      <td className="num">{b.stats.overdueOpen}</td>
                      <td>
                        <StatusBadge kind={slaStatus(b.stats.slaMetPct)}>{slaStatus(b.stats.slaMetPct).toUpperCase()}</StatusBadge>
                      </td>
                      <td>
                        <button className="btn btn-sm" onClick={() => zone && openZone(zone.id)}>
                          Open zone →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    ),
  };

  return (
    <div>
      <div className="filter-bar">
        <DurationPicker fromKey={fromKey} toKey={toKey} onChange={setDuration} />
        <div className="filter-field">
          <label>Scope</label>
          <span className="role-pill" style={{ marginTop: 2 }}>
            <span className="av">IN</span>
            All India — {ZONES.length} Zones · {ZONES.reduce((a, z) => a + z.circles.length, 0)} Circles ·{" "}
            {ZONES.reduce((a, z) => a + z.circles.reduce((b, c) => b + c.divisions.length, 0), 0)} Divisions
          </span>
        </div>
        {focusedZone && (
          <div className="filter-field">
            <label>Cross-filter</label>
            <button className="chip active" onClick={() => setFocusZoneId(null)} style={{ marginTop: 2 }}>
              {focusedZone.name} ✕
            </button>
          </div>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className={"btn btn-sm" + (widgets.customizing ? " btn-primary" : "")} onClick={() => widgets.setCustomizing((c) => !c)}>
            {widgets.customizing ? "Done customizing" : "⚙ Customize layout"}
          </button>
          <ExportButton
            filename={`cpwd-sewa-national-mis-${monthLabel(fromKey).replace(" ", "")}-${monthLabel(toKey).replace(" ", "")}`}
            headers={["Month", "Received", "Resolved", "SLA / TAT adherence (%)", "Avg. resolution (days)", "Overdue (open)"]}
            rows={national.map((p) => [p.label, p.received, p.resolved, p.slaMetPct, p.avgResolutionDays, p.overdueOpen])}
            onToast={onToast}
          />
        </div>
      </div>

      {widgets.customizing && (
        <div className="empty-note" style={{ marginBottom: 12 }}>
          Drag a widget by its ⠿⠿ handle to reorder, or click Hide/Show to control what appears on this dashboard. Layout is remembered on this device.{" "}
          <button className="btn btn-sm btn-ghost" onClick={widgets.reset}>Reset layout</button>
        </div>
      )}

      <div className="widget-grid">
        {widgets.order.map((id) => (
          <div key={id} style={WIDGET_SIZE[id] === "full" ? { gridColumn: "1 / -1" } : undefined}>
            <WidgetFrame
              id={id}
              title={WIDGET_TITLES[id] ?? id}
              customizing={widgets.customizing}
              hidden={widgets.hidden.includes(id)}
              onToggleHidden={() => widgets.toggleHidden(id)}
              onReorder={(draggedId) => widgets.reorderTo(draggedId, id)}
            >
              {content[id]}
            </WidgetFrame>
          </div>
        ))}
      </div>
    </div>
  );
}
