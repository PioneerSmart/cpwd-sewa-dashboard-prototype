"use client";

import { useMemo, useState } from "react";
import { ZONES } from "@/lib/geography";
import { aggregateSeries, summarize, momChange, detectTopAnomaly, slaBreachList, monthLabel } from "@/lib/data";
import { DurationPicker } from "../pickers/DurationPicker";
import { KpiTile, StatusBadge, slaStatus } from "../Kpi";
import { VolumeTrendChart, SlaTrendChart, CategoryBars, CompareBars } from "../charts/Charts";
import { ExportButton } from "../Toast";

type Metric = "received" | "slaMetPct" | "overdueOpen";
const METRICS: { id: Metric; label: string; format: (v: number) => string }[] = [
  { id: "received", label: "Complaint volume", format: (v) => v.toLocaleString("en-IN") },
  { id: "slaMetPct", label: "SLA / TAT adherence", format: (v) => v.toFixed(1) + "%" },
  { id: "overdueOpen", label: "Overdue backlog", format: (v) => v.toLocaleString("en-IN") },
];

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

  const national = useMemo(() => aggregateSeries(ZONES.map((z) => z.id), fromKey, toKey), [fromKey, toKey]);
  const s = useMemo(() => summarize(national), [national]);
  const deltaReceived = momChange(national, "received");
  const deltaSla = momChange(national, "slaMetPct");
  const deltaOverdue = momChange(national, "overdueOpen");
  const anomaly = useMemo(() => detectTopAnomaly(6), []);
  const breaches = useMemo(() => slaBreachList(ZONES.map((z) => z.id), 70).slice(0, 8), []);

  const zoneRows = useMemo(() => {
    const m = METRICS.find((x) => x.id === metric)!;
    return ZONES.map((z) => {
      const series = aggregateSeries([z.id], fromKey, toKey);
      const sm = summarize(series);
      const value = metric === "received" ? sm.totalReceived : metric === "slaMetPct" ? sm.avgSla : sm.overdueOpen;
      return { name: z.name, value, color: z.color, fmt: m.format };
    }).sort((a, b) => (metric === "slaMetPct" ? b.value - a.value : b.value - a.value));
  }, [fromKey, toKey, metric]);

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
        <div style={{ marginLeft: "auto" }}>
          <ExportButton what="the national MIS summary" onToast={onToast} />
        </div>
      </div>

      <div className="kpi-grid">
        <KpiTile label="Complaints received" value={s.totalReceived.toLocaleString("en-IN")} delta={Math.abs(deltaReceived) + "% MoM"} deltaDir={deltaReceived >= 0 ? "up" : "down"} />
        <KpiTile label="Complaints resolved" value={s.totalResolved.toLocaleString("en-IN")} />
        <KpiTile label="SLA / TAT adherence" value={s.avgSla.toFixed(1)} suffix="%" delta={Math.abs(deltaSla) + "% MoM"} deltaDir={deltaSla >= 0 ? "up" : "down"} />
        <KpiTile label="Avg. resolution time" value={s.avgResolutionDays.toFixed(1)} suffix="days" />
        <KpiTile label="Overdue backlog" value={s.overdueOpen.toLocaleString("en-IN")} delta={Math.abs(deltaOverdue) + "% MoM"} deltaDir={deltaOverdue <= 0 ? "up" : "down"} />
      </div>

      {anomaly && (
        <div className="insight-banner">
          <span className="icon">AI</span>
          <div>
            <b>Anomaly flagged</b> — {anomaly.division.name} ({monthLabel(anomaly.key)}) shows a {anomaly.drop}-point SLA/TAT
            adherence drop month-on-month, the sharpest in the last 6 months nationally. Recommend prioritising this
            division in the next review cycle. <span style={{ color: "var(--text-muted)" }}>(auto-surfaced from the trend data — illustrative)</span>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card card-pad">
          <div className="card-head">
            <h3>Complaint volume trend — received vs. resolved</h3>
            <span className="hint">{monthLabel(fromKey)} – {monthLabel(toKey)}</span>
          </div>
          <VolumeTrendChart points={national} />
        </div>
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
            rows={zoneRows.map((r) => ({ name: r.name, value: r.value, color: r.color }))}
            valueLabel={METRICS.find((m) => m.id === metric)!.label}
            format={METRICS.find((m) => m.id === metric)!.format}
          />
          <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-muted)" }}>
            Click a zone in the <b>GIS Map View</b> for the same drill-down, or use the nav to open a Zone dashboard directly.
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card card-pad">
          <div className="card-head">
            <h3>SLA / TAT adherence trend</h3>
          </div>
          <SlaTrendChart points={national} />
        </div>
        <div className="card card-pad">
          <div className="card-head">
            <h3>Category split — Civil / Electrical / Horticulture</h3>
          </div>
          <CategoryBars points={national} />
        </div>
      </div>

      <div className="card card-pad">
        <div className="card-head">
          <h3>SLA-breach alerts — divisions below 70% adherence (latest month)</h3>
          <span className="hint">National roll-up, lowest first</span>
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
    </div>
  );
}
