import { useState, useEffect } from "react";
import { getIncidents, getCrews, getDispatches, createDispatch } from "../services/api";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import PriorityBadge from "../components/PriorityBadge";
import CrewCard from "../components/CrewCard";
import { AlertTriangleIcon, TruckIcon, ClockIcon } from "../components/Icons";

function Dispatch() {
  const [incidents, setIncidents] = useState([]);
  const [crews, setCrews] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedCrew, setSelectedCrew] = useState(null);
  const [eta, setEta] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [incRes, crewRes, dispRes] = await Promise.allSettled([
        getIncidents(),
        getCrews(),
        getDispatches(),
      ]);

      if (incRes.status === "fulfilled" && Array.isArray(incRes.value)) {
        // Filter out resolved or closed incidents so they do not show in dispatch scheduling
        const activeOnly = incRes.value.filter(
          (i) => i.status !== "resolved" && i.status !== "closed"
        );
        setIncidents(activeOnly);
        setSelectedIncident((prev) => {
          if (prev && activeOnly.some((i) => i.id === prev.id)) {
            return prev;
          }
          return activeOnly.length > 0 ? activeOnly[0] : null;
        });
      }
      if (crewRes.status === "fulfilled" && Array.isArray(crewRes.value)) {
        setCrews(crewRes.value);
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

  const handleDispatch = async (e) => {
    e.preventDefault();
    if (!selectedIncident) {
      alert("Please select an incident to dispatch to.");
      return;
    }
    if (!selectedCrew) {
      alert("Please select an available crew.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const incidentId = selectedIncident.id || Number(String(selectedIncident.incident_id).replace(/\D/g, ""));
      await createDispatch({
        incident_id: incidentId,
        crew_id: selectedCrew.id,
        eta: Number(eta) || 30,
      });

      setMessage(`Crew "${selectedCrew.name}" successfully dispatched to Incident #${incidentId}!`);
      setSelectedCrew(null);
      await loadData();
    } catch (err) {
      console.error(err);
      setMessage(`Dispatch failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="civic-page" style={{ minHeight: "100vh" }}>
      <Navbar />

      <main style={{ maxWidth: "1280px", margin: "32px auto", padding: "0 24px" }}>
        <div style={{ marginBottom: "28px" }}>
          <h1 className="page-hero-title">
            Emergency Response & Crew Dispatch
          </h1>
          <p className="page-hero-subtitle">
            Assign rapid-response repair crews to prioritized water leaks and bursts.
          </p>
        </div>

        {message && (
          <div
            style={{
              padding: "12px 18px",
              borderRadius: "10px",
              backgroundColor: message.includes("failed") ? "#FEF2F2" : "#F0FDF4",
              color: message.includes("failed") ? "#B91C1C" : "#15803D",
              border: message.includes("failed") ? "1px solid #FECACA" : "1px solid #BBF7D0",
              fontSize: "0.875rem",
              fontWeight: 600,
              marginBottom: "24px",
            }}
          >
            {message}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "28px",
            alignItems: "start",
          }}
        >
          {/* Left Column: Incidents & Crews */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {/* Step 1: Select Incident */}
            <section
              className="surface-card"
              style={{
                background: "#FFFFFF",
                padding: "24px",
                borderRadius: "14px",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.03)",
                border: "1px solid #E2E8F0",
              }}
            >
              <h2 className="section-card-title" style={{ marginBottom: "16px" }}>
                1. Select Priority Incident
              </h2>

              {incidents.length === 0 ? (
                <div style={{ color: "#64748B", fontSize: "0.875rem" }}>No active incidents available.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto" }}>
                  {incidents.map((inc) => {
                    const isSelected = selectedIncident?.id === inc.id;
                    const cat = (inc.dominant_category || inc.classification || "Leak").replaceAll("_", " ");
                    const sev = inc.max_severity ?? inc.severity ?? 50;

                    return (
                      <div
                        key={inc.id || inc.incident_id}
                        onClick={() => setSelectedIncident(inc)}
                        style={{
                          padding: "12px 16px",
                          borderRadius: "10px",
                          border: isSelected ? "2px solid #0284C7" : "1px solid #E2E8F0",
                          backgroundColor: isSelected ? "#F0F9FF" : "#FFFFFF",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <AlertTriangleIcon size={15} color="#0284C7" />
                            <span
                              className="font-mono"
                              style={{ fontWeight: 700, fontSize: "0.875rem", color: "#0F172A" }}
                            >
                              {inc.incident_id || `INC-${inc.id}`}
                            </span>
                            <span style={{ color: "#64748B", fontSize: "0.875rem" }}>—</span>
                            <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0F172A", textTransform: "capitalize" }}>
                              {cat}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "3px" }}>
                            Reports: <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{inc.total_reports || inc.report_count || 1}</span> | Action: {inc.recommended_action || "Investigate"}
                          </div>
                        </div>
                        <PriorityBadge severity={sev} />
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Step 2: Available Crews */}
            <section
              className="surface-card"
              style={{
                background: "#FFFFFF",
                padding: "24px",
                borderRadius: "14px",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.03)",
                border: "1px solid #E2E8F0",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 className="section-card-title">
                  2. Select Available Crew
                </h2>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#15803D",
                    background: "#F0FDF4",
                    border: "1px solid #BBF7D0",
                    padding: "2px 8px",
                    borderRadius: "6px",
                  }}
                >
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{crews.filter((c) => c.available).length}</span> crews ready
                </span>
              </div>

              {crews.length === 0 ? (
                <div style={{ color: "#64748B", fontSize: "0.875rem" }}>No crews registered.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", alignItems: "stretch" }}>
                  {crews.map((crew) => {
                    const isSelected = selectedCrew?.id === crew.id;
                    return (
                      <div
                        key={crew.id}
                        onClick={() => crew.available && setSelectedCrew(crew)}
                        style={{
                          cursor: crew.available ? "pointer" : "not-allowed",
                          border: isSelected ? "2px solid #0284C7" : "1px solid transparent",
                          borderRadius: "14px",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <CrewCard
                          crew={crew}
                          onDispatch={crew.available ? () => setSelectedCrew(crew) : undefined}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Dispatch Action Form & Recent Dispatches */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {/* Dispatch Order Confirmation Box */}
            <section
              className="surface-card"
              style={{
                background: "#FFFFFF",
                padding: "24px",
                borderRadius: "14px",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.03)",
                border: "1px solid #E2E8F0",
              }}
            >
              <h2 className="section-card-title" style={{ marginBottom: "16px" }}>
                3. Dispatch Confirmation
              </h2>

              <form onSubmit={handleDispatch} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ background: "#F8FAFC", padding: "14px 16px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                  <div className="micro-label" style={{ marginBottom: "4px" }}>
                    TARGET INCIDENT
                  </div>
                  <div style={{ fontWeight: 600, color: "#0F172A", fontSize: "0.875rem" }}>
                    {selectedIncident ? (
                      <span>
                        <span className="font-mono" style={{ fontWeight: 700, color: "#0284C7" }}>
                          INC-{selectedIncident.id}
                        </span>{" "}
                        ({(selectedIncident.classification || "Water Issue").replaceAll("_", " ")})
                      </span>
                    ) : (
                      <span style={{ color: "#94A3B8", fontStyle: "italic" }}>None Selected</span>
                    )}
                  </div>
                </div>

                <div style={{ background: "#F8FAFC", padding: "14px 16px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                  <div className="micro-label" style={{ marginBottom: "4px" }}>
                    ASSIGNED CREW
                  </div>
                  <div style={{ fontWeight: 600, color: selectedCrew ? "#0F172A" : "#94A3B8", fontSize: "0.875rem" }}>
                    {selectedCrew ? (
                      <span>
                        <strong style={{ color: "#0284C7" }}>{selectedCrew.name}</strong>{" "}
                        <span style={{ color: "#64748B", fontSize: "0.8125rem" }}>({selectedCrew.capability || "General"})</span>
                      </span>
                    ) : (
                      <span style={{ fontStyle: "italic" }}>Select an available crew on the left</span>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: "6px",
                    }}
                  >
                    Estimated Response Time (minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={eta}
                    onChange={(e) => setEta(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.875rem",
                      fontFamily: "'JetBrains Mono', monospace",
                      boxSizing: "border-box",
                      outline: "none",
                      transition: "border-color 0.15s ease",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#0284C7")}
                    onBlur={(e) => (e.target.style.borderColor = "#CBD5E1")}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !selectedIncident || !selectedCrew}
                  className="btn-primary"
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "0.9375rem",
                    borderRadius: "8px",
                  }}
                >
                  <TruckIcon size={18} />
                  {submitting ? "Deploying Crew..." : "Confirm & Deploy Crew"}
                </button>
              </form>
            </section>

            {/* Recent Dispatches Log */}
            <section
              className="surface-card"
              style={{
                background: "#FFFFFF",
                padding: "24px",
                borderRadius: "14px",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.03)",
                border: "1px solid #E2E8F0",
              }}
            >
              <h2 className="section-card-title" style={{ marginBottom: "14px" }}>
                Recent Deployments
              </h2>

              {dispatches.length === 0 ? (
                <div style={{ color: "#64748B", fontSize: "0.8125rem" }}>No crew dispatches recorded yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "250px", overflowY: "auto" }}>
                  {dispatches.slice(0, 5).map((disp) => (
                    <div
                      key={disp.id}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        backgroundColor: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "0.8125rem",
                      }}
                    >
                      <div>
                        <div style={{ color: "#0F172A", fontWeight: 600 }}>
                          <span className="font-mono">Dispatch #{disp.id}</span> →{" "}
                          <span className="font-mono" style={{ color: "#0284C7" }}>
                            Inc #{disp.incident_id}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "2px" }}>
                          Crew #{disp.crew_id} | ETA: <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{disp.eta || 30}</span> mins
                        </div>
                      </div>
                      <StatusBadge status={disp.status || "dispatched"} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dispatch;