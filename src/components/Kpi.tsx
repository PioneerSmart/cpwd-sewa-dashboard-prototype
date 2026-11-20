export function KpiTile({
  label,
  value,
  delta,
  deltaDir,
  suffix,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaDir?: "up" | "down" | "flat";
  suffix?: string;
}) {
  return (
    <div className="kpi-tile">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">
        {value}
        {suffix ? <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 3, color: "var(--text-secondary)" }}>{suffix}</span> : null}
      </span>
      {delta ? (
        <span className={"kpi-delta " + (deltaDir ?? "flat")}>
          {deltaDir === "up" ? "▲" : deltaDir === "down" ? "▼" : "–"} {delta}
        </span>
      ) : null}
    </div>
  );
}

export function StatusBadge({ kind, children }: { kind: "good" | "warning" | "serious" | "critical"; children: React.ReactNode }) {
  return (
    <span className={"badge badge-" + kind}>
      <span className="dot" />
      {children}
    </span>
  );
}

export function slaStatus(pct: number): "good" | "warning" | "serious" | "critical" {
  if (pct >= 85) return "good";
  if (pct >= 72) return "warning";
  if (pct >= 60) return "serious";
  return "critical";
}
