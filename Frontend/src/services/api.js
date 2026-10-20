// Frontend/src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// ---------------------------------------------------------------------------
// JSON helper — sets Content-Type: application/json
// ---------------------------------------------------------------------------
async function request(path, options = {}) {
  const { headers, ...rest } = options;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "bypass-tunnel-reminder": "true",
      ...headers,
    },
    ...rest,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${path} failed (${res.status}): ${body}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Multipart helper — lets the browser set Content-Type + boundary automatically
// ---------------------------------------------------------------------------
async function multipartRequest(path, formData) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "bypass-tunnel-reminder": "true",
    },
    body: formData,
    // Do NOT set Content-Type — the browser must include the multipart boundary.
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${path} failed (${res.status}): ${body}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Incidents
// ---------------------------------------------------------------------------
export const getIncidents = () => request("/incidents/");
export const getIncident = (incidentId) => request(`/incidents/${incidentId}`);
export const updateIncident = (incidentId, data) =>
  request(`/incidents/${incidentId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const getLiveIncidents = () => request("/pipeline/live");
export const runPipeline = () =>
  request("/pipeline/run-pipeline", { method: "POST" });
export const resolveIncident = (incidentId) =>
  request(`/incidents/${incidentId}/resolve`, { method: "POST" });

// ---------------------------------------------------------------------------
// Crews & Dispatches
// ---------------------------------------------------------------------------
export const getCrews = () => request("/crews/");
export const getCrew = (crewId) => request(`/crews/${crewId}`);
export const updateCrewStatus = (crewId, { status, available }) =>
  request(`/crews/${crewId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, available }),
  });

export const getDispatches = () => request("/dispatches/");
export const createDispatch = ({ incident_id, crew_id, eta }) =>
  request("/dispatches/", {
    method: "POST",
    body: JSON.stringify({ incident_id, crew_id, eta }),
  });

// ---------------------------------------------------------------------------
export const getReports = () => request("/reports/");
export const getReport = (reportId) => request(`/reports/${reportId}`);

export const createReport = ({ description, latitude, longitude }) =>
  request("/reports/", {
    method: "POST",
    body: JSON.stringify({ description, latitude, longitude }),
  });

export const matchReportToIncident = (reportId) =>
  request(`/reports/${reportId}/match-incident`, { method: "POST" });

/**
 * Upload images for a report that already exists in the database.
 *
 * @param {number} reportId - ID returned by createReport
 * @param {File[]} files    - Array of File objects (max 5, max 5 MB each)
 * @returns {Promise<{report_id, count, paths}>}
 */
export const uploadReportImages = (reportId, files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  return multipartRequest(`/reports/${reportId}/images`, formData);
};

/**
 * Retrieve signed image URLs for a report.
 *
 * @param {number} reportId
 * @param {number} [expiresIn=3600] - URL lifetime in seconds
 * @returns {Promise<{report_id, images: Array<{path, url, expires_in}>}>}
 */
export const getReportImages = (reportId, expiresIn = 3600) =>
  request(`/reports/${reportId}/images?expires_in=${expiresIn}`);