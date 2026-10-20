import React from "react";
import StatusBadge from "./StatusBadge";

function ReportCard({ report, onSelect }) {
  if (!report) return null;

  const id = report.id;
  const description = report.description || "No description provided.";
  const classification = (report.classification || "unclassified").replaceAll("_", " ");
  const leakProbability = report.leak_probability !== undefined && report.leak_probability !== null
    ? `${Math.round(Number(report.leak_probability) * 100)}%`
    : null;
  const status = report.status || "new";
  const dateStr = report.created_at
    ? new Date(report.created_at).toLocaleString()
    : null;

  return (
    <div
      className="report-card"
      style={{
        background: "#ffffff",
        borderRadius: "14px",
        padding: "16px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, fontSize: "13px", color: "#0f4c5c" }}>
          📋 Report #{id}
        </span>
        <StatusBadge status={status} />
      </div>

      <p
        style={{
          margin: 0,
          fontSize: "13px",
          color: "#334155",
          lineHeight: 1.4,
          maxHeight: "3.6em",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {description}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "11px",
          color: "#64748b",
          paddingTop: "6px",
          borderTop: "1px solid #f1f5f9",
        }}
      >
        <span style={{ textTransform: "capitalize", fontWeight: 600, color: "#0369a1" }}>
          🏷️ {classification} {leakProbability && `(${leakProbability} leak prob)`}
        </span>
        {dateStr && <span>{dateStr}</span>}
      </div>

      {onSelect && (
        <button
          type="button"
          onClick={() => onSelect(report)}
          style={{
            background: "transparent",
            border: "none",
            color: "#0284c7",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            textAlign: "left",
            padding: 0,
            marginTop: "2px",
          }}
        >
          Track this report →
        </button>
      )}
    </div>
  );
}

export default ReportCard;
