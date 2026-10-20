import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AlertTriangleIcon,
  SearchIcon,
  BarChart3Icon,
  TruckIcon,
  WrenchIcon,
} from "./Icons";

function Navbar() {
  const location = useLocation();

  const navLinks = [
    { to: "/report", label: "Report Issue", icon: <AlertTriangleIcon size={16} /> },
    { to: "/track", label: "Track Reports", icon: <SearchIcon size={16} /> },
    { to: "/dashboard", label: "Dashboard", icon: <BarChart3Icon size={16} /> },
    { to: "/dispatch", label: "Dispatch", icon: <TruckIcon size={16} /> },
    { to: "/crew", label: "Crew Portal", icon: <WrenchIcon size={16} /> },
  ];

  return (
    <nav
      className="civic-navbar"
      style={{
        height: "64px",
        background: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #E2E8F0",
        padding: "0 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
      }}
    >
      {/* Left Brand */}
      <Link
        to="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
            color: "white",
            fontWeight: 800,
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 6px rgba(2, 132, 199, 0.3)",
            letterSpacing: "-0.5px",
          }}
        >
          CP
        </div>
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: "1.125rem",
              color: "#0F172A",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            CivicPulse
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "#64748B",
              fontWeight: 500,
              marginTop: "1px",
            }}
          >
            Water Infrastructure Intelligence
          </div>
        </div>
      </Link>

      {/* Right Navigation Links */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {navLinks.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#0284C7" : "#475569",
                backgroundColor: isActive ? "#EFF6FF" : "transparent",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "#F1F5F9";
                  e.currentTarget.style.color = "#0F172A";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#475569";
                }
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  color: isActive ? "#0284C7" : "#64748B",
                }}
              >
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default Navbar;
