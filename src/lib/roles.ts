// Dynamic role / permission model for the RBAC playground (Permissions view).
// Roles are no longer a fixed union — they are data, editable at runtime, so the
// demo can show a live permission matrix, a custom role builder, and a
// data-scoping visualizer. State persists per-browser via localStorage only
// (this is a synthetic-data prototype; nothing is sent to a server).

import type { ViewId } from "@/components/Shell";
import { ALL_DIVISIONS, ZONES, findCircle, findDivision, findZone, leafDivisionsUnder, nodeLabel } from "./geography";

export type ScopeKind = "all" | "zone" | "circle" | "division";

export type RoleScope = {
  kind: ScopeKind;
  nodeId?: string; // zone/circle/division id, ignored when kind === "all"
};

export type Role = {
  id: string;
  label: string;
  initials: string;
  builtin: boolean; // built-in roles can be edited (views/scope) but not deleted
  views: ViewId[];
  scope: RoleScope;
};

export const ALL_VIEW_IDS: ViewId[] = ["hq", "zone", "division", "compare", "map", "reports", "permissions"];

export const DEFAULT_ROLES: Role[] = [
  {
    id: "hq",
    label: "HQ Director",
    initials: "HQ",
    builtin: true,
    views: ["hq", "zone", "division", "compare", "map", "reports", "permissions"],
    scope: { kind: "all" },
  },
  {
    id: "zone",
    label: "Zone / Circle Head",
    initials: "ZC",
    builtin: true,
    views: ["zone", "division", "compare", "map", "reports"],
    scope: { kind: "zone", nodeId: ZONES[0].id },
  },
  {
    id: "division",
    label: "Division Officer",
    initials: "DO",
    builtin: true,
    views: ["division"],
    scope: { kind: "division", nodeId: ZONES[0].circles[0].divisions[0].id },
  },
];

const STORAGE_KEY = "pwd-platform-demo:roles:v1";

export function loadRoles(): Role[] {
  if (typeof window === "undefined") return DEFAULT_ROLES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ROLES;
    const parsed = JSON.parse(raw) as Role[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_ROLES;
    // Always keep built-ins present even if an old snapshot predates one.
    const ids = new Set(parsed.map((r) => r.id));
    const merged = [...parsed];
    for (const d of DEFAULT_ROLES) if (!ids.has(d.id)) merged.push(d);
    return merged;
  } catch {
    return DEFAULT_ROLES;
  }
}

export function saveRoles(roles: Role[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
  } catch {
    // best-effort only — localStorage can be unavailable (private mode, quota, etc.)
  }
}

export function scopeLabel(scope: RoleScope): string {
  if (scope.kind === "all") return "All India";
  if (!scope.nodeId) return "All India";
  return nodeLabel(scope.nodeId);
}

/** Full breadcrumb (Zone › Circle › Division) for the data-scoping visualizer. */
export function scopeBreadcrumb(scope: RoleScope): string {
  if (scope.kind === "all" || !scope.nodeId) return "All India (no geography restriction)";
  const z = findZone(scope.nodeId);
  if (z) return z.name;
  const c = findCircle(scope.nodeId);
  if (c) return `${c.zone.name} › ${c.circle.name}`;
  const d = findDivision(scope.nodeId);
  if (d) return `${d.zone.name} › ${d.circle.name} › ${d.division.name}`;
  return nodeLabel(scope.nodeId);
}

/** Node ids this scope resolves to, for feeding into aggregateSeries/leafDivisionsUnder etc. */
export function scopeNodeIds(scope: RoleScope): string[] {
  if (scope.kind === "all" || !scope.nodeId) return ZONES.map((z) => z.id);
  return [scope.nodeId];
}

/** How many leaf divisions (and what share of the national total) a scope covers — for the data-scoping visualizer. */
export function scopeCoverage(scope: RoleScope) {
  const divisions = Array.from(new Set(scopeNodeIds(scope).flatMap((id) => leafDivisionsUnder(id).map((d) => d.id))));
  const total = ALL_DIVISIONS.length;
  return {
    divisionCount: divisions.length,
    totalDivisions: total,
    pct: total > 0 ? Math.round((divisions.length / total) * 1000) / 10 : 0,
  };
}

export function emptyScopeFor(kind: ScopeKind): RoleScope {
  if (kind === "zone") return { kind, nodeId: ZONES[0].id };
  if (kind === "circle") return { kind, nodeId: ZONES[0].circles[0].id };
  if (kind === "division") return { kind, nodeId: ZONES[0].circles[0].divisions[0].id };
  return { kind: "all" };
}

export function makeRoleId(label: string): string {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return (slug || "role") + "-" + Math.random().toString(36).slice(2, 7);
}

export function initialsFor(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "??";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
