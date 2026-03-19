interface ThreatBadgeProps {
  level: "S" | "A" | "B" | "C" | "D" | string;
  size?: "sm" | "lg";
}

const COLORS: Record<string, string> = {
  S: "#FF2A2A",
  A: "#FF9100",
  B: "#FFD700",
  C: "#00E5FF",
  D: "#A0A0A0",
};

export function ThreatBadge({ level, size = "sm" }: ThreatBadgeProps) {
  const color = COLORS[level] ?? COLORS.D;
  return (
    <span
      className={`threat-badge ${size === "lg" ? "threat-badge-lg" : ""}`}
      style={{
        backgroundColor: color,
        boxShadow: level === "S" ? `0 0 14px ${color}66` : undefined,
      }}
      title={`Threat Class ${level}`}
    >
      {level}
    </span>
  );
}
