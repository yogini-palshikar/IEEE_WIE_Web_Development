import {
  createReport,
  matchReportToIncident,
  uploadReportImages,
} from "../services/api";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MapView from "../components/MapView";
import IncidentMap from "../components/IncidentMap";
import Navbar from "../components/Navbar";
import {
  MapPinIcon,
  CameraIcon,
  CpuIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  FileTextIcon,
  RadioIcon,
  ImageIcon,
  ArrowRightIcon,
} from "../components/Icons";
import "./ReportLeak.css";

function ReportLeak() {
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState("");

  const [images, setImages] = useState([]);
  const [problemType, setProblemType] = useState("Waterlogging");
  const [severity, setSeverity] = useState("Medium");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittedReportId, setSubmittedReportId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // GET CURRENT LOCATION
  // ==========================================
  const getLocation = () => {
    setLocationLoading(true);
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError(
        "Geolocation is not supported by this browser."
      );
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });

        setLocationLoading(false);
      },
      (error) => {
        console.log(error);

        setLocationError(
          "Unable to detect your location. Please allow location access."
        );

        setLocationLoading(false);
      }
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  // ==========================================
  // IMAGE UPLOAD
  // ==========================================
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    const invalid = files.find(
      (file) => !file.type.startsWith("image/")
    );

    if (invalid) {
      alert("Please upload only image files.");
      return;
    }

    if (images.length + files.length > 5) {
      alert("Maximum 5 photos allowed.");
      return;
    }

    setImages((prev) => [...prev, ...files]);

    e.target.value = "";
  };

  // ==========================================
  // REMOVE IMAGE
  // ==========================================
  const removeImage = (index) => {
    setImages((prev) =>
      prev.filter((_, imageIndex) => imageIndex !== index)
    );
  };

  // Create blob preview URLs once per image set; revoke old ones to prevent leaks (BUG-12)
  const previewUrls = useMemo(
    () => images.map((img) => URL.createObjectURL(img)),
    [images]
  );
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // ==========================================
  // SUBMIT REPORT
  // ==========================================
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!location) {
      alert("Please wait until your location is detected.");
      return;
    }

    if (!description.trim()) {
      alert("Please describe the water problem.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create the text report and run AI classification.
      const reportResult = await createReport({
        description: `[${problemType} / ${severity}] ${description}`,
        latitude: location.latitude,
        longitude: location.longitude,
      });

      if (!reportResult?.report_id) {
        throw new Error("Report was saved, but the backend did not return a report ID.");
      }

      setSubmittedReportId(reportResult.report_id);

      // 2. Match the new report to an existing or new incident.
      await matchReportToIncident(reportResult.report_id);

      // 3. Upload images if the user attached any.
      if (images.length > 0) {
        try {
          await uploadReportImages(reportResult.report_id, images);
        } catch (uploadErr) {
          console.error("Image upload failed:", uploadErr);
          alert(
            `Your report was submitted, but image upload failed: ${uploadErr.message}\n` +
            "The report has been saved without photos."
          );
        }
      }

      setSubmitted(true);
    } catch (err) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="civic-page">
      {/* Standardized Global Navbar */}
      <Navbar />

      {/* ==========================================
          HERO SECTION
      ========================================== */}
      <section className="hero-section">
        <div className="hero-badge">
          <AlertTriangleIcon size={14} color="#0284C7" />
          <span>Civic Issue Reporting</span>
        </div>

        <h1 className="page-hero-title">
          Report a Water Problem
        </h1>

        <p>
          Help improve your community by reporting water,
          drainage, and infrastructure problems.
        </p>

        {/* Hero Features Strip (Resolved text bug with icon badge + stacked title/subtitle) */}
        <div className="hero-features">
          <div className="hero-feature-card">
            <div className="hero-feature-icon-badge">
              <MapPinIcon size={20} color="#0284C7" />
            </div>
            <div className="hero-feature-text">
              <span className="hero-feature-title">Precise Location</span>
              <span className="hero-feature-subtitle">GPS automatically captured</span>
            </div>
          </div>

          <div className="hero-feature-card">
            <div className="hero-feature-icon-badge">
              <CameraIcon size={20} color="#0284C7" />
            </div>
            <div className="hero-feature-text">
              <span className="hero-feature-title">Visual Evidence</span>
              <span className="hero-feature-subtitle">Upload up to 5 photos</span>
            </div>
          </div>

          <div className="hero-feature-card">
            <div className="hero-feature-icon-badge">
              <CpuIcon size={20} color="#0284C7" />
            </div>
            <div className="hero-feature-text">
              <span className="hero-feature-title">AI Analysis</span>
              <span className="hero-feature-subtitle">Reports intelligently correlated</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          MAIN CONTENT
      ========================================== */}
      <main className="report-container">
        <form onSubmit={handleSubmit}>

          {/* ==========================================
              LOCATION CARD
          ========================================== */}
          <section className="surface-card location-card">
            <div className="section-heading">
              <div className="section-icon">
                <MapPinIcon size={20} color="#0284C7" />
              </div>
              <div>
                <h2>Location</h2>
                <p>
                  Your current location helps authorities identify the exact issue.
                </p>
              </div>
            </div>

            {/* LOCATION LOADING */}
            {locationLoading && (
              <div className="location-status loading">
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <RadioIcon size={20} color="#0284C7" />
                </div>
                <div>
                  <strong style={{ color: '#0F172A', display: 'block', fontSize: '0.875rem' }}>
                    Detecting your location...
                  </strong>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
                    Please allow location access in your browser.
                  </p>
                </div>
              </div>
            )}

            {/* LOCATION ERROR */}
            {locationError && (
              <div className="location-status error-location">
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <AlertTriangleIcon size={20} color="#DC2626" />
                </div>
                <div>
                  <strong style={{ color: '#991B1B', display: 'block', fontSize: '0.875rem' }}>
                    Location could not be detected
                  </strong>
                  <p style={{ margin: '4px 0 10px', fontSize: '0.8125rem', color: '#B91C1C' }}>
                    {locationError}
                  </p>
                  <button
                    type="button"
                    onClick={getLocation}
                    className="btn-danger-soft"
                    style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* LOCATION SUCCESS */}
            {location && (
              <div className="location-layout">
                {/* LEFT SIDE DETAILS */}
                <div className="location-left">
                  <div className="location-status success-location">
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle2Icon size={16} color="#15803D" />
                    </div>
                    <div>
                      <strong style={{ color: '#166534', display: 'block', fontSize: '0.875rem' }}>
                        Location detected successfully
                      </strong>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#15803D' }}>
                        Your coordinates are automatically tagged with this report.
                      </p>
                    </div>
                  </div>

                  <div className="location-stats">
                    <div className="location-stat">
                      <span className="stat-icon blue">N</span>
                      <div>
                        <small>Latitude</small>
                        <strong className="font-mono">{location.latitude.toFixed(6)}</strong>
                      </div>
                    </div>

                    <div className="location-stat">
                      <span className="stat-icon green">E</span>
                      <div>
                        <small>Longitude</small>
                        <strong className="font-mono">{location.longitude.toFixed(6)}</strong>
                      </div>
                    </div>

                    <div className="location-stat">
                      <span className="stat-icon purple">±</span>
                      <div>
                        <small>Accuracy</small>
                        <strong className="font-mono">~{Math.round(location.accuracy)}m</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE MAP */}
                <div className="map-wrapper">
                  <MapView location={location} />
                </div>
              </div>
            )}
          </section>

          {/* ==========================================
              INCIDENT INTELLIGENCE MAP
              (Removed redundant duplicate legend bar)
          ========================================== */}
          <section className="surface-card incident-intelligence-card">
            <div className="section-heading">
              <div className="section-icon">
                <CpuIcon size={20} color="#0284C7" />
              </div>
              <div>
                <h2>CivicPulse Incident Intelligence</h2>
                <p>
                  View correlated civic incidents detected across the monitored area.
                </p>
              </div>
            </div>

            <div className="incident-map-wrapper">
              <IncidentMap />
            </div>
          </section>

          {/* ==========================================
              PHOTO + DETAILS (2-Column Form Grid)
          ========================================== */}
          <div className="form-grid">

            {/* PHOTO CARD */}
            <section className="surface-card photo-card">
              <div className="section-heading">
                <div className="section-icon">
                  <CameraIcon size={20} color="#0284C7" />
                </div>
                <div>
                  <h2>Visual Evidence</h2>
                  <p>Add photos showing the water problem.</p>
                </div>
              </div>

              <div className="upload-box">
                <div className="upload-icon">
                  <ImageIcon size={38} color="#0284C7" />
                </div>
                <h3>Upload photos</h3>
                <p>JPG, PNG or other image formats (up to 5)</p>

                <label className="choose-photo">
                  <ImageIcon size={16} color="#0284C7" />
                  <span>Choose Photos</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>

                <small style={{ marginTop: 10, color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>
                  {images.length}/5 photos selected
                </small>
              </div>

              {/* PHOTO PREVIEWS */}
              {images.length > 0 && (
                <div className="photo-preview-grid">
                  {images.map((image, index) => (
                    <div className="photo-preview-card" key={index}>
                      <img
                        src={previewUrls[index]}
                        alt={`Preview ${index + 1}`}
                      />
                      <button
                        type="button"
                        className="remove-photo-btn"
                        onClick={() => removeImage(index)}
                        title="Remove image"
                      >
                        ✕
                      </button>
                      <div className="photo-number">
                        #{index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* DETAILS CARD */}
            <section className="surface-card details-card">
              <div className="section-heading">
                <div className="section-icon">
                  <FileTextIcon size={20} color="#0284C7" />
                </div>
                <div>
                  <h2>Problem Details</h2>
                  <p>Tell us what is happening on site.</p>
                </div>
              </div>

              <div className="details-form">
                {/* PROBLEM TYPE */}
                <div className="field-group">
                  <label>Problem Type</label>
                  <select
                    value={problemType}
                    onChange={(event) => setProblemType(event.target.value)}
                  >
                    <option value="Waterlogging">Waterlogging</option>
                    <option value="Water Leakage">Water Leakage</option>
                    <option value="Pipe Burst">Pipe Burst</option>
                    <option value="Drainage Problem">Drainage Problem</option>
                    <option value="Sewage Overflow">Sewage Overflow</option>
                    <option value="Damaged Water Pipe">Damaged Water Pipe</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* SEVERITY */}
                <div className="field-group">
                  <label>Severity</label>
                  <select
                    value={severity}
                    onChange={(event) => setSeverity(event.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                  <div className="severity-help">
                    Estimated local impact
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div className="field-group description-field">
                  <label>Describe the Problem</label>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Describe what is happening at this location..."
                    rows="6"
                    maxLength="500"
                  />
                  <div className="character-count">
                    {description.length}/500
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* ==========================================
              SUBMIT CARD
              (Fixed spacing: 18px margin-bottom on subtitle, .btn-primary)
          ========================================== */}
          <section className="surface-card submit-card">
            {!submitted ? (
              <div className="submit-content">
                <div>
                  <h2>Ready to submit?</h2>
                  <p style={{ marginBottom: '18px' }}>
                    Your report will be processed by CivicPulse's intelligence system.
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ minWidth: '240px', padding: '12px 24px', fontSize: '0.9375rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  disabled={isSubmitting}
                >
                  <AlertTriangleIcon size={18} color="#FFFFFF" />
                  <span>{isSubmitting ? "Submitting Report..." : "Submit Report"}</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#F0FDF4', border: '1px solid #BBF7D0', padding: 24, borderRadius: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle2Icon size={24} color="#15803D" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#166534', margin: '0 0 4px 0' }}>
                    Report Submitted Successfully!
                  </h2>
                  <p style={{ fontSize: '0.875rem', color: '#15803D', margin: 0 }}>
                    Your water issue report has been securely recorded. CivicPulse will analyze and dispatch response crews as appropriate.
                  </p>
                  {submittedReportId && (
                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span className="font-mono" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0369A1', background: '#EFF6FF', border: '1px solid #BAE6FD', padding: '6px 12px', borderRadius: '6px' }}>
                        Report Reference: #{submittedReportId}
                      </span>
                      <Link
                        to={`/track?id=${submittedReportId}`}
                        className="btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: '0.8125rem', textDecoration: 'none' }}
                      >
                        <span>Track Status Live</span>
                        <ArrowRightIcon size={14} />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

        </form>
      </main>

      {/* ==========================================
          FOOTER
      ========================================== */}
      <footer className="civic-footer">
        <div className="footer-left">
          <strong>CivicPulse</strong>
          <span>• Water Infrastructure Intelligence</span>
        </div>
        <div className="footer-right">
          Improving urban resilience, one report at a time.
        </div>
      </footer>
    </div>
  );
}

export default ReportLeak;