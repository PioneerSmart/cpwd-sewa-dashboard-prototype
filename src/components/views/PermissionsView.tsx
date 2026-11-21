"use client";

import { useState } from "react";
import { NAV, ViewId } from "../Shell";
import {
  DEFAULT_ROLES,
  Role,
  RoleScope,
  ScopeKind,
  emptyScopeFor,
  initialsFor,
  makeRoleId,
  scopeBreadcrumb,
  scopeCoverage,
  scopeNodeIds,
} from "@/lib/roles";
import { ZONES, findCircle, findDivision, findZone } from "@/lib/geography";
import { END_KEY, aggregateSeries, summarize } from "@/lib/data";

function ScopeEditor({ scope, onChange }: { scope: RoleScope; onChange: (s: RoleScope) => void }) {
  const init = (() => {
    let z = ZONES[0];
    let c = ZONES[0].circles[0];
    let d = ZONES[0].circles[0].divisions[0];
    if (scope.nodeId) {
      const fz = findZone(scope.nodeId);
      if (fz) z = fz;
      const fc = findCircle(scope.nodeId);
      if (fc) {
        z = fc.zone;
        c = fc.circle;
      }
      const fd = findDivision(scope.nodeId);
      if (fd) {
        z = fd.zone;
        c = fd.circle;
        d = fd.division;
      }
    }
    return { zoneId: z.id, circleId: c.id, divisionId: d.id };
  })();
  const [zoneId, setZoneId] = useState(init.zoneId);
  const [circleId, setCircleId] = useState(init.circleId);
  const [divisionId, setDivisionId] = useState(init.divisionId);

  const zone = ZONES.find((z) => z.id === zoneId) ?? ZONES[0];
  const circle = zone.circles.find((c) => c.id === circleId) ?? zone.circles[0];

  function commit(kind: ScopeKind, z = zoneId, c = circleId, d = divisionId) {
    if (kind === "all") onChange({ kind: "all" });
    else if (kind === "zone") onChange({ kind, nodeId: z });
    else if (kind === "circle") onChange({ kind, nodeId: c });
    else onChange({ kind, nodeId: d });
  }

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
      <select className="select" value={scope.kind} onChange={(e) => commit(e.target.value as ScopeKind)}>
        <option value="all">All India</option>
        <option value="zone">Zone</option>
        <option value="circle">Circle</option>
        <option value="division">Division</option>
      </select>
      {scope.kind !== "all" && (
        <select
          className="select"
          value={zoneId}
          onChange={(e) => {
            const nz = ZONES.find((z) => z.id === e.target.value)!;
            setZoneId(nz.id);
            setCircleId(nz.circles[0].id);
            setDivisionId(nz.circles[0].divisions[0].id);
            commit(scope.kind, nz.id, nz.circles[0].id, nz.circles[0].divisions[0].id);
          }}
        >
          {ZONES.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </select>
      )}
      {(scope.kind === "circle" || scope.kind === "division") && (
        <select
          className="select"
          value={circleId}
          onChange={(e) => {
            const nc = zone.circles.find((c) => c.id === e.target.value)!;
            setCircleId(nc.id);
            setDivisionId(nc.divisions[0].id);
            commit(scope.kind, zoneId, nc.id, nc.divisions[0].id);
          }}
        >
          {zone.circles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}
      {scope.kind === "division" && (
        <select
          className="select"
          value={divisionId}
          onChange={(e) => {
            setDivisionId(e.target.value);
            commit(scope.kind, zoneId, circleId, e.target.value);
          }}
        >
          {circle.divisions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export function PermissionsView({
  roles,
  setRoles,
  activeRoleId,
  setActiveRoleId,
  onToast,
}: {
  roles: Role[];
  setRoles: (updater: Role[] | ((prev: Role[]) => Role[])) => void;
  activeRoleId: string;
  setActiveRoleId: (id: string) => void;
  onToast: (m: string) => void;
}) {
  const activeRole = roles.find((r) => r.id === activeRoleId) ?? roles[0];
  const coverage = scopeCoverage(activeRole.scope);

  const allIds = ZONES.map((z) => z.id);
  const latestAll = summarize(aggregateSeries(allIds, END_KEY, END_KEY));
  const latestScope = summarize(aggregateSeries(scopeNodeIds(activeRole.scope), END_KEY, END_KEY));
  const recordPct = latestAll.totalReceived > 0 ? Math.round((latestScope.totalReceived / latestAll.totalReceived) * 1000) / 10 : 0;

  function toggleView(roleId: string, viewId: ViewId) {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== roleId) return r;
        const has = r.views.includes(viewId);
        if (has && r.views.length === 1) {
          onToast("A role needs at least one visible dashboard.");
          return r;
        }
        const views = has ? r.views.filter((v) => v !== viewId) : [...r.views, viewId];
        return { ...r, views };
      })
    );
  }

  function setScope(roleId: string, scope: RoleScope) {
    setRoles((prev) => prev.map((r) => (r.id === roleId ? { ...r, scope } : r)));
  }

  function deleteRole(roleId: string) {
    setRoles((prev) => prev.filter((r) => r.id !== roleId));
    if (activeRoleId === roleId) setActiveRoleId(DEFAULT_ROLES[0].id);
    onToast("Custom role removed.");
  }

  // --- custom role builder ---
  const [newName, setNewName] = useState("");
  const [newScope, setNewScope] = useState<RoleScope>(emptyScopeFor("zone"));
  const [newViews, setNewViews] = useState<ViewId[]>(["zone", "division", "compare"]);

  function addRole() {
    const name = newName.trim();
    if (!name) {
      onToast("Give the new role a name first.");
      return;
    }
    const role: Role = {
      id: makeRoleId(name),
      label: name,
      initials: initialsFor(name),
      builtin: false,
      views: newViews.length ? newViews : ["hq"],
      scope: newScope,
    };
    setRoles((prev) => [...prev, role]);
    setActiveRoleId(role.id);
    setNewName("");
    onToast(`Custom role "${name}" created — now previewing the dashboard as this role.`);
  }

  return (
    <div>
      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <div className="card-head">
          <h3>Data-scoping visualizer</h3>
          <span className="hint">What the currently simulated role is entitled to see, computed live from the data model</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 28, alignItems: "flex-end" }}>
          <div>
            <div className="scope-viz-label">Previewing as</div>
            <div className="role-pill" style={{ marginTop: 3 }}>
              <span className="av">{activeRole.initials}</span>
              {activeRole.label}
            </div>
          </div>
          <div>
            <div className="scope-viz-label">Geography entitlement</div>
            <div style={{ fontWeight: 700, color: "var(--psi-navy)", marginTop: 3 }}>{scopeBreadcrumb(activeRole.scope)}</div>
          </div>
          <div style={{ minWidth: 180 }}>
            <div className="scope-viz-label">
              Divisions visible — {coverage.divisionCount} of {coverage.totalDivisions} ({coverage.pct}%)
            </div>
            <div className="coverage-bar">
              <div className="coverage-bar-fill" style={{ width: `${coverage.pct}%` }} />
            </div>
          </div>
          <div style={{ minWidth: 200 }}>
            <div className="scope-viz-label">
              Complaint records (latest month) — {recordPct}% of national volume
            </div>
            <div className="coverage-bar">
              <div className="coverage-bar-fill" style={{ width: `${recordPct}%`, background: "var(--psi-gold)" }} />
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>
              {latestScope.totalReceived.toLocaleString("en-IN")} visible of {latestAll.totalReceived.toLocaleString("en-IN")} nationally —
              the remainder is masked out by this role&rsquo;s data-ownership scope.
            </div>
          </div>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <div className="card-head">
          <h3>Live permission matrix</h3>
          <span className="hint">Flip a dashboard checkbox or change a scope — the sidebar and topbar for that role update immediately</span>
        </div>
        <div className="table-wrap">
          <table className="data-table matrix-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Data scope</th>
                {NAV.map((n) => (
                  <th key={n.id} className="num" title={n.desc}>
                    {n.label}
                  </th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id} className={r.id === activeRoleId ? "matrix-row-active" : ""}>
                  <td>
                    <button className="btn btn-sm" onClick={() => setActiveRoleId(r.id)} title="Preview the dashboard as this role">
                      {r.label}
                      {r.id === activeRoleId ? " ✓" : ""}
                    </button>
                  </td>
                  <td>
                    <ScopeEditor scope={r.scope} onChange={(s) => setScope(r.id, s)} />
                  </td>
                  {NAV.map((n) => (
                    <td key={n.id} className="num">
                      <input type="checkbox" checked={r.views.includes(n.id)} onChange={() => toggleView(r.id, n.id)} />
                    </td>
                  ))}
                  <td>{!r.builtin && <button className="btn btn-sm btn-ghost" onClick={() => deleteRole(r.id)}>Delete</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card card-pad">
        <div className="card-head">
          <h3>Custom role builder</h3>
          <span className="hint">Define a brand-new role from scratch and preview the dashboard as that role immediately</span>
        </div>
        <div className="filter-bar" style={{ marginBottom: 12 }}>
          <div className="filter-field" style={{ minWidth: 220 }}>
            <label>Role name</label>
            <input className="text-input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Regional Auditor" />
          </div>
          <div className="filter-field">
            <label>Data scope</label>
            <ScopeEditor scope={newScope} onChange={setNewScope} />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.4 }}>Visible dashboards</label>
          <div className="chip-row" style={{ marginTop: 6 }}>
            {NAV.map((n) => (
              <button
                key={n.id}
                type="button"
                className={"chip" + (newViews.includes(n.id) ? " active" : "")}
                onClick={() => setNewViews((prev) => (prev.includes(n.id) ? prev.filter((v) => v !== n.id) : [...prev, n.id]))}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" onClick={addRole}>
          + Create &amp; preview role
        </button>
      </div>
    </div>
  );
}
