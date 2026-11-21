"use client";

import { useMemo, useState } from "react";
import { RoleScope, scopeBreadcrumb, scopeNodeIds } from "@/lib/roles";
import { MEASURES, PivotDimension, buildPivot, downloadCSV, toCSV } from "@/lib/analytics";
import { ZONES } from "@/lib/geography";
import { DurationPicker } from "../pickers/DurationPicker";
import { CompareBars } from "../charts/Charts";
import { monthLabel } from "@/lib/data";

type MeasureId = (typeof MEASURES)[number]["id"];

function dimensionOptionsFor(scope: RoleScope): { id: PivotDimension; label: string }[] {
  if (scope.kind === "all") return [{ id: "zone", label: "Zone" }, { id: "circle", label: "Circle" }, { id: "division", label: "Division" }];
  if (scope.kind === "zone") return [{ id: "circle", label: "Circle" }, { id: "division", label: "Division" }];
  return [{ id: "division", label: "Division" }];
}

export function ReportBuilderView({
  scope,
  fromKey,
  toKey,
  setDuration,
  onToast,
}: {
  scope: RoleScope;
  fromKey: number;
  toKey: number;
  setDuration: (f: number, t: number) => void;
  onToast: (m: string) => void;
}) {
  const dimOptions = useMemo(() => dimensionOptionsFor(scope), [scope]);
  const [requestedDimension, setDimension] = useState<PivotDimension>(dimOptions[0].id);
  // If the role's scope narrows (e.g. "All India" -> "Zone"), the previously selected
  // breakdown may no longer be offered — fall back to the first valid option for render
  // without needing an effect + extra re-render to correct the stored state.
  const dimension = dimOptions.some((d) => d.id === requestedDimension) ? requestedDimension : dimOptions[0].id;

  const [measures, setMeasures] = useState<MeasureId[]>(["received", "slaMetPct", "overdueOpen"]);
  const [sortKey, setSortKey] = useState<MeasureId>("received");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const rootIds = useMemo(() => scopeNodeIds(scope), [scope]);
  const rows = useMemo(() => buildPivot(rootIds, dimension, fromKey, toKey), [rootIds, dimension, fromKey, toKey]);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => (sortDir === "desc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]));
    return copy;
  }, [rows, sortKey, sortDir]);

  function toggleMeasure(id: MeasureId) {
    setMeasures((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) {
          onToast("Keep at least one measure selected.");
          return prev;
        }
        return prev.filter((m) => m !== id);
      }
      return [...prev, id];
    });
  }

  function sortBy(id: MeasureId) {
    if (sortKey === id) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(id);
      setSortDir("desc");
    }
  }

  const primaryMeasure = MEASURES.find((m) => m.id === (measures.includes(sortKey) ? sortKey : measures[0]))!;
  const chartColor = dimension === "zone" ? undefined : "var(--seq-550)";

  function exportCSV() {
    const selected = MEASURES.filter((m) => measures.includes(m.id));
    const headers = ["Label", "Zone / Circle", ...selected.map((m) => m.label)];
    const csvRows = sorted.map((r) => [r.label, r.secondary ?? "", ...selected.map((m) => r[m.id])]);
    downloadCSV(`cpwd-sewa-report-${dimension}-${monthLabel(fromKey).replace(" ", "")}-${monthLabel(toKey).replace(" ", "")}`, toCSV(headers, csvRows));
    onToast("Report exported as CSV — opens directly in Excel / Google Sheets.");
  }

  return (
    <div>
      <div className="filter-bar">
        <DurationPicker fromKey={fromKey} toKey={toKey} onChange={setDuration} />
        <div className="filter-field">
          <label>Break down by</label>
          <select className="select" value={dimension} onChange={(e) => setDimension(e.target.value as PivotDimension)}>
            {dimOptions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label>Reporting scope</label>
          <span className="role-pill" style={{ marginTop: 2 }}>
            <span className="av">◎</span>
            {scopeBreadcrumb(scope)}
          </span>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button className="btn btn-sm btn-primary" onClick={exportCSV}>
            ⬇ Export CSV
          </button>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <div className="card-head">
          <h3>Measures</h3>
          <span className="hint">Pick what to include — the table, chart and CSV export all follow this selection</span>
        </div>
        <div className="chip-row">
          {MEASURES.map((m) => (
            <button key={m.id} className={"chip" + (measures.includes(m.id) ? " active" : "")} onClick={() => toggleMeasure(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="card card-pad">
          <div className="card-head">
            <h3>{primaryMeasure.label} by {dimOptions.find((d) => d.id === dimension)?.label.toLowerCase()}</h3>
            <span className="hint">{monthLabel(fromKey)} – {monthLabel(toKey)}</span>
          </div>
          {sorted.length === 0 ? (
            <div className="empty-note">No entities in scope for this breakdown.</div>
          ) : (
            <CompareBars
              rows={sorted.map((r) => ({
                name: r.label,
                value: r[primaryMeasure.id],
                color: dimension === "zone" ? ZONES.find((z) => z.id === r.id)?.color ?? "var(--seq-550)" : chartColor ?? "var(--seq-550)",
              }))}
              valueLabel={primaryMeasure.label}
              format={primaryMeasure.format}
            />
          )}
        </div>
        <div className="card card-pad">
          <div className="card-head">
            <h3>Ad-hoc pivot table</h3>
            <span className="hint">Click a column header to sort</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{dimOptions.find((d) => d.id === dimension)?.label}</th>
                  {MEASURES.filter((m) => measures.includes(m.id)).map((m) => (
                    <th key={m.id} className="num sortable" onClick={() => sortBy(m.id)}>
                      {m.label}
                      {sortKey === m.id ? (sortDir === "desc" ? " ▼" : " ▲") : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.label}
                      {r.secondary ? <div className="hint">{r.secondary}</div> : null}
                    </td>
                    {MEASURES.filter((m) => measures.includes(m.id)).map((m) => (
                      <td key={m.id} className="num">
                        {m.format(r[m.id])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
