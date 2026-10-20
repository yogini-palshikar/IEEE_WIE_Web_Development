import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

import { useEffect, useState } from "react";
import { getLiveIncidents, getIncidents } from "../services/api";

// =========================================================
// CREATE COLORED MARKER
// =========================================================

const createMarker = (severity) => {
  let color = "#facc15"; // Yellow

  if (severity >= 90) {
    color = "#ef4444"; // Red
  } else if (severity >= 60) {
    color = "#f97316"; // Orange
  }

  return L.divIcon({
    className: "custom-incident-marker",

    html: `
      <div
        style="
          width: 22px;
          height: 22px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.35);
        "
      ></div>
    `,

    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
};

// =========================================================
// INCIDENT MAP
// =========================================================

function IncidentMap() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchIncidents() {
      setLoading(true);
      setError(null);

      try {
        let rawData = [];
        try {
          // Fetch live database incidents as the source of truth
          rawData = await getIncidents();
        } catch (dbErr) {
          console.warn("DB incidents unavailable, trying pipeline incidents:", dbErr);
        }

        if (!Array.isArray(rawData) || rawData.length === 0) {
          try {
            rawData = await getLiveIncidents();
          } catch (pipelineErr) {
            console.warn("Pipeline incidents also unavailable:", pipelineErr);
          }
        }

        if (isMounted) {
          if (Array.isArray(rawData)) {
            const normalized = rawData
              // Hide resolved or closed incidents from the active emergency map
              .filter((inc) => inc.status !== "resolved" && inc.status !== "closed")
              .map((inc) => ({
                id: inc.incident_id || (inc.id ? `INC-${inc.id}` : `INC-${Math.random().toString(36).substring(7)}`),
                latitude: Number(inc.latitude),
                longitude: Number(inc.longitude),
                category: (inc.dominant_category || inc.classification || "General Issue").replaceAll("_", " "),
                severity: Number(inc.max_severity ?? inc.severity ?? 50),
                reportCount: Number(inc.total_reports ?? inc.report_count ?? 1),
                status: inc.status || "active",
              }))
              .filter(
                (inc) =>
                  !isNaN(inc.latitude) &&
                  !isNaN(inc.longitude) &&
                  inc.latitude !== 0 &&
                  inc.longitude !== 0
              );

            setIncidents(normalized);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load incidents:", err);
          setError(err.message || "Failed to load incidents");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchIncidents();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div
      className="incident-map-container"
      style={{
        padding: "18px",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 28,
            right: 28,
            zIndex: 1000,
            background: "rgba(15, 23, 42, 0.85)",
            color: "#38bdf8",
            padding: "6px 14px",
            borderRadius: "12px",
            fontSize: "13px",
            fontWeight: 500,
            backdropFilter: "blur(6px)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          }}
        >
          Loading incidents...
        </div>
      )}

      {error && !loading && incidents.length === 0 && (
        <div
          style={{
            position: "absolute",
            top: 28,
            right: 28,
            zIndex: 1000,
            background: "rgba(239, 68, 68, 0.9)",
            color: "white",
            padding: "6px 14px",
            borderRadius: "12px",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      <MapContainer
        center={[12.9737, 79.1636]}
        zoom={13}
        style={{
          width: "100%",
          height: "600px",
          border: "1px solid #E2E8F0",
          borderRadius: "12px",
          overflow: "hidden",
          boxSizing: "border-box",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
        }}
      >
        {/* OPENSTREETMAP */}

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* INCIDENT PINS */}

        {incidents.map((incident) => (
          <Marker
            key={incident.id}
            position={[incident.latitude, incident.longitude]}
            icon={createMarker(incident.severity)}
          >
            {/* POPUP */}

            <Popup>
              <div
                style={{
                  minWidth: "220px",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    margin: "0 0 8px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      fontSize: "14px",
                      color: "#0F172A",
                    }}
                  >
                    #{incident.id}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: incident.severity >= 90 ? "#FEF2F2" : incident.severity >= 60 ? "#FFFBEB" : "#F0FDF4",
                      color: incident.severity >= 90 ? "#B91C1C" : incident.severity >= 60 ? "#B45309" : "#15803D",
                    }}
                  >
                    Severity {incident.severity}
                  </span>
                </div>

                <p style={{ margin: "4px 0", fontSize: "13px", color: "#475569" }}>
                  <strong style={{ color: "#0F172A" }}>Problem:</strong> {incident.category}
                </p>

                <p style={{ margin: "4px 0", fontSize: "13px", color: "#475569" }}>
                  <strong style={{ color: "#0F172A" }}>Reports:</strong>{" "}
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{incident.reportCount}</span> correlated
                </p>

                <p
                  style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#0284C7",
                  }}
                >
                  {incident.reportCount} citizen report{incident.reportCount > 1 ? "s" : ""} merged into this event.
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* =====================================================
          LEGEND
          ===================================================== */}

      <div
        className="incident-map-legend"
        style={{
          position: "absolute",
          bottom: "32px",
          right: "32px",
          zIndex: 1000,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(8px)",
          border: "1px solid #E2E8F0",
          borderRadius: "10px",
          padding: "10px 14px",
          boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#64748B",
            marginBottom: "6px",
          }}
        >
          Incident Severity
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#0F172A", fontWeight: 500 }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#EF4444" }}></span>
            <span>90+ — Critical</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#0F172A", fontWeight: 500 }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#F59E0B" }}></span>
            <span>60–89 — High</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#0F172A", fontWeight: 500 }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#22C55E" }}></span>
            <span>&lt;60 — Monitoring</span>
          </div>
        </div>
      </div>

    </div>
  );
}

export default IncidentMap;