"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";
import { ZONES, stateToZoneColor } from "@/lib/geography";

const SEQ_STEPS = ["#cde2fb", "#86b6ef", "#3987e5", "#1c5cab", "#0d366b"];

function seqColor(t: number) {
  // t in [0,1]
  const idx = Math.min(SEQ_STEPS.length - 1, Math.floor(t * SEQ_STEPS.length));
  return SEQ_STEPS[idx];
}

export function IndiaMap({
  valueByZone,
  metricLabel,
  onSelectZone,
  format,
}: {
  valueByZone: Record<string, number>;
  metricLabel: string;
  onSelectZone: (zoneId: string) => void;
  format?: (v: number) => string;
}) {
  const [geo, setGeo] = useState<FeatureCollection<Geometry, { NAME_1: string }> | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number; zoneId: string; state: string } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/india_zones.json")
      .then((r) => r.json())
      .then((topo: Topology) => {
        if (cancelled) return;
        const key = Object.keys(topo.objects)[0];
        const obj = topo.objects[key] as GeometryCollection;
        const fc = feature(topo, obj) as unknown as FeatureCollection<Geometry, { NAME_1: string }>;
        setGeo(fc);
      })
      .catch(() => setGeo(null));
    return () => {
      cancelled = true;
    };
  }, []);

  const stateMap = useMemo(() => stateToZoneColor(), []);

  const values = Object.values(valueByZone);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);

  const path = useMemo(() => {
    if (!geo) return null;
    const projection = geoMercator().fitSize([520, 560], geo);
    return geoPath(projection);
  }, [geo]);

  if (!geo || !path) {
    return <div className="empty-note">Loading pan-India geography layer…</div>;
  }

  return (
    <div className="map-wrap" ref={wrapRef} style={{ height: 420 }}>
      <svg viewBox="0 0 520 560" width="100%" height="100%" role="img" aria-label="India zone heatmap">
        {geo.features.map((f, i) => {
          const info = stateMap.get(f.properties.NAME_1);
          const zoneId = info?.zoneId;
          const value = zoneId ? valueByZone[zoneId] ?? 0 : 0;
          const t = max > min ? (value - min) / (max - min) : 0;
          const fill = zoneId ? seqColor(t) : "#e7e9e2";
          const d = path(f);
          if (!d) return null;
          return (
            <path
              key={i}
              d={d}
              className="map-state"
              fill={fill}
              onMouseEnter={(e) => {
                const rect = wrapRef.current?.getBoundingClientRect();
                setHover({
                  x: e.clientX - (rect?.left ?? 0),
                  y: e.clientY - (rect?.top ?? 0),
                  zoneId: zoneId ?? "",
                  state: f.properties.NAME_1,
                });
              }}
              onMouseMove={(e) => {
                const rect = wrapRef.current?.getBoundingClientRect();
                setHover((h) => (h ? { ...h, x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) } : h));
              }}
              onMouseLeave={() => setHover(null)}
              onClick={() => zoneId && onSelectZone(zoneId)}
            />
          );
        })}
      </svg>

      {hover && hover.zoneId && (
        <div className="map-tip" style={{ left: hover.x, top: hover.y }}>
          <div className="viz-tooltip">
            <div className="tt-title">{ZONES.find((z) => z.id === hover.zoneId)?.name}</div>
            <div style={{ color: "var(--psi-muted-on-dark)", fontSize: 10.5, marginBottom: 3 }}>{hover.state}</div>
            <div className="tt-row">
              <span>{metricLabel}</span>
              <span style={{ fontWeight: 700 }}>
                {format ? format(valueByZone[hover.zoneId] ?? 0) : (valueByZone[hover.zoneId] ?? 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="map-legend">
        <div style={{ marginBottom: 4, fontWeight: 700, color: "var(--psi-navy)" }}>{metricLabel}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 10 }}>{format ? format(min) : min}</span>
          <div style={{ display: "flex" }}>
            {SEQ_STEPS.map((c) => (
              <span key={c} style={{ width: 16, height: 10, background: c, display: "inline-block" }} />
            ))}
          </div>
          <span style={{ fontSize: 10 }}>{format ? format(max) : max}</span>
        </div>
        <div style={{ marginTop: 3, fontSize: 9.5, color: "var(--text-muted)" }}>Click a region to open its Zone dashboard</div>
      </div>
    </div>
  );
}
