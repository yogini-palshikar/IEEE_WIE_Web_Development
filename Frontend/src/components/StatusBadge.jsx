import React from "react";

const STATUS_CONFIG = {
  new: { label: "New", bg: "#F0F9FF", text: "#0369A1", border: "#BAE6FD", dot: "#0284C7" },
  assigned: { label: "Assigned", bg: "#FFFBEB", text: "#B45309", border: "#FDE68A", dot: "#F59E0B" },
  dispatched: { label: "Dispatched", bg: "#FFF7ED", text: "#C2410C", border: "#FFEDD5", dot: "#EA580C" },
  in_progress: { label: "In Progress", bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE", dot: "#3B82F6" },
  resolved: { label: "Resolved", bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0", dot: "#22C55E" },
  closed: { label: "Closed", bg: "#F1F5F9", text: "#475569", border: "#E2E8F0", dot: "#94A3B8" },
  available: { label: "Available", bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0", dot: "#22C55E" },
  busy: { label: "Busy", bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA", dot: "#EF4444" },
  offline: { label: "Offline", bg: "#F1F5F9", text: "#64748B", border: "#CBD5E1", dot: "#94A3B8" },
};

function StatusBadge({ status = "new", className = "" }) {
  const normalizedKey = String(status).toLowerCase().replace(/[-\s]/g, "_");
  const config = STATUS_CONFIG[normalizedKey] || {
    label: status || "Unknown",
    bg: "#F1F5F9",
    text: "#475569",
    border: "#E2E8F0",
    dot: "#94A3B8",
  };

  return (
    <span
      className={`status-badge ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "3px 10px",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        textTransform: "capitalize",
        whiteSpace: "nowrap",
        flexShrink: 0,
        lineHeight: 1.3,
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: config.dot,
          flexShrink: 0,
        }}
      />
      {config.label}
    </span>
  );
}

export default StatusBadge;
