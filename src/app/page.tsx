"use client";

import { useState } from "react";
import { Shell, ViewId, RoleId } from "@/components/Shell";
import { Toast } from "@/components/Toast";
import { HqView } from "@/components/views/HqView";
import { ZoneView } from "@/components/views/ZoneView";
import { DivisionView } from "@/components/views/DivisionView";
import { CompareView } from "@/components/views/CompareView";
import { MapView } from "@/components/views/MapView";
import { ZONES } from "@/lib/geography";
import { lastNMonths } from "@/lib/durations";

export default function Home() {
  const [view, setView] = useState<ViewId>("hq");
  const [role, setRole] = useState<RoleId>("hq");
  const [toast, setToast] = useState<string | null>(null);

  const [durationKeys, setDurationKeys] = useState<[number, number]>(lastNMonths(36));
  const [fromKey, toKey] = durationKeys;
  const setDuration = (f: number, t: number) => setDurationKeys([f, t]);

  const [zoneId, setZoneId] = useState(ZONES[0].id);
  const [circleId, setCircleId] = useState("");
  const [divisionId, setDivisionId] = useState(ZONES[0].circles[0].divisions[0].id);

  const [compareSelection, setCompareSelection] = useState<string[]>([ZONES[0].id, ZONES[1].id]);

  const showToast = (m: string) => setToast(m);

  function openZone(id: string) {
    setZoneId(id);
    setCircleId("");
    setView("zone");
  }
  function openDivision(id: string) {
    for (const z of ZONES) {
      for (const c of z.circles) {
        if (c.divisions.some((d) => d.id === id)) {
          setZoneId(z.id);
          setCircleId(c.id);
          setDivisionId(id);
        }
      }
    }
    setView("division");
  }

  return (
    <Shell
      view={view}
      setView={setView}
      role={role}
      setRole={setRole}
      onRestricted={() => showToast("That dashboard is restricted under the currently simulated role (RBAC). Switch role in the top bar to preview it.")}
    >
      {view === "hq" && (
        <HqView fromKey={fromKey} toKey={toKey} setDuration={setDuration} onToast={showToast} openZone={openZone} />
      )}
      {view === "zone" && (
        <ZoneView
          zoneId={zoneId}
          circleId={circleId}
          onGeoChange={(g) => {
            setZoneId(g.zoneId);
            setCircleId(g.circleId);
          }}
          fromKey={fromKey}
          toKey={toKey}
          setDuration={setDuration}
          onToast={showToast}
          openDivision={openDivision}
        />
      )}
      {view === "division" && (
        <DivisionView
          zoneId={zoneId}
          circleId={circleId}
          divisionId={divisionId}
          onGeoChange={(g) => {
            setZoneId(g.zoneId);
            setCircleId(g.circleId);
            if (g.divisionId) setDivisionId(g.divisionId);
          }}
          fromKey={fromKey}
          toKey={toKey}
          setDuration={setDuration}
          onToast={showToast}
        />
      )}
      {view === "compare" && (
        <CompareView
          selected={compareSelection}
          setSelected={setCompareSelection}
          fromKey={fromKey}
          toKey={toKey}
          setDuration={setDuration}
          onToast={showToast}
        />
      )}
      {view === "map" && <MapView fromKey={fromKey} toKey={toKey} setDuration={setDuration} openZone={openZone} />}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </Shell>
  );
}
