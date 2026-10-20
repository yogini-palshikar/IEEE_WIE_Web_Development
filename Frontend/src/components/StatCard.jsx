import React from "react";

function StatCard({ title, value, icon, subtitle, color = "#0284C7" }) {
  return (
    <div
      className="stat-card surface-card"
      style={{
        background: "#FFFFFF",
        borderRadius: "14px",
        padding: "20px 22px",
        border: "1px solid #E2E8F0",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.03)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        minWidth: "220px",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="micro-label"
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: "#64748B",
            textTransform: "uppercase",
            marginBottom: "6px",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "2rem",
            fontWeight: 700,
            color: "#0F172A",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
          }}
        >
          {value}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: "0.75rem",
              color: "#64748B",
              marginTop: "6px",
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {icon && (
        <div
          className="icon-badge"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            background: `${color}14`,
            color: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: "16px",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      )}
    </div>
  );
}

export default StatCard;
