"use client";

import { useMemo } from "react";
import { findDivision } from "@/lib/geography";
import { aggregateSeries, summarize, momChange, officersForDivision, recentTicketsForDivision, monthLabel, CATEGORIES } from "@/lib/data";
import { GeographyPicker } from "../pickers/GeographyPicker";
import { DurationPicker } from "../pickers/DurationPicker";
import { KpiTile, StatusBadge, slaStatus } from "../Kpi";
import { VolumeTrendChart, SlaTrendChart, CategoryBars } from "../charts/Charts";
import { ExportButton } from "../Toast";

const TICKET_BADGE: Record<string, "good" | "warning" | "serious" | "critical"> = {
  Resolved: "good",
  "In Progress": "warning",
  Open: "serious",
  Overdue: "critical",
};

export function DivisionView({
  zoneId,
  circleId,
  divisionId,
  onGeoChange,
  fromKey,
  toKey,
  setDuration,
  onToast,
}: {
  zoneId: string;
  circleId: string;
  divisionId: string;
  onGeoChange: (g: { zoneId: string; circleId: string; divisionId: string }) => void;
  fromKey: number;
  toKey: number;
  setDuration: (f: number, t: number) => void;
  onToast: (m: string) => void;
}) {
  const found = findDivision(divisionId);

  const series = useMemo(
    () => (found ? aggregateSeries([found.division.id], fromKey, toKey) : []),
    [found, fromKey, toKey]
  );
  const s = useMemo(() => summarize(series), [series]);
  const deltaReceived = momChange(series, "received");
  const officers = useMemo(() => (found ? officersForDivision(found.division) : []), [found]);
  const tickets = useMemo(() => (found ? recentTicketsForDivision(found.division, 16) : []), [found]);

  if (!found) return <div className="empty-note">Select a division to view its operational dashboard.</div>;
  const { division, circle, zone } = found;

  return (
    <div>
      <div className="filter-bar">
        <GeographyPicker zoneId={zoneId} circleId={circleId || circle.id} divisionId={divisionId} onChange={onGeoChange} />
        <DurationPicker fromKey={fromKey} toKey={toKey} onChange={setDuration} />
        <div style={{ marginLeft: "auto" }}>
          <ExportButton what="this division's complaint register" onToast={onToast} />
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div>
            <h3 style={{ fontSize: 15 }}>{division.name}</h3>
            <span className="hint">
              {zone.name} → {circle.name} · Seat: {division.seat}
            </span>
          </div>
          <StatusBadge kind={slaStatus(s.avgSla)}>{slaStatus(s.avgSla).toUpperCase()} — {s.avgSla.toFixed(1)}% SLA/TAT</StatusBadge>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiTile label="Complaints received" value={s.totalReceived.toLocaleString("en-IN")} delta={Math.abs(deltaReceived) + "% MoM"} deltaDir={deltaReceived >= 0 ? "up" : "down"} />
        <KpiTile label="Complaints resolved" value={s.totalResolved.toLocaleString("en-IN")} />
        <KpiTile label="SLA / TAT adherence" value={s.avgSla.toFixed(1)} suffix="%" />
        <KpiTile label="Avg. resolution time" value={s.avgResolutionDays.toFixed(1)} suffix="days" />
        <KpiTile label="Overdue (open)" value={s.overdueOpen.toLocaleString("en-IN")} />
      </div>

      <div className="grid-2">
        <div className="card card-pad">
          <div className="card-head">
            <h3>Volume trend — received vs. resolved</h3>
            <span className="hint">{monthLabel(fromKey)} – {monthLabel(toKey)}</span>
          </div>
          <VolumeTrendChart points={series} />
        </div>
        <div className="card card-pad">
          <div className="card-head">
            <h3>SLA / TAT adherence trend</h3>
          </div>
          <SlaTrendChart points={series} />
        </div>
      </div>

      <div className="grid-2">
        <div className="card card-pad">
          <div className="card-head">
            <h3>Officer-wise workload (latest month)</h3>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Officer</th>
                  <th className="num">Assigned</th>
                  <th className="num">Resolved</th>
                  <th className="num">Avg. days</th>
                </tr>
              </thead>
              <tbody>
                {officers.map((o) => (
                  <tr key={o.id}>
                    <td>{o.name}</td>
                    <td className="num">{o.assigned}</td>
                    <td className="num">{o.resolved}</td>
                    <td className="num">{o.avgDays.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card card-pad">
          <div className="card-head">
            <h3>Category split — Civil / Electrical / Horticulture</h3>
          </div>
          <CategoryBars points={series} />
        </div>
      </div>

      <div className="card card-pad">
        <div className="card-head">
          <h3>Recent complaints — station / colony detail</h3>
          <span className="hint">Synthetic ticket-level sample for the demo</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>GPRA Colony / Station</th>
                <th>Category</th>
                <th>Officer</th>
                <th className="num">Days open</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.colony}</td>
                  <td>{CATEGORIES.find((c) => c.id === t.category)?.label}</td>
                  <td>{t.officer}</td>
                  <td className="num">{t.daysOpen}</td>
                  <td>
                    <StatusBadge kind={TICKET_BADGE[t.status]}>{t.status}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
