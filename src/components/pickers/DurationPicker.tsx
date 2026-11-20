"use client";

import { useState } from "react";
import { presets } from "@/lib/durations";
import { DATA_START, DATA_END, toMonthKey } from "@/lib/data";

export function DurationPicker({
  fromKey,
  toKey,
  onChange,
}: {
  fromKey: number;
  toKey: number;
  onChange: (fromKey: number, toKey: number) => void;
}) {
  const [custom, setCustom] = useState(false);
  const list = presets();
  const matched = list.find((p) => p.fromKey === fromKey && p.toKey === toKey);

  const years: number[] = [];
  for (let y = DATA_START.y; y <= DATA_END.y; y++) years.push(y);

  const fromYear = Math.floor(fromKey / 12);
  const toYear = Math.floor(toKey / 12);

  return (
    <div className="filter-field">
      <label>Duration</label>
      {!custom ? (
        <select
          className="select"
          value={matched ? matched.id : "custom"}
          onChange={(e) => {
            if (e.target.value === "custom") {
              setCustom(true);
              return;
            }
            const p = list.find((x) => x.id === e.target.value)!;
            onChange(p.fromKey, p.toKey);
          }}
        >
          {list.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
          <option value="custom">Custom range…</option>
        </select>
      ) : (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <select
            className="select"
            value={fromYear}
            onChange={(e) => onChange(toMonthKey(Number(e.target.value), 1), toKey)}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <span style={{ color: "var(--text-muted)", fontSize: 11 }}>to</span>
          <select
            className="select"
            value={toYear}
            onChange={(e) => {
              const y = Number(e.target.value);
              const cappedKey = Math.min(toMonthKey(y, 12), toMonthKey(DATA_END.y, DATA_END.m));
              onChange(fromKey, cappedKey);
            }}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button className="btn btn-sm btn-ghost" onClick={() => setCustom(false)}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
