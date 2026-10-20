import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getReport, getReportImages } from "../services/api";
import StatusBadge from "../components/StatusBadge";
import Navbar from "../components/Navbar";
import {
  SearchIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  FileTextIcon,
  CpuIcon,
  ImageIcon,
  ArrowRightIcon,
} from "../components/Icons";
import "./ReportLeak.css";

function TrackReport() {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get("id") || "";

  const [reportIdInput, setReportIdInput] = useState(initialId);
  const [report, setReport] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReportDetails = useCallback(async (idToFetch) => {
    if (!idToFetch || isNaN(Number(idToFetch))) {
      setError("Please enter a valid numeric Report ID.");
      return;
    }

    setLoading(true);
    setError("");
    setReport(null);
    setImages([]);

    try {
      const data = await getReport(Number(idToFetch));
      setReport(data);

      try {
        const imgData = await getReportImages(Number(idToFetch));
        if (imgData?.images) {
          setImages(imgData.images.filter((img) => img.url));
        }
      } catch (imgErr) {
        console.warn("Could not load report images:", imgErr);
      }
    } catch (err) {
      console.error(err);
      setError(`Report #${idToFetch} not found or failed to load.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialId) {
      fetchReportDetails(initialId);
    }
  }, [initialId, fetchReportDetails]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchReportDetails(reportIdInput.trim());
  };

  return (
    <div className="civic-page" style={{ minHeight: "100vh" }}>
      <Navbar />

      <main style={{ maxWidth: "840px", margin: "40px auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 className="page-hero-title">
            Track Your Water Report
          </h1>
          <p style={{ color: "#475569", marginTop: "8px", fontSize: "0.9375rem" }}>
            Check the live progress, AI classification, and resolution status of your reported issue.
          </p>
        </div>

        {/* Search Card */}
        <div
          className="surface-card"
          style={{
            padding: "24px",
            marginBottom: "28px",
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "240px", position: "relative" }}>
              <input
                type="number"
                placeholder="Enter numeric Report ID (e.g. 1, 102)..."
                value={reportIdInput}
                onChange={(e) => setReportIdInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  fontSize: "0.9375rem",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              <SearchIcon size={16} />
              <span>{loading ? "Searching..." : "Track Report"}</span>
            </button>
          </form>

          {error && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 16px",
                borderRadius: "8px",
                backgroundColor: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#B91C1C",
                fontSize: "0.875rem",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertTriangleIcon size={16} color="#DC2626" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Report Result */}
        {report && (
          <div
            className="surface-card"
            style={{
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F1F5F9", paddingBottom: "16px" }}>
              <div>
                <span className="micro-label">
                  REPORT DOSSIER
                </span>
                <h2 className="section-card-title" style={{ fontSize: "1.375rem", margin: "4px 0 0" }}>
                  Report <span className="font-mono">#{report.id}</span>
                </h2>
              </div>
              <StatusBadge status={report.status || "new"} />
            </div>

            {/* Classification & Details */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "14px",
              }}
            >
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "14px 16px", borderRadius: "10px" }}>
                <span className="micro-label">AI CLASSIFICATION</span>
                <div style={{ fontWeight: 600, color: "#0284C7", fontSize: "1rem", marginTop: "4px", textTransform: "capitalize" }}>
                  {(report.classification || "Pending").replaceAll("_", " ")}
                </div>
              </div>

              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "14px 16px", borderRadius: "10px" }}>
                <span className="micro-label">LEAK PROBABILITY</span>
                <div className="font-mono" style={{ fontWeight: 700, color: "#0F172A", fontSize: "1.125rem", marginTop: "4px" }}>
                  {report.leak_probability !== undefined && report.leak_probability !== null
                    ? `${Math.round(Number(report.leak_probability) * 100)}%`
                    : "Analyzing..."}
                </div>
              </div>

              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "14px 16px", borderRadius: "10px" }}>
                <span className="micro-label">CORRELATED INCIDENT</span>
                <div className="font-mono" style={{ fontWeight: 600, color: report.incident_id ? "#15803D" : "#64748B", fontSize: "1rem", marginTop: "4px" }}>
                  {report.incident_id ? `Linked to Inc #${report.incident_id}` : "Single Event"}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <span className="micro-label">DESCRIPTION</span>
              <p
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  padding: "16px",
                  borderRadius: "10px",
                  fontSize: "0.875rem",
                  color: "#334155",
                  marginTop: "6px",
                  lineHeight: 1.5,
                }}
              >
                {report.description}
              </p>
            </div>

            {/* Photos */}
            {images.length > 0 && (
              <div>
                <span className="micro-label">ATTACHED EVIDENCE</span>
                <div style={{ display: "flex", gap: "12px", marginTop: "8px", flexWrap: "wrap" }}>
                  {images.map((img, idx) => (
                    <a key={idx} href={img.url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={img.url}
                        alt={`Report ${report.id} proof ${idx + 1}`}
                        style={{
                          width: "90px",
                          height: "90px",
                          borderRadius: "8px",
                          objectFit: "cover",
                          border: "1px solid #E2E8F0",
                        }}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid #F1F5F9" }}>
              <span className="font-mono" style={{ fontSize: "0.75rem", color: "#64748B" }}>
                Submitted: {report.created_at ? new Date(report.created_at).toLocaleString() : "Recently"}
              </span>
              <Link to="/report" className="btn-secondary" style={{ textDecoration: "none", fontSize: "0.8125rem", padding: "6px 14px" }}>
                + Submit Another Report
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default TrackReport;
