"use client";

import { useMemo, useState } from "react";
import { ZONES, nodeLabel } from "@/lib/geography";
import { aggregateSeries, summarize, monthLabel } from "@/lib/data";
import { DurationPicker } from "../pickers/DurationPicker";
import { GeographyPicker, scopeNodeId } from "../pickers/GeographyPicker";
import { ComparisonLineChart, ComparisonVolumeBars } from "../charts/Charts";
import { ExportButton } from "../Toast";

const PILL_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"];
const MAX_COMPARE = 4;

export function CompareView({
  selected,
  setSelected,
  fromKey,
  toKey,
  setDuration,
  onToast,
}: {
  selected: string[];
  setSelected: (ids: string[]) => void;
  fromKey: number;
  toKey: number;
  setDuration: (f: number, t: number) => void;
  onToast: (m: string) => void;
}) {
  const [pz, setPz] = useState(ZONES[0].id);
  const [pc, setPc] = useState("");
  const [pd, setPd] = useState("");

  const addCurrent = () => {
    const id = scopeNodeId(pz, pc, pd);
    if (selected.includes(id)) {
      onToast("That location is already in the comparison.");
      return;
    }
    if (selected.length >= MAX_COMPARE) {
      onToast(`Comparison mode supports up to ${MAX_COMPARE} locations at a time for readability.`);
      return;
    }
    setSelected([...selected, id]);
  };

  const series = useMemo(
    () => selected.map((id) => ({ name: nodeLabel(id), points: aggregateSeries([id], fromKey, toKey) })),
    [selected, fromKey, toKey]
  );

  return (
    <div>
      <div className="filter-bar">
        <GeographyPicker zoneId={pz} circleId={pc} divisionId={pd} onChange={(g) => { setPz(g.zoneId); setPc(g.circleId); setPd(g.divisionId); }} />
        <div className="filter-field">
          <label>&nbsp;</label>
          <button className="btn btn-primary btn-sm" onClick={addCurrent}>
            + Add to comparison
          </button>
        </div>
        <DurationPicker fromKey={fromKey} toKey={toKey} onChange={setDuration} />
        <div style={{ marginLeft: "auto" }}>
          <ExportButton
            filename={`cpwd-sewa-comparison-${monthLabel(fromKey).replace(" ", "")}-${monthLabel(toKey).replace(" ", "")}`}
            headers={["Location", "Received", "Resolved", "SLA / TAT adherence (%)", "Avg. resolution (days)", "Overdue (open)"]}
            rows={series.map((s) => {
              const sm = summarize(s.points);
              return [s.name, sm.totalReceived, sm.totalResolved, sm.avgSla, sm.avgResolutionDays, sm.overdueOpen];
            })}
            onToast={onToast}
          />
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <div className="card-head">
          <h3>Comparing {selected.length ? selected.length : "no"} location{selected.length === 1 ? "" : "s"}</h3>
          <span className="hint">{monthLabel(fromKey)} – {monthLabel(toKey)} · up to {MAX_COMPARE} at a time</span>
        </div>
        {selected.length === 0 ? (
          <div className="empty-note">Use the picker above to add Zones, Circles or Divisions to compare side by side.</div>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {selected.map((id, i) => (
              <span key={id} className="compare-pill" style={{ background: PILL_COLORS[i % 4] }}>
                {nodeLabel(id)}
                <button onClick={() => setSelected(selected.filter((x) => x !== id))} aria-label="Remove">
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <>
          <div className="kpi-grid" style={{ gridTemplateColumns: `repeat(${selected.length}, minmax(0,1fr))` }}>
            {series.map((s, i) => {
              const sm = summarize(s.points);
              return (
                <div className="kpi-tile" key={s.name} style={{ borderTop: `3px solid ${PILL_COLORS[i % 4]}` }}>
                  <span className="kpi-label">{s.name}</span>
                  <span className="kpi-value" style={{ fontSize: 19 }}>{sm.totalReceived.toLocaleString("en-IN")}</span>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    received · {sm.avgSla.toFixed(1)}% SLA/TAT · {sm.avgResolutionDays.toFixed(1)}d avg
                  </span>
                </div>
              );
            })}
          </div>

          <div className="grid-2">
            <div className="card card-pad">
              <div className="card-head">
                <h3>SLA / TAT adherence — overlaid comparison</h3>
              </div>
              <ComparisonLineChart series={series} />
            </div>
            <div className="card card-pad">
              <div className="card-head">
                <h3>Total complaint volume over selected period</h3>
              </div>
              <ComparisonVolumeBars series={series} />
            </div>
          </div>

          <div className="card card-pad">
            <div className="card-head">
              <h3>Detailed comparison table</h3>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th className="num">Received</th>
                    <th className="num">Resolved</th>
                    <th className="num">SLA / TAT adherence</th>
                    <th className="num">Avg. resolution (days)</th>
                    <th className="num">Overdue (open)</th>
                  </tr>
                </thead>
                <tbody>
                  {series.map((s) => {
                    const sm = summarize(s.points);
                    return (
                      <tr key={s.name}>
                        <td>{s.name}</td>
                        <td className="num">{sm.totalReceived.toLocaleString("en-IN")}</td>
                        <td className="num">{sm.totalResolved.toLocaleString("en-IN")}</td>
                        <td className="num">{sm.avgSla.toFixed(1)}%</td>
                        <td className="num">{sm.avgResolutionDays.toFixed(1)}</td>
                        <td className="num">{sm.overdueOpen.toLocaleString("en-IN")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
