# CivicPulse 💧
> **AI-Powered Municipal Water Incident Intelligence & Dispatch Platform**

CivicPulse is an end-to-end civic infrastructure management platform designed to automate and accelerate municipal response to urban water leaks, pipe bursts, and water supply issues. By combining citizen engagement, computer vision verification, geospatial clustering, and crew dispatch workflows, CivicPulse turns community reports into verified, actionable municipal work orders in real time.

---

## 🌟 Key Features

### 1. Citizen Reporting & Tracking
* **Instant Incident Reporting**: Citizens report water leaks with descriptions, severity estimations, and photographic evidence.
* **Geospatial Pinpointing**: Automatically captures GPS coordinates or allows pin-drop location selection via an interactive map.
* **Public Report Tracking**: Citizens receive a unique tracking token to monitor report verification and dispatch progress in real time.

### 2. Autonomous AI Verification & Prioritization Pipeline
* **Computer Vision Leak Detection**: Evaluates uploaded incident photos using fine-tuned **YOLOv8** classification models to confirm water leaks and filter spurious submissions.
* **NLP Text Classification**: Analyzes textual descriptions to validate severity, leak types, and urgency.
* **Spatio-Temporal Deduplication & Clustering**: Groups nearby reports submitted within close spatial and temporal windows into a single unified incident, eliminating duplicate maintenance dispatches.
* **Dynamic Priority Scoring**: Calculates priority based on severity, location sensitivity, and aggregate report volume.

### 3. Dispatcher & Operations Center
* **Interactive GIS Map**: Real-time Leaflet visualization of reported leaks, cluster centers, severity tiers, and field crew locations.
* **One-Click Crew Dispatch**: Assigns certified municipal field crews directly from the incident console.
* **Incident Lifecycle Management**: Track statuses from `Reported` ➔ `Verified` ➔ `Dispatched` ➔ `In Progress` ➔ `Resolved`.

### 4. Field Crew Portal
* **Mobile-Optimized Interface**: Dedicated portal for municipal repair crews to receive work orders, review incident photos and map coordinates, update progress, and log completed repairs.

### 5. Analytics & Metrics Dashboard
* High-level visibility into total incidents reported, average resolution time, unresolved high-priority leaks, and recurring infrastructure hotspots.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Leaflet, React-Leaflet, React Router v7, Modern CSS3 |
| **Backend API** | FastAPI (Python 3.11+), Pydantic v2, Uvicorn, Python-Multipart |
| **Database & Storage** | PostgreSQL with PostGIS / Supabase, SQLAlchemy 2.0, GeoAlchemy2 |
| **AI / Computer Vision** | Ultralytics YOLOv8, Scikit-learn, PyTorch, Pillow, NumPy |
| **DevOps / Tunneling** | Cloudflare Tunnels (`cloudflared`), Vite Preview |

---

## 📂 Project Directory Structure

```text
Civicpulse/
├── Frontend/                 # React + Vite web application
│   ├── src/
│   │   ├── components/       # Reusable UI elements (Navbar, Map views, etc.)
│   │   ├── pages/            # Views (ReportLeak, TrackReport, Dashboard, Dispatch, CrewPortal)
│   │   ├── services/         # Axios / Fetch API integrations
│   │   ├── App.jsx           # Application routing
│   │   └── index.css         # Design tokens & styles
│   ├── package.json
│   └── vite.config.js
│
├── Backend/                  # FastAPI REST API
│   ├── app/
│   │   ├── routers/          # Route handlers (reports, incidents, crews, dispatches, ai_pipeline)
│   │   ├── models.py         # SQLAlchemy ORM models
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   ├── database.py       # DB connection pool setup
│   │   └── main.py           # FastAPI entrypoint
│   ├── requirements.txt
│   └── .env.example
│
├── ai/                       # AI intelligence & classification pipeline
│   ├── models/               # YOLO & NLP weights
│   ├── leak_detection.py     # Image verification using YOLOv8
│   ├── classify_text_report.py # Text extraction and classification
│   ├── clustering.py         # Geospatial incident grouping
│   ├── deduplication.py      # Duplicate report consolidation
│   ├── pipeline.py           # Master automated AI evaluation runner
│   └── train_yolo.py         # Training scripts for leak detection
│
├── .gitignore                # Protects secrets, node_modules, and virtualenvs
└── README.md
```

---

## 🚀 Getting Started & Local Setup

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **Python**: v3.10, v3.11, or v3.12
* **Git**: Installed and configured
* **PostgreSQL / Supabase**: Active database instance

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/<your-username>/Civicpulse.git
cd Civicpulse
```

---

### Step 2: Backend Setup

1. Open a terminal and navigate to the `Backend` directory:
   ```bash
   cd Backend
   ```
2. Create and activate a Python virtual environment:
   * **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   * **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   * Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   * Fill in your Supabase / PostgreSQL database connection credentials and file paths in `.env`.
5. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *API will be available at:* `http://localhost:8000`  
   *Interactive Swagger Documentation:* `http://localhost:8000/docs`

---

### Step 3: Frontend Setup

1. Open a new terminal and navigate to the `Frontend` directory:
   ```bash
   cd Frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   * Copy `.env.example` to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   * Ensure `VITE_API_BASE_URL` points to your backend (default: `http://localhost:8000`).
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Application will be available at:* `http://localhost:5173`

---

### Step 4: AI Module Setup *(Optional for custom model training)*
1. Navigate to the `ai` directory:
   ```bash
   cd ai
   ```
2. Activate your virtual environment and install dependencies:
   ```bash
   pip install ultralytics torch scikit-learn
   ```
3. The AI pipeline is triggered seamlessly through the FastAPI backend via `/ai/run-pipeline`.

---

## 🌐 Live Deployment & Hosting

### Deploy Frontend (Vercel / Netlify)
1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/).
3. Import the repository and set **Root Directory** to `Frontend`.
4. Configure Environment Variable:
   * `VITE_API_BASE_URL`: URL of your deployed backend or public tunnel.
5. Click **Deploy**.

### Expose or Deploy Backend
* **Cloud Option**: Deploy FastAPI on [Render](https://render.com/), [Railway](https://railway.app/), or [Fly.io](https://fly.io/).
* **Quick Live Tunnel (Cloudflare)**:
  ```bash
  cloudflared tunnel --url http://localhost:8000
  ```
  Use the generated `https://*.trycloudflare.com` URL as `VITE_API_BASE_URL`.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
