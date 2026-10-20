import React from "react";
import StatusBadge from "./StatusBadge";
import { TruckIcon, MapPinIcon } from "./Icons";

function CrewCard({ crew, onDispatch, disabled = false }) {
  if (!crew) return null;

  const isAvailable = Boolean(crew.available);

  return (
    <div
      className="crew-card surface-card"
      style={{
        background: "#FFFFFF",
        borderRadius: "14px",
        padding: "18px",
        border: `1px solid ${isAvailable ? "#BAE6FD" : "#E2E8F0"}`,
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.03)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        boxSizing: "border-box",
        transition: "all 0.15s ease",
      }}
    >
      <div>
        {/* Top Header: Icon + Info + Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", minWidth: 0, flex: 1 }}>
            <div
              className="icon-badge"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: isAvailable ? "#EFF6FF" : "#F1F5F9",
                color: isAvailable ? "#0284C7" : "#64748B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <TruckIcon size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  color: "#0F172A",
                  lineHeight: 1.3,
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                }}
              >
                {crew.name || `Crew #${crew.id}`}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#64748B",
                  marginTop: "3px",
                  lineHeight: 1.4,
                }}
              >
                {crew.capability || "General Repair"}
              </div>
            </div>
          </div>
          <StatusBadge status={crew.status || (isAvailable ? "available" : "busy")} />
        </div>

        {/* GPS Coordinates with JetBrains Mono */}
        {crew.latitude && crew.longitude && (
          <div
            style={{
              fontSize: "0.75rem",
              color: "#64748B",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginTop: "8px",
            }}
          >
            <MapPinIcon size={13} color="#94A3B8" />
            <span style={{ color: "#94A3B8", fontWeight: 500 }}>Location:</span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: "#475569",
                fontSize: "0.75rem",
                fontWeight: 500,
              }}
            >
              {Number(crew.latitude).toFixed(4)}, {Number(crew.longitude).toFixed(4)}
            </span>
          </div>
        )}
      </div>

      {/* Action Button pinned to bottom */}
      {onDispatch && (
        <button
          type="button"
          disabled={!isAvailable || disabled}
          onClick={() => onDispatch(crew)}
          className={isAvailable ? "btn-primary" : "btn-secondary"}
          style={{
            marginTop: "16px",
            width: "100%",
            padding: "9px 14px",
            fontSize: "0.8125rem",
            fontWeight: 600,
            borderRadius: "8px",
          }}
        >
          {isAvailable ? "Assign to Incident" : "Crew Unavailable"}
        </button>
      )}
    </div>
  );
}

export default CrewCard;
