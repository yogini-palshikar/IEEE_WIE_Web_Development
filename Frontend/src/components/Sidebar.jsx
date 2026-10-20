import React from "react";
import { Link, useLocation } from "react-router-dom";

function Sidebar({ activeTab, onSelectTab }) {
  const location = useLocation();

  const menuItems = [
    { id: "overview", label: "Overview", icon: "📊", to: "/dashboard" },
    { id: "incidents", label: "Active Incidents", icon: "🚨", to: "/dashboard" },
    { id: "crews", label: "Field Crews", icon: "🚒", to: "/dispatch" },
    { id: "reports", label: "Citizen Reports", icon: "📋", to: "/track" },
    { id: "new-report", label: "Submit Report", icon: "➕", to: "/report" },
  ];

  return (
    <aside
      className="civic-sidebar"
      style={{
        width: "240px",
        background: "#0f172a",
        color: "#f8fafc",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        minHeight: "100vh",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "0 8px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: "#38bdf8",
            color: "#0f172a",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          CP
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "16px", color: "#f8fafc" }}>
            CivicPulse
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>
            Municipal Console
          </div>
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {menuItems.map((item) => {
          const isSelected = activeTab === item.id || location.pathname === item.to;
          return (
            <Link
              key={item.id}
              to={item.to}
              onClick={() => onSelectTab && onSelectTab(item.id)}
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 600,
                color: isSelected ? "#38bdf8" : "#94a3b8",
                backgroundColor: isSelected ? "rgba(56, 189, 248, 0.12)" : "transparent",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: "16px" }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
