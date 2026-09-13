<<<<<<< HEAD
Sih
=======
# MarianaTech — AI-Powered Side-Scan Sonar Marine Debris & Anomaly Detection System

**SIH Problem Statement 26057**: *AI-Powered Automated Underwater Marine Debris and Anomaly Detection System using Side-Scan Sonar Imagery*  
**Nodal Agency**: *National Institute of Ocean Technology (NIOT) / Ministry of Earth Sciences (MoES)*

---

## 🌊 Overview

MarianaTech is an advanced marine intelligence platform engineered to automate the acoustic signal processing, target detection, classification, confidence scoring, geolocation, mapping, survey reporting, and mission archiving of Side-Scan Sonar (SSS) imagery. 

### Key Features
- **Acoustic Signal Preprocessing**: Bilateral Speckle Noise Reduction & CLAHE (Contrast Limited Adaptive Histogram Equalization).
- **AI Anomaly Target Detection**: Multi-scale contour extraction combining Otsu Binarization & Adaptive Gaussian Thresholding.
- **Acoustic Shadow Analysis**: Trailing subsea ROI sampling to detect target acoustic shadows and estimate contact relief.
- **Rule & Model Classification**: Automatic categorization into `shipwreck`, `mine_like_contact`, `pipeline_damage`, `debris_field`, `marine_life_cluster`, `geological_formation`, and `unidentified_object`.
- **Interactive Sonar Workstation**: Bounding box overlays, pan/zoom, acoustic shadow indicators, pixel-to-meter distance measurement tools, and scale bars.
- **Confidence Scoring & Noise Filtering**: Threshold slider ($0\% - 100\%$) for presentation-level noise filtering without altering raw model detections.
- **Geospatial Map Viewer**: Interactive Leaflet satellite & bathymetric map plotting contact markers with bidirectional selection synchronization.
- **Survey Report Engine & Export**: Instant PDF survey report preview with machine-readable CSV (`StreamingResponse`) and JSON exports.
- **Mission Archive & Registry**: Searchable, filterable persistent store allowing operators to reopen past analysis runs with full state recovery.

---

## 📋 System Requirements

- **Python**: Version 3.10 or higher
- **Node.js**: Version 18.0 or higher
- **Package Managers**: `pip` (Python) and `npm` (Node)
- **Operating System**: Windows / Linux / macOS

---

## 🚀 Quick Start Guide

### 1. Backend Setup & Launch (FastAPI Engine)

Navigate to the `Backend` directory, activate the virtual environment, and launch the server:

```bash
# 1. Navigate to Backend directory
cd Backend

# 2. Activate Python Virtual Environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Alternative for Command Prompt:
# .\venv\Scripts\activate.bat

# Alternative for Linux/macOS:
# source venv/bin/activate

# 3. Install dependencies (if needed)
pip install -r requirements.txt

# 4. Launch FastAPI Uvicorn Server
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The Backend API server will start at: **`http://127.0.0.1:8000`**  
Swagger API Documentation: **`http://127.0.0.1:8000/docs`**

---

### 2. Frontend Setup & Launch (React / Vite UI)

In a new terminal window, navigate to the `Frontend` directory and start the Vite development server:

```bash
# 1. Navigate to Frontend directory
cd Frontend

# 2. Install dependencies (if needed)
npm install

# 3. Launch Vite Development Server
npm run dev
```

The Frontend Application will launch at: **`http://localhost:5173`** (or port specified by Vite).

---

## 🧪 Running Automated Test Suites

### Backend Unit Tests
Runs 20 comprehensive unit tests covering API health, file upload edge cases (0-byte, 50MB limit, invalid formats), coordinate bounds, report generation, and history CRUD:

```bash
cd Backend
.\venv\Scripts\python.exe -m unittest test_backend.py
```

### Frontend Typecheck & Production Build
Verifies TypeScript static types and builds the optimized Vite production bundle with route-level code splitting:

```bash
cd Frontend

# Run TypeScript Typecheck
npm run typecheck

# Run Production Build
npm run build
```

---

## 🛰️ API Endpoint Reference

| HTTP Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | System operational status and engine health check |
| `POST` | `/api/v1/detect` | Upload raw sonar image (`file`), latitude, and longitude for live ML pipeline analysis |
| `GET` | `/api/v1/missions` | Retrieve list of survey missions |
| `GET` | `/api/v1/missions/{id}` | Retrieve specific mission metadata |
| `GET` | `/api/v1/missions/{id}/anomalies` | Retrieve detected anomaly contacts for a mission |
| `GET` | `/api/v1/analyses` | Retrieve paginated analysis history items with status, search, and sort filters |
| `GET` | `/api/v1/analyses/stats` | Retrieve analysis history metrics (total, completed, processing, failed, total anomalies) |
| `DELETE` | `/api/v1/analyses/{id}` | Permanently delete an analysis record from the archive |
| `POST` | `/api/v1/missions/{id}/reports` | Generate survey report for a mission/analysis |
| `GET` | `/api/v1/missions/{id}/reports/download` | Download report as CSV stream (`?format=csv`) or JSON (`?format=json`) |

---

## 🗺️ User Workflow Guide

1. **Dashboard (`/dashboard`)**: View executive marine intelligence metrics, critical anomaly counts, and active subsea survey logs.
2. **Ingestion (`/missions/new`)**: Upload a Side-Scan Sonar scan (`.png`, `.jpg`, `.tiff`), enter vessel/operator details, set base GPS coordinates, and stage the dataset.
3. **Analysis Workspace (`/sonar-analysis`)**: Click **START AI ANALYSIS** to trigger the backend CV pipeline. View live telemetry, canvas bounding box overlays, and acoustic shadow tags.
4. **Filtering & Inspection**:
   - Use the **Confidence Threshold Slider** ($0\% - 100\%$) to filter noise.
   - Use the **Classification Filter** to isolate targets (`mine_like_contact`, `shipwreck`, etc.).
   - Use the distance measurement tool to measure anomaly lengths in meters.
5. **Geospatial Map (`/map`)**: View detected contacts mapped onto interactive Leaflet ocean satellite maps with bidirectional card selection.
6. **Survey Reports (`/reports`)**: Inspect generated survey reports and download machine-readable CSV / JSON files or print PDF summaries.
7. **Mission History (`/history`)**: Browse persistent survey archives and reopen past analyses with full state recovery.

---

## 📁 Repository Structure

```
MarianaTech/
├── Backend/
│   ├── main.py              # FastAPI application server & REST endpoints
│   ├── ml_pipeline.py       # OpenCV Bilateral/CLAHE/Contour CV ML engine
│   ├── test_backend.py      # Unit test suite (20 tests)
│   ├── requirements.txt     # Python dependencies
│   └── venv/                # Python virtual environment
├── Frontend/
│   ├── src/
│   │   ├── api/             # API client layer (client.ts, detect.ts, history.ts, etc.)
│   │   ├── components/      # UI components (sonar viewer, map, panels, error bounds)
│   │   ├── context/         # React Context (MissionContext, AuthContext, ToastContext)
│   │   ├── pages/           # Lazy-loaded page components (SonarViewer, MapView, Reports, etc.)
│   │   └── App.tsx          # Application shell with React.lazy route splitting
│   ├── package.json         # Node dependencies & scripts
│   └── vite.config.ts       # Vite build configuration
└── README.md                # Project documentation
```

---

## 📜 License & Accreditation

Built for **Smart India Hackathon (SIH) 2026** — Problem Statement 26057  
**Nodal Agency**: National Institute of Ocean Technology (NIOT) / Ministry of Earth Sciences (MoES), Government of India.
>>>>>>> ebbed007bedd0cadb9cb932d17b8b5754171fc42
