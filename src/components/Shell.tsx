"use client";

import { SidebarBrand } from "./Logo";

export type ViewId = "hq" | "zone" | "division" | "compare" | "map";
export type RoleId = "hq" | "zone" | "division";

export const ROLES: { id: RoleId; label: string; initials: string; allowed: ViewId[] }[] = [
  { id: "hq", label: "HQ Director (NIC-CPWD)", initials: "HQ", allowed: ["hq", "zone", "division", "compare", "map"] },
  { id: "zone", label: "Zone / Circle Head", initials: "ZC", allowed: ["zone", "division", "compare", "map"] },
  { id: "division", label: "Division Officer", initials: "DO", allowed: ["division"] },
];

const NAV: { id: ViewId; label: string; desc: string }[] = [
  { id: "hq", label: "HQ Overview", desc: "National roll-up" },
  { id: "zone", label: "Zone & Circle", desc: "Regional drill-down" },
  { id: "division", label: "Division & Officer", desc: "Operational detail" },
  { id: "compare", label: "Comparison Mode", desc: "Multi-location & multi-period" },
  { id: "map", label: "GIS Map View", desc: "Pan-India heatmap" },
];

export function Shell({
  view,
  setView,
  role,
  setRole,
  onRestricted,
  children,
}: {
  view: ViewId;
  setView: (v: ViewId) => void;
  role: RoleId;
  setRole: (r: RoleId) => void;
  onRestricted: () => void;
  children: React.ReactNode;
}) {
  const roleDef = ROLES.find((r) => r.id === role)!;

  function handleNavClick(id: ViewId) {
    if (roleDef.allowed.includes(id)) setView(id);
    else onRestricted();
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <SidebarBrand />
        <div className="sidebar-section-label">Dashboards</div>
        {NAV.map((n) => {
          const allowed = roleDef.allowed.includes(n.id);
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
                <option key={n.id} value={n.id} disabled={!roleDef.allowed.includes(n.id)}>
                  {n.label}
                </option>
              ))}
            </select>
            <select
              className="select"
              value={role}
              onChange={(e) => {
                const r = e.target.value as RoleId;
                setRole(r);
                const def = ROLES.find((x) => x.id === r)!;
                if (!def.allowed.includes(view)) setView(def.allowed[0]);
              }}
              title="Switch simulated role to preview RBAC-scoped access"
            >
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            <span className="role-pill">
              <span className="av">{roleDef.initials}</span>
              Signed in as {roleDef.label}
            </span>
          </div>
        </div>

        <div className="content">{children}</div>
      </div>
    </div>
  );
}
