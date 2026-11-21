"use client";

import { SidebarBrand } from "./Logo";
import type { Role } from "@/lib/roles";
import { scopeCoverage, scopeLabel } from "@/lib/roles";

export type ViewId = "hq" | "zone" | "division" | "compare" | "map" | "reports" | "permissions";

export const NAV: { id: ViewId; label: string; desc: string }[] = [
  { id: "hq", label: "HQ Overview", desc: "National roll-up" },
  { id: "zone", label: "Zone & Circle", desc: "Regional drill-down" },
  { id: "division", label: "Division & Officer", desc: "Operational detail" },
  { id: "compare", label: "Comparison Mode", desc: "Multi-location & multi-period" },
  { id: "map", label: "GIS Map View", desc: "Pan-India heatmap" },
  { id: "reports", label: "Report Builder", desc: "Ad-hoc pivot reports & export" },
  { id: "permissions", label: "Roles & Permissions", desc: "RBAC matrix, custom roles, data scoping" },
];

export function Shell({
  view,
  setView,
  roles,
  roleId,
  setRoleId,
  onRestricted,
  bookmarksSlot,
  children,
}: {
  view: ViewId;
  setView: (v: ViewId) => void;
  roles: Role[];
  roleId: string;
  setRoleId: (r: string) => void;
  onRestricted: () => void;
  bookmarksSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  const roleDef = roles.find((r) => r.id === roleId) ?? roles[0];
  const coverage = scopeCoverage(roleDef.scope);

  function handleNavClick(id: ViewId) {
    if (roleDef.views.includes(id)) setView(id);
    else onRestricted();
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <SidebarBrand />
        <div className="sidebar-section-label">Dashboards</div>
        {NAV.map((n) => {
          const allowed = roleDef.views.includes(n.id);
          return (
            <button
              key={n.id}
              className={"nav-item" + (view === n.id ? " active" : "")}
              onClick={() => handleNavClick(n.id)}
              title={allowed ? n.desc : "Restricted under the current role (RBAC)"}
            >
              <span className="dot" />
              <span style={{ flex: 1 }}>
                {n.label}
                {!allowed && <span style={{ marginLeft: 6, fontSize: 10 }}>🔒</span>}
              </span>
            </button>
          );
        })}
        <div className="sidebar-footer">
          Prototype build for appraisal purposes.
          <br />
          All figures are illustrative synthetic data — not live CPWD Sewa records.
          <br />
          <br />
          © Pioneer Smart Innovate Pvt. Ltd.
        </div>
      </aside>

      <div className="main-col">
        <div className="demo-banner">
          <span>🧪</span>
          <span>
            <b>Prototype / MVP</b> — clickable UI demo with synthetic data, built to showcase the envisaged CPWD Sewa
            Analytics Dashboard. No live CPWD data or backend is connected.
          </span>
        </div>

        <div className="topbar">
          <div className="topbar-title">
            <h1>CPWD Sewa Analytics Dashboard</h1>
            <span className="sub">Submitted for appraisal to National Informatics Centre (CPWD Division)</span>
          </div>
          <div className="topbar-right">
            <select
              className="mobile-nav select"
              value={view}
              onChange={(e) => handleNavClick(e.target.value as ViewId)}
            >
              {NAV.map((n) => (
                <option key={n.id} value={n.id} disabled={!roleDef.views.includes(n.id)}>
                  {n.label}
                </option>
              ))}
            </select>
            {bookmarksSlot}
            <select
              className="select"
              value={roleId}
              onChange={(e) => {
                const r = e.target.value;
                setRoleId(r);
                const def = roles.find((x) => x.id === r);
                if (def && !def.views.includes(view)) setView(def.views[0] ?? "hq");
              }}
              title="Switch simulated role to preview RBAC-scoped access"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            <span className="role-pill" title={`Data scope: ${scopeLabel(roleDef.scope)} — ${coverage.divisionCount} of ${coverage.totalDivisions} divisions (${coverage.pct}%)`}>
              <span className="av">{roleDef.initials}</span>
              {scopeLabel(roleDef.scope)} · {coverage.pct}% of India
            </span>
          </div>
        </div>

        <div className="content">{children}</div>
      </div>
    </div>
  );
}
