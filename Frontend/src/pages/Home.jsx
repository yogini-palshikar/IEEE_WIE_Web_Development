import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  AlertTriangleIcon,
  LandmarkIcon,
  DropletIcon,
  ArrowRightIcon,
  SearchIcon,
  BarChart3Icon,
  TruckIcon,
  WrenchIcon,
} from "../components/Icons";

function Home() {
  return (
    <div className="civic-page" style={{ minHeight: "100vh" }}>
      <Navbar />

      <main style={{ maxWidth: "1080px", margin: "48px auto", padding: "0 24px", textAlign: "center" }}>
        {/* Top Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            borderRadius: "9999px",
            background: "#EFF6FF",
            color: "#0284C7",
            border: "1px solid #BFDBFE",
            fontSize: "0.8125rem",
            fontWeight: 600,
            marginBottom: "20px",
          }}
        >
          <DropletIcon size={14} color="#0284C7" />
          Intelligent Urban Water Infrastructure Monitoring
        </div>

        {/* Page Hero Title */}
        <h1
          className="page-hero-title"
          style={{
            fontSize: "2.5rem",
            fontWeight: 800,
            color: "#0F172A",
            margin: "0 0 16px",
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
          }}
        >
          CivicPulse
        </h1>

        <p
          className="page-hero-subtitle"
          style={{
            fontSize: "1.125rem",
            color: "#475569",
            maxWidth: "680px",
            margin: "0 auto 48px",
            lineHeight: 1.6,
          }}
        >
          Connecting citizens with municipal water authorities through real-time GPS clustering,
          AI defect classification, and automated emergency crew dispatch.
        </p>

        {/* 2-Column Action Portals */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "24px",
            textAlign: "left",
            alignItems: "stretch",
          }}
        >
          {/* Citizen Card */}
          <div
            className="surface-card"
            style={{
              background: "#FFFFFF",
              borderRadius: "14px",
              padding: "32px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.03)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "100%",
            }}
          >
            <div>
              <div
                className="icon-badge"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: "#EFF6FF",
                  color: "#0284C7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                }}
              >
                <AlertTriangleIcon size={22} color="#0284C7" />
              </div>

              <h2
                className="section-card-title"
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "#0F172A",
                  margin: "0 0 8px",
                }}
              >
                Citizen Portal
              </h2>

              <p
                style={{
                  color: "#64748B",
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                  margin: "0 0 32px",
                }}
              >
                Notice a broken pipe, street flooding, or water supply disruption? Submit a geolocated report with photos in seconds.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link to="/report" className="btn-primary" style={{ width: "100%", padding: "12px" }}>
                Report a Water Leak
                <ArrowRightIcon size={16} />
              </Link>
              <Link to="/track" className="btn-secondary" style={{ width: "100%", padding: "12px" }}>
                <SearchIcon size={16} color="#64748B" />
                Track Existing Report
              </Link>
            </div>
          </div>

          {/* Municipal Authority Card */}
          <div
            className="surface-card"
            style={{
              background: "#FFFFFF",
              borderRadius: "14px",
              padding: "32px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.03)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "100%",
            }}
          >
            <div>
              <div
                className="icon-badge"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: "#F1F5F9",
                  color: "#0F172A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                }}
              >
                <LandmarkIcon size={22} color="#0F172A" />
              </div>

              <h2
                className="section-card-title"
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "#0F172A",
                  margin: "0 0 8px",
                }}
              >
                Municipal Authority
              </h2>

              <p
                style={{
                  color: "#64748B",
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                  margin: "0 0 32px",
                }}
              >
                Monitor live incident clusters on the map, trigger AI severity scoring, and dispatch field repair crews with automated routing.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link to="/dashboard" className="btn-primary" style={{ width: "100%", padding: "12px" }}>
                <BarChart3Icon size={16} />
                Open Command Dashboard
                <ArrowRightIcon size={16} />
              </Link>
              <Link to="/dispatch" className="btn-secondary" style={{ width: "100%", padding: "12px" }}>
                <TruckIcon size={16} color="#64748B" />
                Crew Dispatch Console
              </Link>
              <Link to="/crew" className="btn-secondary" style={{ width: "100%", padding: "12px" }}>
                <WrenchIcon size={16} color="#64748B" />
                Field Crew Response Portal
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;