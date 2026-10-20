import { useState, useEffect } from "react";
import { getCrews, getIncidents, getDispatches, resolveIncident, updateCrewStatus } from "../services/api";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import PriorityBadge from "../components/PriorityBadge";
import {
  WrenchIcon,
  TruckIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  MapPinIcon,
} from "../components/Icons";

function CrewPortal() {
  const [crews, setCrews] = useState([]);
  const [selectedCrewId, setSelectedCrewId] = useState("");
  const [dispatches, setDispatches] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [crewRes, incRes, dispRes] = await Promise.allSettled([
        getCrews(),
        getIncidents(),
        getDispatches(),
      ]);

      if (crewRes.status === "fulfilled" && Array.isArray(crewRes.value)) {
        const loadedCrews = crewRes.value;
        setCrews(loadedCrews);
        // Validate the current selection still exists; fall back to first crew (BUG-06)
        setSelectedCrewId((prev) => {
          const stillExists = loadedCrews.some((c) => String(c.id) === String(prev));
          if (stillExists) return prev;
          return loadedCrews.length > 0 ? String(loadedCrews[0].id) : "";
        });
      }

      if (incRes.status === "fulfilled" && Array.isArray(incRes.value)) {
        setIncidents(incRes.value);
      }

      if (dispRes.status === "fulfilled" && Array.isArray(dispRes.value)) {
        setDispatches(dispRes.value);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentCrew = crews.find((c) => String(c.id) === String(selectedCrewId));

  // Find dispatches for this crew that are active (not completed)
  const crewDispatches = dispatches.filter(
    (d) => String(d.crew_id) === String(selectedCrewId) && d.status !== "completed"
  );

  // Match active dispatches to incident objects
  const assignedIncidents = crewDispatches
    .map((d) => {
      const inc = incidents.find((i) => i.id === d.incident_id);
      return inc ? { ...inc, dispatch_id: d.id, eta: d.eta } : null;
    })
    .filter(Boolean);

  const handleResolve = async (incidentId) => {
    if (!window.confirm(`Are you sure the problem at Incident #${incidentId} is fixed? This will resolve the incident, close all associated citizen reports, and free up this crew.`)) {
      return;
    }

    setResolvingId(incidentId);
    setStatusMessage("");

    try {
      const res = await resolveIncident(incidentId);
      setStatusMessage(
        `✅ Success: Incident #${incidentId} resolved! ${res.resolved_reports_count || 0} citizen report(s) marked as resolved. Crew is now available for new tasks.`
      );
      setResolutionNotes("");
      await loadData();
    } catch (err) {
      console.error(err);
      setStatusMessage(`❌ Error resolving incident: ${err.message}`);
    } finally {
      setResolvingId(null);
    }
  };

  const handleToggleAvailability = async () => {
    if (!currentCrew) return;
    try {
      const newAvail = !currentCrew.available;
      await updateCrewStatus(currentCrew.id, {
        status: newAvail ? "available" : "busy",
        available: newAvail,
      });
      await loadData();
    } catch (err) {
      alert(`Could not toggle status: ${err.message}`);
    }
  };

  return (
    <div className="civic-page" style={{ minHeight: "100vh" }}>
      <Navbar />

      <main style={{ maxWidth: "1080px", margin: "32px auto", padding: "0 20px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "28px" }}>
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                borderRadius: "9999px",
                background: "#EFF6FF",
                color: "#0284C7",
                border: "1px solid #BFDBFE",
                fontSize: "0.75rem",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              <WrenchIcon size={14} color="#0284C7" />
              Field Technician Console
            </div>
            <h1 className="page-hero-title">
              Field Crew Response Portal
            </h1>
            <p className="page-hero-subtitle">
              Acknowledge dispatches, update field status, and mark repaired leaks as resolved.
            </p>
          </div>

          {/* Crew Switcher Dropdown Container */}
          <div
            className="surface-card"
            style={{
              background: "#FFFFFF",
              padding: "10px 16px",
              borderRadius: "10px",
              border: "1px solid #CBD5E1",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              className="icon-badge"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "#EFF6FF",
                color: "#0284C7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TruckIcon size={18} />
            </div>
            <div>
              <label className="micro-label" style={{ display: "block", marginBottom: "2px" }}>
                Select Active Crew
              </label>
              <select
                value={selectedCrewId}
                onChange={(e) => setSelectedCrewId(e.target.value)}
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#0F172A",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: "2px 0",
                }}
                onFocus={(e) => (e.target.parentElement.parentElement.style.boxShadow = "0 0 0 2px #0284C7")}
                onBlur={(e) => (e.target.parentElement.parentElement.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.05)")}
              >
                {crews.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.capability})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div
            style={{
              padding: "14px 18px",
              borderRadius: "10px",
              backgroundColor: statusMessage.includes("Error") ? "#FEF2F2" : "#F0FDF4",
              color: statusMessage.includes("Error") ? "#B91C1C" : "#15803D",
              border: statusMessage.includes("Error") ? "1px solid #FECACA" : "1px solid #BBF7D0",
              fontSize: "0.875rem",
              fontWeight: 600,
              marginBottom: "24px",
            }}
          >
            {statusMessage}
          </div>
        )}

        {/* Current Crew Status Banner */}
        {currentCrew && (
          <div
            className="surface-card"
            style={{
              background: "#FFFFFF",
              padding: "20px 24px",
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.03)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: "32px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2 className="section-card-title" style={{ fontSize: "1.25rem" }}>
                  {currentCrew.name}
                </h2>
                <StatusBadge status={currentCrew.status || (currentCrew.available ? "available" : "busy")} />
              </div>
              <div style={{ fontSize: "0.8125rem", color: "#64748B", marginTop: "4px" }}>
                Specialization: <strong style={{ color: "#334155" }}>{currentCrew.capability}</strong>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                type="button"
                onClick={handleToggleAvailability}
                className={currentCrew.available ? "btn-danger-soft" : "btn-secondary"}
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  padding: "8px 16px",
                  borderRadius: "8px",
                }}
              >
                {currentCrew.available ? "Mark as Busy" : "Set to Available"}
              </button>
            </div>
          </div>
        )}

        {/* Active Dispatched Tasks */}
        <div style={{ marginBottom: "36px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 className="section-card-title">
              Assigned Field Missions ({assignedIncidents.length})
            </h2>
            <span style={{ fontSize: "0.8125rem", color: "#64748B" }}>
              Emergency tasks dispatched to this crew
            </span>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
              Loading assigned missions...
            </div>
          ) : assignedIncidents.length === 0 ? (
            <div
              className="surface-card"
              style={{
                background: "#FFFFFF",
                padding: "40px",
                borderRadius: "14px",
                border: "1px dashed #CBD5E1",
                textAlign: "center",
                color: "#64748B",
              }}
            >
              <div
                className="icon-badge"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "#F0FDF4",
                  color: "#16A34A",
                  margin: "0 auto 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCircle2Icon size={24} color="#16A34A" />
              </div>
              <h3 style={{ margin: "0 0 6px", color: "#0F172A", fontSize: "1.125rem", fontWeight: 600 }}>
                No Pending Missions
              </h3>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748B" }}>
                All assigned water leaks have been resolved. This crew is ready for new dispatches.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {assignedIncidents.map((incident) => {
                const category = (incident.classification || "Water Leak").replaceAll("_", " ");
                const isResolving = resolvingId === incident.id;

                return (
                  <div
                    key={incident.id}
                    className="surface-card"
                    style={{
                      background: "#FFFFFF",
                      borderRadius: "14px",
                      border: "1px solid #BAE6FD",
                      boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.03)",
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "18px",
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <AlertTriangleIcon size={18} color="#0284C7" />
                          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                            <span className="font-mono">Incident #{incident.id}</span> —{" "}
                            <span style={{ textTransform: "capitalize" }}>{category}</span>
                          </h3>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "4px" }}>
                          ETA: ~<span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{incident.eta || 30}</span> mins | Reports Merged: <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{incident.report_count || 1}</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <PriorityBadge severity={incident.severity} />
                        <StatusBadge status={incident.status || "dispatched"} />
                      </div>
                    </div>

                    {/* Telemetry info */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "12px",
                      }}
                    >
                      <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                        <div className="micro-label" style={{ marginBottom: "2px" }}>SEVERITY SCORE</div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.125rem", fontWeight: 700, color: incident.severity >= 60 ? "#B91C1C" : "#B45309" }}>
                          {incident.severity || 50}/100
                        </div>
                      </div>

                      <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                        <div className="micro-label" style={{ marginBottom: "2px" }}>COORDINATES</div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8125rem", fontWeight: 600, color: "#0F172A", marginTop: "2px" }}>
                          {incident.latitude ? `${Number(incident.latitude).toFixed(4)}, ${Number(incident.longitude).toFixed(4)}` : "GPS logged"}
                        </div>
                      </div>

                      <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                        <div className="micro-label" style={{ marginBottom: "2px" }}>RADIUS IMPACT</div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.125rem", fontWeight: 700, color: "#0284C7" }}>
                          {incident.radius || 100} meters
                        </div>
                      </div>
                    </div>

                    {/* AI Recommended Action */}
                    <div style={{ background: "#F0F9FF", border: "1px solid #BAE6FD", padding: "14px 18px", borderRadius: "10px" }}>
                      <span className="micro-label" style={{ color: "#0284C7", display: "block" }}>
                        Protocol & Recommended Action:
                      </span>
                      <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "#0C4A6E", fontWeight: 500, lineHeight: 1.5 }}>
                        {incident.recommended_action || "Isolate pipeline, excavate damaged section, and test water pressure."}
                      </p>
                    </div>

                    {/* Resolution Section */}
                    <div
                      style={{
                        paddingTop: "16px",
                        borderTop: "1px solid #F1F5F9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "14px",
                      }}
                    >
                      <div style={{ fontSize: "0.8125rem", color: "#64748B" }}>
                        Repairs finished? Click below to record resolution and close all correlated reports.
                      </div>

                      <button
                        type="button"
                        onClick={() => handleResolve(incident.id)}
                        disabled={isResolving}
                        className="btn-primary"
                        style={{
                          background: "#15803D",
                          padding: "10px 20px",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                        }}
                      >
                        {isResolving ? <ClockIcon size={16} /> : <CheckCircle2Icon size={16} />}
                        {isResolving ? "Closing Mission..." : "Mark Problem Resolved & Close Reports"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Other Incidents Available for Self-Assignment */}
        <div>
          <h2 className="section-card-title" style={{ marginBottom: "16px" }}>
            All Active Municipal Incidents ({incidents.filter((i) => i.status !== "resolved").length})
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
            {incidents
              .filter((i) => i.status !== "resolved")
              .slice(0, 6)
              .map((inc) => (
                <div
                  key={inc.id}
                  className="surface-card"
                  style={{
                    background: "#FFFFFF",
                    padding: "16px",
                    borderRadius: "12px",
                    border: "1px solid #E2E8F0",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "10px",
                    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <AlertTriangleIcon size={15} color="#0284C7" />
                      <span className="font-mono" style={{ fontWeight: 700, fontSize: "0.875rem", color: "#0F172A" }}>
                        Incident #{inc.id}
                      </span>
                    </div>
                    <PriorityBadge severity={inc.severity} />
                  </div>

                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1E293B", textTransform: "capitalize" }}>
                    {(inc.classification || "General Issue").replaceAll("_", " ")}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid #F1F5F9" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                      Reports: <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{inc.report_count || 1}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleResolve(inc.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#15803D",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <CheckCircle2Icon size={13} color="#15803D" />
                      Resolve Directly
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default CrewPortal;
