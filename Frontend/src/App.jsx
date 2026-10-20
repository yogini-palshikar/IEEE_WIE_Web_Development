import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import ReportLeak from "./pages/ReportLeak";
import TrackReport from "./pages/TrackReport";
import Dashboard from "./pages/Dashboard";
import Dispatch from "./pages/Dispatch";
import IncidentDetails from "./pages/IncidentDetails";
import CrewPortal from "./pages/CrewPortal";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report" element={<ReportLeak />} />
        <Route path="/track" element={<TrackReport />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dispatch" element={<Dispatch />} />
        <Route path="/crew" element={<CrewPortal />} />
        <Route path="/incidents/:id" element={<IncidentDetails />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;