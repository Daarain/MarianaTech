# MarianaTech FastAPI AI Service

Dedicated AI/ML microservice for MarianaTech side-scan sonar anomaly detection, classification, and acoustic intelligence.

---

## 🏗 System Architecture

The AI Service is completely decoupled from application persistence (MongoDB Atlas) and user authentication. All user state and database operations are managed by the main Node.js backend.

```
React Frontend  <--->  Node.js + Express Backend  <--->  FastAPI AI Service
                             |                                |
                             v                                v
                       MongoDB Atlas                    PyTorch / YOLO Models
```

---

## ⚡ Pipeline Stages (`app/pipeline/processor.py`)

The service processes acoustic sonar data through 11 modular, extensible stages:

1. **Sonar Quality Assessment**: Calculates SNR (signal-to-noise ratio), pixel resolution (cm/px), and coverage score.
2. **Preprocessing**: Applies acoustic gain control, slant-range correction, and median noise filtering.
3. **Image Tiling**: Generates sliding-window tiles (e.g. 512x512) for dense inference.
4. **YOLO Detection**: Executes object detection targeting underwater contacts.
5. **Segmentation**: Extracts acoustic shadow boundaries and target masks.
6. **Classification**: Classifies contacts into 7 supported target classes:
   - `unidentified_object`
   - `shipwreck`
   - `marine_life_cluster`
   - `debris_field`
   - `geological_formation`
   - `pipeline_damage`
   - `mine_like_contact`
7. **Natural vs Artificial Analysis**: Analyzes target linear symmetry and acoustic shadow characteristics.
8. **Confidence Scoring**: Computes normalized confidence scores (0.0 to 1.0).
9. **Priority Calculation**: Categorizes contacts into `critical`, `high`, `medium`, `low`.
10. **Evidence Generation**: Generates descriptive acoustic intelligence summary logs.
11. **Geospatial Resolution**: Maps pixel coordinates to geographic coordinates (lat/long/depth) when available.

---

## 🚀 Endpoints

### 1. `GET /health`
Returns service status and operational metadata.
**Response**:
```json
{
  "status": "ok",
  "service": "marianatech-ai-service",
  "version": "1.0.0",
  "environment": "development"
}
```

### 2. `POST /internal/inference`
Executes internal AI inference requested by the Node.js backend worker.
**Request**:
```json
{
  "jobId": "JOB-2026-0001",
  "missionId": "MSN-2026-0146",
  "fileId": "FIL-2026-0001",
  "inputReference": "uploads/missions/MSN-2026-0146/scan.xtf",
  "modelVersion": "v1.0.0",
  "configuration": {}
}
```

**Response**:
```json
{
  "jobId": "JOB-2026-0001",
  "status": "completed",
  "modelVersion": "YOLOv8-sonar-v1.0.0",
  "quality": {
    "snrDb": 24.5,
    "resolutionCm": 5.0,
    "coverageScore": 0.98
  },
  "anomalies": [
    {
      "className": "mine_like_contact",
      "confidence": 0.93,
      "latitude": -6.215,
      "longitude": 71.855,
      "priority": "critical",
      "depthM": 4185.0,
      "sizeM": 2.9,
      "description": "Acoustic target detected matching mine like contact profile."
    }
  ],
  "processing": {
    "inferenceTimeMs": 142,
    "tilesProcessed": 64
  },
  "errors": []
}
```

---

## 💻 Local Setup & Execution

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run service locally**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

3. **Run automated unit tests**:
   ```bash
   pytest
   ```

4. **Run via Docker**:
   ```bash
   docker build -t marianatech-ai-service .
   docker run -p 8000:8000 marianatech-ai-service
   ```
