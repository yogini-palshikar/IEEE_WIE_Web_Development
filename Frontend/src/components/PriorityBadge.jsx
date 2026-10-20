import React from "react";
import { ZapIcon } from "./Icons";

function PriorityBadge({ priority, severity, className = "" }) {
  const score = priority !== undefined ? Number(priority) : Number(severity || 0);

  let label = "Low";
  let bg = "#F0FDF4";
  let text = "#15803D";
  let border = "#BBF7D0";

  if (score >= 90) {
    label = "Critical";
    bg = "#FEF2F2";
    text = "#B91C1C";
    border = "#FECACA";
  } else if (score >= 60) {
    label = "High";
    bg = "#FFFBEB";
    text = "#B45309";
    border = "#FDE68A";
  } else if (score >= 40) {
    label = "Medium";
    bg = "#FFF7ED";
    text = "#C2410C";
    border = "#FFEDD5";
  }

  return (
    <span
      className={`priority-badge ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 8px",
        borderRadius: "6px",
        fontSize: "0.6875rem",
        fontWeight: 700,
        backgroundColor: bg,
        color: text,
        border: `1px solid ${border}`,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      <ZapIcon size={12} color={text} />
      <span>{label}</span>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
          opacity: 0.9,
        }}
      >
        ({score})
      </span>
    </span>
  );
}

export default PriorityBadge;
