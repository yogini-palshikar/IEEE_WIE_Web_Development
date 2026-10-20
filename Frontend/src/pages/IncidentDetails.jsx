import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getIncident, updateIncident } from "../services/api";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import PriorityBadge from "../components/PriorityBadge";
import {
  AlertTriangleIcon,
  MapPinIcon,
  TruckIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  SparklesIcon,
} from "../components/Icons";
import "./ReportLeak.css";

function IncidentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const loadIncident = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getIncident(id);
      setIncident(data);
      setNewStatus(data.status || "new");
    } catch (err) {
      console.error(err);
      setError(`Failed to load incident #${id}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadIncident();
    }
  }, [id, loadIncident]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!newStatus || newStatus === incident?.status) return;

    setUpdating(true);
    try {
      await updateIncident(id, { status: newStatus });
      await loadIncident();
      alert("Incident status successfully updated!");
    } catch (err) {
      alert(`Could not update incident: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="civic-page" style={{ minHeight: "100vh" }}>
      <Navbar />

      <main style={{ maxWidth: "900px", margin: "36px auto", padding: "0 24px" }}>
        <div style={{ marginBottom: "20px" }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              fontSize: "0.8125rem",
              cursor: "pointer",
            }}
          >
            <ArrowLeftIcon size={14} />
            <span>Back to Incidents</span>
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#64748B" }}>
            Loading incident #{id}...
          </div>
        ) : error ? (
          <div
            style={{
              padding: "20px 24px",
              borderRadius: "12px",
              backgroundColor: "#FEF2F2",
              color: "#B91C1C",
              border: "1px solid #FECACA",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <AlertTriangleIcon size={18} color="#DC2626" />
            <span>{error}</span>
          </div>
        ) : incident ? (
          <div
            className="surface-card"
            style={{
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", borderBottom: "1px solid #F1F5F9", paddingBottom: "20px" }}>
              <div>
                <span className="micro-label">
                  INCIDENT DOSSIER
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <AlertTriangleIcon size={20} color="#0284C7" />
                  </div>
                  <h1 className="page-hero-title" style={{ fontSize: "1.75rem", margin: 0 }}>
                    Incident <span className="font-mono">#{incident.id}</span>
                  </h1>
                </div>
                <div style={{ fontSize: "1rem", color: "#475569", marginTop: "6px", fontWeight: 600, textTransform: "capitalize" }}>
                  {(incident.classification || "Unclassified Water Issue").replaceAll("_", " ")}
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <PriorityBadge severity={incident.severity} priority={incident.priority} />
                <StatusBadge status={incident.status || "new"} />
              </div>
            </div>

            {/* Quick Metrics */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "14px",
              }}
            >
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "16px", borderRadius: "10px" }}>
                <div className="micro-label">SEVERITY SCORE</div>
                <div className="font-mono" style={{ fontSize: "1.5rem", fontWeight: 700, color: (incident.severity || 0) >= 60 ? "#B91C1C" : "#B45309", marginTop: "4px" }}>
                  {incident.severity || "N/A"}/100
                </div>
              </div>

              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "16px", borderRadius: "10px" }}>
                <div className="micro-label">REPORTS CORRELATED</div>
                <div className="font-mono" style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0F172A", marginTop: "4px" }}>
                  {incident.report_count || 1}
                </div>
              </div>

              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "16px", borderRadius: "10px" }}>
                <div className="micro-label">LEAK PROBABILITY</div>
                <div className="font-mono" style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0284C7", marginTop: "4px" }}>
                  {incident.leak_probability ? `${Math.round(incident.leak_probability * 100)}%` : "N/A"}
                </div>
              </div>

              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "16px", borderRadius: "10px" }}>
                <div className="micro-label">IMPACT RADIUS</div>
                <div className="font-mono" style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0F172A", marginTop: "4px" }}>
                  {incident.radius || 100}m
                </div>
              </div>
            </div>

            {/* Recommended Action */}
            <div
              style={{
                background: "#EFF6FF",
                border: "1px solid #BFDBFE",
                padding: "18px 20px",
                borderRadius: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", color: "#0284C7", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <SparklesIcon size={14} color="#0284C7" />
                <span>AI Recommended Action</span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: "0.9375rem", color: "#0369A1", fontWeight: 500, lineHeight: 1.5 }}>
                {incident.recommended_action || "Dispatch inspection crew to assess underground water pressure and valve integrity."}
              </p>
            </div>

            {/* Location Coordinates */}
            {incident.latitude && incident.longitude && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem", color: "#64748B" }}>
                <MapPinIcon size={16} color="#0284C7" />
                <span>Location:</span>
                <strong className="font-mono" style={{ color: "#0F172A" }}>
                  {Number(incident.latitude).toFixed(6)}, {Number(incident.longitude).toFixed(6)}
                </strong>
              </div>
            )}

            {/* Action Bar: Status Change & Dispatch */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
                paddingTop: "20px",
                borderTop: "1px solid #F1F5F9",
              }}
            >
              <form onSubmit={handleStatusUpdate} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <label className="micro-label" style={{ marginBottom: 0 }}>
                  UPDATE STATUS:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#0F172A",
                    background: "#FFFFFF",
                  }}
                >
                  <option value="new">New</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <button
                  type="submit"
                  disabled={updating || newStatus === incident.status}
                  className="btn-secondary"
                  style={{ padding: "8px 14px", fontSize: "0.8125rem" }}
                >
                  {updating ? "Saving..." : "Save Status"}
                </button>
              </form>

              <Link
                to="/dispatch"
                className="btn-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  padding: "10px 18px",
                }}
              >
                <TruckIcon size={16} />
                <span>Dispatch Crew to Incident</span>
              </Link>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default IncidentDetails;