"use client";

import { useMemo, useState } from "react";
import { ZONES } from "@/lib/geography";
import { aggregateSeries, summarize } from "@/lib/data";
import { DurationPicker } from "../pickers/DurationPicker";
import { IndiaMap } from "../charts/IndiaMap";

type Metric = "received" | "slaMetPct" | "overdueOpen";
const METRICS: { id: Metric; label: string; format: (v: number) => string }[] = [
  { id: "received", label: "Complaint volume", format: (v) => v.toLocaleString("en-IN") },
  { id: "slaMetPct", label: "SLA / TAT adherence", format: (v) => v.toFixed(1) + "%" },
  { id: "overdueOpen", label: "Overdue backlog", format: (v) => v.toLocaleString("en-IN") },
];

export function MapView({
  fromKey,
  toKey,
  setDuration,
  openZone,
}: {
  fromKey: number;
  toKey: number;
  setDuration: (f: number, t: number) => void;
  openZone: (zoneId: string) => void;
}) {
  const [metric, setMetric] = useState<Metric>("received");
  const m = METRICS.find((x) => x.id === metric)!;

  const valueByZone = useMemo(() => {
    const out: Record<string, number> = {};
    for (const z of ZONES) {
      const sm = summarize(aggregateSeries([z.id], fromKey, toKey));
      out[z.id] = metric === "received" ? sm.totalReceived : metric === "slaMetPct" ? sm.avgSla : sm.overdueOpen;
    }
    return out;
  }, [fromKey, toKey, metric]);

  const ranked = Object.entries(valueByZone)
    .map(([id, value]) => ({ zone: ZONES.find((z) => z.id === id)!, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div>
      <div className="filter-bar">
        <DurationPicker fromKey={fromKey} toKey={toKey} onChange={setDuration} />
        <div className="filter-field">
          <label>Colour by</label>
          <div className="chip-row">
            {METRICS.map((x) => (
              <button key={x.id} className={"chip" + (metric === x.id ? " active" : "")} onClick={() => setMetric(x.id)}>
                {x.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <div className="card card-pad">
          <div className="card-head">
            <h3>Pan-India zone heatmap — {m.label.toLowerCase()}</h3>
            <span className="hint">States are grouped into the 6 illustrative CPWD Sewa zones used in this prototype</span>
          </div>
          <IndiaMap valueByZone={valueByZone} metricLabel={m.label} onSelectZone={openZone} format={m.format} />
        </div>
        <div className="card card-pad">
          <div className="card-head">
            <h3>Zone ranking</h3>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Zone</th>
                  <th className="num">{m.label}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((r) => (
                  <tr key={r.zone.id}>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 9, height: 9, borderRadius: 3, background: r.zone.color, display: "inline-block" }} />
                        {r.zone.name}
                      </span>
                    </td>
                    <td className="num">{m.format(r.value)}</td>
                    <td>
                      <button className="btn btn-sm" onClick={() => openZone(r.zone.id)}>
                        Open →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-muted)" }}>
            In production, this layer would render at Zone → Circle → Division → Station granularity directly over CPWD
            Sewa&rsquo;s GPRA colony geocodes via GeoServer / PostGIS.
          </div>
        </div>
      </div>
    </div>
  );
}
