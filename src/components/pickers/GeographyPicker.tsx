"use client";

import { ZONES } from "@/lib/geography";

/** Cascading Zone -> Circle -> Division picker. Any level may be "" (whole-zone / whole-circle scope). */
export function GeographyPicker({
  zoneId,
  circleId,
  divisionId,
  onChange,
  allowDivision = true,
}: {
  zoneId: string;
  circleId: string;
  divisionId: string;
  onChange: (next: { zoneId: string; circleId: string; divisionId: string }) => void;
  allowDivision?: boolean;
}) {
  const zone = ZONES.find((z) => z.id === zoneId);
  const circle = zone?.circles.find((c) => c.id === circleId);

  return (
    <>
      <div className="filter-field">
        <label>Zone</label>
        <select
          className="select"
          value={zoneId}
          onChange={(e) => onChange({ zoneId: e.target.value, circleId: "", divisionId: "" })}
        >
          {ZONES.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-field">
        <label>Circle</label>
        <select
          className="select"
          value={circleId}
          onChange={(e) => onChange({ zoneId, circleId: e.target.value, divisionId: "" })}
        >
          <option value="">All circles</option>
          {zone?.circles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {allowDivision && (
        <div className="filter-field">
          <label>Division</label>
          <select
            className="select"
            value={divisionId}
            disabled={!circle}
            onChange={(e) => onChange({ zoneId, circleId, divisionId: e.target.value })}
          >
            <option value="">All divisions</option>
            {circle?.divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}

/** Resolves the scoped node id to query data for: the most specific level chosen. */
export function scopeNodeId(zoneId: string, circleId: string, divisionId: string): string {
  return divisionId || circleId || zoneId;
}
