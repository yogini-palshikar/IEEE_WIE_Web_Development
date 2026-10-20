import React from "react";
import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import { AlertTriangleIcon, ArrowRightIcon } from "./Icons";

function IncidentCard({ incident, onSelect, onDispatch }) {
  if (!incident) return null;

  const id = incident.incident_id || (incident.id ? `INC-${incident.id}` : "INC-???");
  const category = (incident.dominant_category || incident.classification || "Unclassified").replaceAll("_", " ");
  const severity = incident.max_severity ?? incident.severity ?? 50;
  const reports = incident.total_reports ?? incident.report_count ?? 1;
  const status = incident.status || "new";

  return (
    <div
      className="incident-card surface-card"
      style={{
        background: "#FFFFFF",
        borderRadius: "14px",
        padding: "18px",
        border: "1px solid #E2E8F0",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.03)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        transition: "box-shadow 0.15s ease, border-color 0.15s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <AlertTriangleIcon size={16} color="#0284C7" />
          <span
            className="font-mono"
            style={{
              fontWeight: 700,
              fontSize: "0.875rem",
              color: "#0F172A",
            }}
          >
            {id}
          </span>
        </div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <PriorityBadge severity={severity} />
          <StatusBadge status={status} />
        </div>
      </div>

      <div>
        <div
          style={{
            fontWeight: 600,
            fontSize: "0.9375rem",
            color: "#0F172A",
            textTransform: "capitalize",
          }}
        >
          {category}
        </div>
        <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "3px" }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{reports}</span> citizen report{reports > 1 ? "s" : ""} correlated
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "10px",
          borderTop: "1px solid #F1F5F9",
        }}
      >
        <Link
          to={`/incidents/${incident.id ?? incident.incident_id}`}
          style={{
            textDecoration: "none",
            color: "#0284C7",
            fontSize: "0.8125rem",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          View Details
          <ArrowRightIcon size={14} />
        </Link>

        {onDispatch && (
          <button
            type="button"
            onClick={() => onDispatch(incident)}
            className="btn-secondary"
            style={{
              padding: "6px 12px",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            Dispatch Crew
          </button>
        )}
      </div>
    </div>
  );
}

export default IncidentCard;
