import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getIncidents, getCrews, getReports, runPipeline } from "../services/api";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import IncidentCard from "../components/IncidentCard";
import IncidentMap from "../components/IncidentMap";
import {
  AlertTriangleIcon,
  FileTextIcon,
  TruckIcon,
  CheckCircle2Icon,
  CpuIcon,
  ClockIcon,
} from "../components/Icons";

function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [crews, setCrews] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [pipelineMessage, setPipelineMessage] = useState("");

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [incData, crewData, repData] = await Promise.allSettled([
        getIncidents(),
        getCrews(),
        getReports(),
      ]);

      if (incData.status === "fulfilled" && Array.isArray(incData.value)) {
        setIncidents(incData.value);
      }
      if (crewData.status === "fulfilled" && Array.isArray(crewData.value)) {
        setCrews(crewData.value);
      }
      if (repData.status === "fulfilled" && Array.isArray(repData.value)) {
        setReports(repData.value);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRunPipeline = async () => {
    setRunningPipeline(true);
    setPipelineMessage("");
    try {
      await runPipeline();
      setPipelineMessage("AI Pipeline completed successfully!");
      await loadDashboardData();
    } catch (err) {
      console.error(err);
      setPipelineMessage(`Pipeline run failed: ${err.message}`);
    } finally {
      setRunningPipeline(false);
    }
  };

  const [filterMode, setFilterMode] = useState("active"); // "active" or "all"

  const activeIncidents = incidents.filter(
    (i) => i.status !== "resolved" && i.status !== "closed"
  );
  const resolvedIncidents = incidents.filter(
    (i) => i.status === "resolved" || i.status === "closed"
  );
  const activeReports = reports.filter(
    (r) => r.status !== "resolved" && r.status !== "closed"
  );

  const criticalCount = activeIncidents.filter(
    (i) => (i.severity || i.max_severity || 0) >= 60
  ).length;

  const availableCrewsCount = crews.filter((c) => c.available).length;

  const displayedIncidents = filterMode === "active" ? activeIncidents : incidents;

  return (
    <div className="civic-page" style={{ minHeight: "100vh" }}>
      <Navbar />

      <main style={{ maxWidth: "1280px", margin: "32px auto", padding: "0 24px" }}>
        {/* Header Action Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <div>
            <h1 className="page-hero-title">
              Municipal Incident Command Center
            </h1>
            <p className="page-hero-subtitle">
              Real-time monitoring, AI incident clustering, and field crew dispatch.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              onClick={handleRunPipeline}
              disabled={runningPipeline}
              className="btn-primary"
            >
              {runningPipeline ? <ClockIcon size={16} /> : <CpuIcon size={16} />}
              {runningPipeline ? "Running AI Pipeline..." : "Trigger AI Clustering"}
            </button>

            <Link
              to="/dispatch"
              className="btn-secondary"
            >
              <TruckIcon size={16} color="#64748B" />
              Dispatch Center
            </Link>
          </div>
        </div>

        {pipelineMessage && (
          <div
            style={{
              padding: "12px 18px",
              borderRadius: "10px",
              backgroundColor: pipelineMessage.includes("failed") ? "#FEF2F2" : "#F0FDF4",
              color: pipelineMessage.includes("failed") ? "#B91C1C" : "#15803D",
              border: pipelineMessage.includes("failed") ? "1px solid #FECACA" : "1px solid #BBF7D0",
              fontSize: "0.875rem",
              fontWeight: 600,
              marginBottom: "24px",
            }}
          >
            {pipelineMessage}
          </div>
        )}

        {/* Stats Grid - Responsive 4 Columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px",
            marginBottom: "32px",
          }}
        >
          <StatCard
            title="Active Incidents"
            value={activeIncidents.length}
            icon={<AlertTriangleIcon size={22} color="#EF4444" />}
            subtitle={`${criticalCount} high priority | ${resolvedIncidents.length} resolved`}
            color="#EF4444"
          />
          <StatCard
            title="Active Reports"
            value={activeReports.length}
            icon={<FileTextIcon size={22} color="#0284C7" />}
            subtitle={`${reports.length - activeReports.length} reports resolved`}
            color="#0284C7"
          />
          <StatCard
            title="Available Crews"
            value={`${availableCrewsCount}/${crews.length}`}
            icon={<TruckIcon size={22} color="#10B981" />}
            subtitle="Ready for rapid deployment"
            color="#10B981"
          />
          <StatCard
            title="Resolved Issues"
            value={resolvedIncidents.length}
            icon={<CheckCircle2Icon size={22} color="#16A34A" />}
            subtitle="Closed & verified by crews"
            color="#16A34A"
          />
        </div>

        {/* Live Incident Map */}
        <div
          className="surface-card"
          style={{
            background: "#FFFFFF",
            padding: "24px",
            borderRadius: "14px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.03)",
            border: "1px solid #E2E8F0",
            marginBottom: "32px",
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <h2 className="section-card-title" style={{ fontSize: "1.125rem" }}>
              Live Geographic Incident Map
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: "4px 0 0" }}>
              Active leaks and pipe bursts detected with GPS proximity clustering.
            </p>
          </div>

          <IncidentMap />
        </div>

        {/* Recent Incidents List */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div>
              <h2 className="section-card-title" style={{ fontSize: "1.125rem" }}>
                Incident Log
              </h2>
              <span style={{ fontSize: "0.8125rem", color: "#64748B" }}>
                Showing <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{displayedIncidents.length}</span> {filterMode === "active" ? "active" : "total"} incident{displayedIncidents.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Segmented Pill Control */}
            <div className="segmented-control" style={{ display: "inline-flex", background: "#E2E8F0", padding: "4px", borderRadius: "8px", gap: "4px" }}>
              <button
                type="button"
                onClick={() => setFilterMode("active")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: filterMode === "active" ? "#FFFFFF" : "transparent",
                  color: filterMode === "active" ? "#0F172A" : "#64748B",
                  boxShadow: filterMode === "active" ? "0 1px 3px rgba(15, 23, 42, 0.08)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                Active Only ({activeIncidents.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: filterMode === "all" ? "#FFFFFF" : "transparent",
                  color: filterMode === "all" ? "#0F172A" : "#64748B",
                  boxShadow: filterMode === "all" ? "0 1px 3px rgba(15, 23, 42, 0.08)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                All Incidents ({incidents.length})
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              Loading incidents...
            </div>
          ) : displayedIncidents.length === 0 ? (
            <div
              style={{
                background: "#ffffff",
                padding: "32px",
                borderRadius: "14px",
                textAlign: "center",
                color: "#64748b",
                border: "1px solid #e2e8f0",
              }}
            >
              {filterMode === "active"
                ? "🎉 Great work! There are currently no unresolved active incidents."
                : "No incidents recorded in the system yet."}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "20px",
              }}
            >
              {displayedIncidents.map((incident) => (
                <IncidentCard
                  key={incident.id || incident.incident_id}
                  incident={incident}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;