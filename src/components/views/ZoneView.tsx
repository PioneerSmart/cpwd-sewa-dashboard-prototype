"use client";

import { useMemo } from "react";
import { findZone } from "@/lib/geography";
import { aggregateSeries, summarize, momChange, slaBreachList, monthLabel } from "@/lib/data";
import { GeographyPicker, scopeNodeId } from "../pickers/GeographyPicker";
import { DurationPicker } from "../pickers/DurationPicker";
import { KpiTile, StatusBadge, slaStatus } from "../Kpi";
import { VolumeTrendChart, SlaTrendChart, CategoryBars, CompareBars } from "../charts/Charts";
import { ExportButton } from "../Toast";

export function ZoneView({
  zoneId,
  circleId,
  onGeoChange,
  fromKey,
  toKey,
  setDuration,
  onToast,
  openDivision,
}: {
  zoneId: string;
  circleId: string;
  onGeoChange: (g: { zoneId: string; circleId: string; divisionId: string }) => void;
  fromKey: number;
  toKey: number;
  setDuration: (f: number, t: number) => void;
  onToast: (m: string) => void;
  openDivision: (divisionId: string) => void;
}) {
  const zone = findZone(zoneId)!;
  const scope = scopeNodeId(zoneId, circleId, "");
  const series = useMemo(() => aggregateSeries([scope], fromKey, toKey), [scope, fromKey, toKey]);
  const s = useMemo(() => summarize(series), [series]);
  const deltaReceived = momChange(series, "received");
  const deltaSla = momChange(series, "slaMetPct");

  const circleRows = useMemo(() => {
    return zone.circles.map((c) => {
      const sm = summarize(aggregateSeries([c.id], fromKey, toKey));
      return { name: c.name, value: sm.totalReceived, sla: sm.avgSla, color: zone.color, id: c.id };
    });
  }, [zone, fromKey, toKey]);

  const breaches = useMemo(() => slaBreachList([scope], 75), [scope]);

  return (
    <div>
      <div className="filter-bar">
        <GeographyPicker zoneId={zoneId} circleId={circleId} divisionId="" onChange={onGeoChange} allowDivision={false} />
        <DurationPicker fromKey={fromKey} toKey={toKey} onChange={setDuration} />
        <div style={{ marginLeft: "auto" }}>
          <ExportButton
            filename={`cpwd-sewa-${circleId || zoneId}-mis-${monthLabel(fromKey).replace(" ", "")}-${monthLabel(toKey).replace(" ", "")}`}
            headers={["Month", "Received", "Resolved", "SLA / TAT adherence (%)", "Avg. resolution (days)", "Overdue (open)"]}
            rows={series.map((p) => [p.label, p.received, p.resolved, p.slaMetPct, p.avgResolutionDays, p.overdueOpen])}
            onToast={onToast}
          />
        </div>
      </div>

      <div className="kpi-grid">
        <KpiTile label="Complaints received" value={s.totalReceived.toLocaleString("en-IN")} delta={Math.abs(deltaReceived) + "% MoM"} deltaDir={deltaReceived >= 0 ? "up" : "down"} />
        <KpiTile label="Complaints resolved" value={s.totalResolved.toLocaleString("en-IN")} />
        <KpiTile label="SLA / TAT adherence" value={s.avgSla.toFixed(1)} suffix="%" delta={Math.abs(deltaSla) + "% MoM"} deltaDir={deltaSla >= 0 ? "up" : "down"} />
        <KpiTile label="Avg. resolution time" value={s.avgResolutionDays.toFixed(1)} suffix="days" />
        <KpiTile label="Overdue backlog" value={s.overdueOpen.toLocaleString("en-IN")} />
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
            <h3>Circle-wise comparison within {zone.name}</h3>
          </div>
          <CompareBars
            rows={circleRows.map((r) => ({ name: r.name, value: r.value, color: r.color, id: r.id }))}
            valueLabel="Complaints received"
            onRowClick={(id) => onGeoChange({ zoneId, circleId: id, divisionId: "" })}
            activeId={circleId || null}
          />
          <div className="table-wrap" style={{ marginTop: 12 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Circle</th>
                  <th className="num">SLA / TAT adherence</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {circleRows.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td className="num">{c.sla.toFixed(1)}%</td>
                    <td>
                      <button className="btn btn-sm" onClick={() => onGeoChange({ zoneId, circleId: c.id, divisionId: "" })}>
                        View circle →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card card-pad">
          <div className="card-head">
            <h3>SLA / TAT adherence trend</h3>
          </div>
          <SlaTrendChart points={series} />
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
          <h3>Division-level SLA-breach alerts {circleId ? "in this circle" : "in this zone"}</h3>
          <span className="hint">Below 75% adherence, latest month</span>
        </div>
        {breaches.length === 0 ? (
          <div className="empty-note">No divisions currently below threshold.</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Division</th>
                  <th>Seat</th>
                  <th className="num">SLA / TAT adherence</th>
                  <th className="num">Overdue (open)</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {breaches.map((b) => (
                  <tr key={b.division.id}>
                    <td>{b.division.name}</td>
                    <td>{b.division.seat}</td>
                    <td className="num">{b.stats.slaMetPct.toFixed(1)}%</td>
                    <td className="num">{b.stats.overdueOpen}</td>
                    <td>
                      <StatusBadge kind={slaStatus(b.stats.slaMetPct)}>{slaStatus(b.stats.slaMetPct).toUpperCase()}</StatusBadge>
                    </td>
                    <td>
                      <button className="btn btn-sm" onClick={() => openDivision(b.division.id)}>
                        Open division →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
