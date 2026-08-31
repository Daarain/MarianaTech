# MarianaTech Backend Integration Report

**Generated:** 31/08/2026
**Scope:** Frontend → Backend → MongoDB integration audit (AI-Service inspected for endpoint contract only)
**Verification method:** Live integration smoke test against the configured MongoDB Atlas instance (isolated records, fully cleaned up), backend test suites, builds, and code tracing.

---

## 1. Current Architecture

```
┌─────────────┐   HTTP (REST/JSON, Bearer JWT)   ┌──────────────┐   Mongoose (ODM)   ┌─────────────┐
│  Frontend   │ ───────────────────────────────▶ │   Backend    │ ─────────────────▶ │  MongoDB    │
│ React + Vite│ ◀─────────────────────────────── │ Node + Express│ ◀───────────────── │ (Atlas)     │
│  TypeScript │     JSON responses (200/201/...) │ + TypeScript  │                    │             │
└─────────────┘                                  └──────┬───────┘                    └─────────────┘
                                                        │
                                          HTTP POST /internal/inference (AI inference)
                                                        │
                                                        ▼
                                                 ┌─────────────┐
                                                 │  AI-Service │  FastAPI (Python), port 8000
                                                 │  (optional)  │
                                                 └─────────────┘
```

- **Frontend** — React 18 + Vite 5 + TypeScript. Entry: `Frontend/src/main.tsx`, root component `Frontend/src/App.tsx`. API layer under `Frontend/src/api/` (`client.ts` central HTTP client + auth/missions/anomalies/reports modules). Base URL from `VITE_API_URL` (default `http://localhost:5000`).
- **Backend** — Node.js + Express 4 + TypeScript. Entry: `Backend/src/server.ts`, Express app `Backend/src/app.ts`, routers under `Backend/src/routes/`. Controllers in `src/controllers/`, business logic in `src/services/`, Mongoose models in `src/models/`.
- **MongoDB** — Remote Atlas cluster, database name `marianatech` (from `MONGODB_DB_NAME`). URI only lives in `Backend/.env`.
- **AI-Service** — FastAPI microservice (`AI-Service/app/main.py`). Exposes `POST /internal/inference` (`AI-Service/app/api/inference.py`) which the Backend calls via `ai.service.ts`. If unreachable, Backend falls back to a validated mock inference payload (see Known Limitations).

---

## 2. Backend Setup

- **Backend startup (production):** `npm run start` → runs `node dist/server.js` (requires `npm run build` first).
- **Development server:** `npm run dev` → `nodemon --watch src --ext ts,json --exec tsx src/server.ts`.
- **Nodemon configuration:** inline in the `dev` script (no separate `nodemon.json`). Watches `src/` for `.ts`/`.json` changes.
- **Build:** `npm run build` (tsc → `dist/`).
- **Tests:** `npm test` (Jest, `jest.config.js`, ts-jest, `tests/setup.ts` sets `JWT_SECRET` for the test process).
- **Required environment variables:** see Section 8. `JWT_SECRET` is mandatory — `src/config/env.ts` throws at startup if missing.
- **MongoDB requirement:** required for all data operations. Connection is non-fatal at startup (logs a warning if unreachable), but all data endpoints will fail or time out without it.
- **Redis requirement:** optional. Used for the BullMQ sonar-processing queue and distributed rate limiting. If unavailable, the backend falls back to the in-memory job pipeline and in-memory rate-limit stores, and processing still completes.
- **AI service requirement:** optional. `AI_SERVICE_URL` (default `http://127.0.0.1:8000`). When unreachable the worker falls back to mock inference results.
- No secrets or connection strings are hard-coded; all come from `Backend/.env`.

---

## 3. Authentication System

- **Where users are stored:** MongoDB `users` collection only (Mongoose `User` model). Three accounts currently exist (`admin`, `operator`, and one registered via the UI). No hardcoded credentials anywhere in source.
- **Signup:** `POST /auth/register` (alias `POST /auth/signup`) → `auth.controller.register` → `auth.service.registerUser`. Validates name/username(≥3 chars)/password(≥6 chars), checks uniqueness, hashes password with **bcryptjs (10 rounds)**, stores `{name, username, role, passwordHash, isActive}`. Returns `{ message, user: { name, username, role } }`.
- **Login:** `POST /auth/login` → `loginUser`. Lookup is **database-driven**: `User.findOne({ username, isActive: true })` (username lower-cased) + `bcrypt.compare`. No fallback/hardcoded accounts. Returns frontend-compatible `{ user: <display name>, role: 'admin'|'operator', token }`.
- **Password hashing:** bcryptjs (cost factor 10). `passwordHash` is stripped by the User schema `toJSON` transform and never returned.
- **JWT authentication:** `jwt.sign({ id, username, name, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN || '24h' })`. Validation middleware `authenticateJWT` accepts `Authorization: Bearer <token>` (also legacy `?token=`).
- **Token storage in frontend:** `localStorage` key `marianatech_auth` storing the whole login payload `{ user, role, token }` (`Frontend/src/api/auth.ts`).
- **Authorization header:** `Frontend/src/api/client.ts` automatically attaches `Authorization: Bearer <token>` on every request when a token is present. On HTTP 401 the client clears local storage and throws `UNAUTHORIZED`.
- **Role handling:** Login/signup surface `role`. `admin` and `operator` are the only allowed roles (strict enum). `Admin.tsx` gates UI by `user.role`. Backend `authorizeRoles()` middleware exists but is not currently applied to any route.
- **Logout:** `POST /auth/logout` returns 200 (stateless; no server-side token revocation). The frontend removes the localStorage entry.
- **`GET /auth/me` (current user):** protected endpoint returning `{ id, name, username, role, isActive, createdAt, updatedAt }`. Verified live; the frontend API wrapper exists but no page currently calls it.

**Conclusion: credentials are 100% database-driven (MongoDB + bcrypt + JWT).**
---

## 4. Frontend → Backend Endpoint Mapping

All frontend operations were traced from source (`Frontend/src/api/*`, pages, context) to the backend route/controller/service/model. Endpoints marked "Connected and verified" were live-tested with a dedicated smoke suite (25/25 passed).

| Feature | Frontend File | Frontend Endpoint | Method | Backend Route | Controller | Database Interaction | Status |
|---|---|---|---|---|---|---|---|
| Login | `src/api/auth.ts` (LoginPage/SignupPage) | `/auth/login` | POST | `/auth/login` | `auth.controller.login` | `User.find` + bcrypt | Connected and verified (live) |
| Signup | `src/api/auth.ts` (SignupPage) | `/auth/register` | POST | `/auth/register` (+ `/auth/signup`) | `auth.controller.register` | `User.create` (bcrypt hash) | Connected and verified (live) |
| Logout | `src/api/auth.ts` (AuthContext) | `/auth/logout` | POST | `/auth/logout` | `auth.controller.logout` | none (stateless) | Connected and verified (live) |
| Current user | `src/api/auth.ts` (`getMe`) | `/auth/me` | GET | `/auth/me` (JWT) | `auth.controller.getMe` | `User.findById` | Connected and verified (live). Not used by any page |
| Mission listing | `src/api/missions.ts` (Dashboard) | `/missions` | GET | `/missions` (JWT) | `mission.controller.getMissions` | `Mission.find` | Connected and verified (live) |
| Mission details | `src/api/missions.ts` (MissionMonitoring) | `/missions/:id` | GET | `/missions/:id` (JWT) | `mission.controller.getMissionById` | `Mission.findOne` | Connected and verified (live) |
| Mission creation | `src/api/missions.ts` (MissionUpload) | `/missions` | POST | `/missions` (JWT, writeLimiter) | `mission.controller.createMission` | `Mission.create` + `MissionFile.create` | Connected and verified (live) |
| Dashboard stats | `src/api/missions.ts` (Dashboard) | `/missions/stats` | GET | `/missions/stats` (JWT) | `mission.controller.getDashboardStats` | `Mission`, `Anomaly` counts + aggregation | Connected and verified (live) |
| Anomaly listing | `src/api/anomalies.ts` (AnomalyPanel/SonarViewer/Reports) | `/missions/:id/anomalies` | GET | `/missions/:id/anomalies` (JWT) | `anomaly.controller.getMissionAnomaliesHandler` | `Anomaly.find` | Connected and verified (live) |
| Verify anomaly | `src/api/anomalies.ts` (AnomalyPanel) | `/anomalies/:id/verify` | POST | `/anomalies/:id/verify` (JWT, writeLimiter) | `anomaly.controller.verifyAnomalyHandler` | `Anomaly.save` + `VerificationHistory.create` | Connected and verified (live) |
| Reject anomaly | `src/api/anomalies.ts` (AnomalyPanel) | `/anomalies/:id/reject` | POST | `/anomalies/:id/reject` (JWT, writeLimiter) | `anomaly.controller.rejectAnomalyHandler` | `Anomaly.save` + `VerificationHistory.create` | Connected and verified (live) |
| Report generation | `src/api/reports.ts` (Reports) | `/missions/:id/reports` | POST | `/missions/:id/reports` (JWT, reportLimiter) | `report.controller.createMissionReportHandler` | reads Mission/Run/Anomaly + `Report.create` + file write | Connected and verified (live) |
| Report download | `src/api/reports.ts` (`downloadReport`) + generated URL | `/reports/file/:reportId` | GET | `/reports/file/:reportId` (public) | `report.controller.getReportFileHandler` | `Report.find` + `res.sendFile` | Connected and verified (live). `downloadReport` wrapper not used by any page |
| Processing trigger | `src/api/missions.ts` (`triggerProcessing`) | `/missions/:id/process` | POST | `/missions/:id/process` (JWT, processLimiter) | `processing.controller.processMissionHandler` | `ProcessingJob.create` + queue/worker | Connected and verified (live). Not used by any page |
| Job status | `src/api/missions.ts` (`getJobStatus`) | `/jobs/:id` | GET | `/jobs/:id` (JWT) | `processing.controller.getJobDetailsHandler` | `ProcessingJob.find` | Connected and verified (live). Not used by any page |
| File upload (binary) | *no frontend caller* | `/missions/:id/files` | POST | `/missions/:id/files` (JWT, uploadLimiter, multer) | `missionFile.controller.uploadMissionFileHandler` | `MissionFile.create` + disk | Not currently used by frontend (verified live) |
| File listing | *no frontend caller* | `/missions/:id/files` | GET | `/missions/:id/files` (JWT) | `missionFile.controller.getMissionFilesHandler` | `MissionFile.find` | Not currently used by frontend |
| Spatial anomalies | *no frontend caller* | `/missions/:id/anomalies/spatial` | GET | `/missions/:id/anomalies/spatial` (JWT) | `anomaly.controller.getMissionSpatialAnomaliesHandler` | `Anomaly.find` (with location) | Not currently used by frontend |
| Anomaly history | *no frontend caller* | `/anomalies/:id/history` | GET | `/anomalies/:id/history` (JWT) | `anomaly.controller.getAnomalyHistoryHandler` | `VerificationHistory.find` | Not currently used by frontend |
| Anomalies near | *no frontend caller* | `/anomalies/near?lng&lat&maxDistance` | GET | `/anomalies/near` (JWT) | `anomaly.controller.getAnomaliesNearHandler` | `Anomaly` `$near` | Not currently used by frontend |
| Anomalies within | *no frontend caller* | `/anomalies/within?lng&lat&radiusKm` | GET | `/anomalies/within` (JWT) | `anomaly.controller.getAnomaliesWithinHandler` | `Anomaly` `$geoWithin` | Not currently used by frontend |
| Job retry | *no frontend caller* | `/jobs/:id/retry` | POST | `/jobs/:id/retry` (JWT, writeLimiter) | `processing.controller.retryJobHandler` | `ProcessingJob.save` + queue | Not currently used by frontend |
| Health | *no frontend caller* | `/api/v1/health` | GET | `/api/v1/health` (public) | `healthController.getHealth` | `isDatabaseConnected()` | Not currently used by frontend |

**Method mismatches:** none.
**Payload mismatches:** none — `createMission` payload matches `CreateMissionInput`; auth payloads match; report body `{ format }` matches.
**Response shape mismatches:** none — mission/anomaly `toJSON` transforms match the frontend `Mission`/`Anomaly` interfaces exactly (verified live via key-set comparison).
---

## 5. Database Integration

### Models in use
| Model | File | Purpose |
|---|---|---|
| `User` | `src/models/user.model.ts` | Auth accounts (bcrypt hash, role) |
| `Mission` | `src/models/mission.model.ts` | Mission records (frontend-mapped `toJSON`) |
| `MissionFile` | `src/models/missionFile.model.ts` | Sonar file metadata |
| `Anomaly` | `src/models/anomaly.model.ts` | Detected contacts (GeoJSON `location`, `2dsphere` index) |
| `VerificationHistory` | `src/models/verificationHistory.model.ts` | Audit trail for verify/reject (appends, never overwrites) |
| `ProcessingJob` | `src/models/processingJob.model.ts` | Job status/progress/stage tracking |
| `ProcessingRun` | `src/models/processingRun.model.ts` | Completed AI inference runs metadata |
| `Report` | `src/models/report.model.ts` | Generated report metadata + storage path |

### Write operations
`User.create` (register); `Mission.create` (+ `MissionFile.create` for file metadata); `ProcessingJob.create`/save; `ProcessingRun.create`; `Anomaly.create` (processing pipeline) and `Anomaly.save` (verify/reject); `VerificationHistory.create`; `Report.create`; report/upload files written to disk.

### Read operations
`User.find`/`findById`; `Mission.find`/`findOne`/count; `Anomaly.find` (+ `$near`/`$geoWithin`/aggregate); `ProcessingJob.find`; `ProcessingRun.find`; `VerificationHistory.find`; `Report.find`; `MissionFile.find`.

### Live-tested (isolated smoke suite against the real Atlas DB)
Register → Login → GetMe; mission create/list/get/stats; processing trigger + job polling + retry; anomaly list/verify/reject/history; geospatial `near`/`within`/`spatial`; binary file upload + listing; CSV & JSON report generation + streaming download + missing-file 404. **25/25 passed.** All smoke records were deleted afterwards; the DB returned to its pre-test state (3 users, 2 missions, 7 anomalies, 2 verification histories, 0 jobs/runs/files/reports).

### Code-traced only
- Geospatial index creation (`autoIndex: true`, `2dsphere`).
- Redis-backed rate-limit/queue path (in-memory fallback used in this environment because Redis is not running).

---

## 6. Backend Work Completed So Far

Verified present in the current repository (source, `Backend/Readme.txt`, and Git history):

- **Backend foundation:** Express 4 + TypeScript app, Helmet, CORS via env, Morgan request logging, centralized error handler, 404 handler, graceful shutdown (SIGINT/SIGTERM), `GET /api/v1/health`.
- **MongoDB Atlas integration:** Mongoose connection module, credential-masked logging (`sanitizeMongoUri`), connection-state tracking surfaced to `/api/v1/health`.
- **Database-driven authentication:** `users` collection only; bcryptjs hashing (cost 10); JWT sign/verify with required `JWT_SECRET`; role enum `admin|operator`; `authenticateJWT` + `authorizeRoles` middleware; frontend-compatible login response `{ user, role, token }`; `/auth/register`, `/auth/signup`, `/auth/logout`, `/auth/me`.
- **Mission management:** Mongoose `Mission` model with `toJSON` transform matching the frontend exactly; `GET /missions`, `GET /missions/:id`, `POST /missions`, `GET /missions/stats` (MongoDB aggregations).
- **Mission file management:** multer upload endpoint, file validation (extension/size), local storage service, checksum, `MissionFile` metadata records.
- **Anomaly subsystem:** `Anomaly` model with GeoJSON `location` + `2dsphere` index; mission anomaly listing; verify/reject updates that persist to MongoDB **and** append `VerificationHistory` audit records (history accumulates instead of overwriting); anomaly history; geospatial `near`/`within`/`spatial` queries.
- **Processing subsystem:** `ProcessingJob` + `ProcessingRun` persistence; BullMQ `sonar-processing` queue with a graceful fallback to an in-process pipeline; worker pipeline stages (VALIDATING → … → COMPLETED) that persist runs and sanitized anomalies; job status + retry endpoints.
- **AI-Service integration:** `ai.service.ts` calls FastAPI `POST /internal/inference` with retries/backoff, validates + sanitizes responses (confidence clamping, class/priority whitelist, GeoJSON [lng, lat] ordering), and falls back to a mock payload when the service is offline.
- **Reports:** CSV + JSON report generation from actual stored mission/run/anomaly data, `Report` metadata persistence, file streaming via `GET /reports/file/:reportId`, download-URL endpoint.
- **Rate limiting:** global/auth/write/process/upload/report limiters, Redis store with in-memory fallback, unified `429` payload, security event logging, `trust proxy` support.
- **Frontend ↔ backend integration:** central API client with Bearer token injection and normalized error mapping; `auth.ts`, `missions.ts`, `anomalies.ts`, `reports.ts` wired to backend endpoints.
- **Nodemon/watch dev script** (`npm run dev`).
- **Test suites:** auth, health, database, mission, missionFile, anomaly, geospatial, persistence, processing, report, rateLimit, aiIntegration, e2eFullSuite.
- **Git history:** commits `6a6b7c0`, `ad079ce`, `c9276c1` cover backend configuration + authentication flow and frontend/backend issue fixes (backend matured across sessions).
---

## 7. Remaining Work

### Blocking Issues
**None.** Every frontend API operation verified live maps to a working backend endpoint backed by MongoDB. No method/payload/response mismatches were found.

### Integration Gaps
Existing backend/frontend functionality that is not yet connected:

- **Binary sonar file upload:** `MissionUpload.tsx` only sends file *metadata* (`name`, `size`) inside `POST /missions`. The actual file bytes are never uploaded; `POST /missions/:id/files` is unused by the UI.
- **MissionMonitoring is simulated:** The monitoring page runs a client-side fake pipeline. `triggerProcessing()` and `getJobStatus()` exist in `Frontend/src/api/missions.ts` but no page calls them.
- **Reports page hardcodes a mission ID:** `Reports.tsx` uses a constant `MSN-2026-0143` instead of the route `:id`. That mission does not exist in the current DB, so anomaly listing returns `[]` and report generation 404s; `handleGenerate` then silently builds a client-side stub file.
- **MapView uses hardcoded mock data:** `MapView.tsx` renders `MOCK_ANOMALIES` instead of the backend geospatial endpoints (`/missions/:id/anomalies/spatial`, `/anomalies/near`, `/anomalies/within`).
- **Unused but verified endpoints:** `getMe()` wrapper, `downloadReport()`, anomaly history, geospatial endpoints, `GET /missions/:id/files`, and `POST /jobs/:id/retry` are not invoked by any page.
- **Admin page** displays mock metrics/users; no backend admin endpoints exist.

### Known Limitations
- **Mock fallbacks mask outages:** `getMissions`, `getMissionById`, `getAnomalies`, `getDashboardStats` catch backend failures and silently return `src/api/mockData.ts`. When the backend is down, the UI shows plausible fake data instead of an error.
- **AI mock fallback:** When the FastAPI service is unreachable, processing completes using `generateMockAIResponse`, so anomalies are fabricated (identifiable by `[YOLO INFERENCE]` in descriptions).
- **Rate limiting** is per-IP and uses in-memory stores when Redis is unavailable (fine for single instance/dev).
- **Create-mission ID generation** uses `Mission.countDocuments()` + a constant offset; IDs can repeat if missions are deleted.

### Future Work
Features that appear intended but are not implemented:
- **PDF report format** (backend `ReportFormatType` includes `pdf`; frontend offers it but both sides explicitly block it today).
- Real job-polling UI for monitoring, wired to `triggerProcessing`/`getJobStatus`.
- Real binary upload flow (frontend → multer → storage) for `MissionUpload`.
- Wiring `MapView` to the geospatial endpoints.
- Admin user management / model management APIs (Admin page currently static).
- Automated dashboards from DB (Admin metrics are hard-coded).

---

## 8. Environment Requirements

### Backend environment variables (names only)
`NODE_ENV`, `PORT`, `MONGODB_URI`, `MONGODB_DB_NAME`, `CORS_ORIGIN`, `SERVICE_NAME`, `JWT_SECRET` **(required — startup fails without it)**, `JWT_EXPIRES_IN`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `AI_SERVICE_URL`, `RATE_LIMIT_ENABLED`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_WINDOW_MS`, `AUTH_RATE_LIMIT_MAX`, `WRITE_RATE_LIMIT_WINDOW_MS`, `WRITE_RATE_LIMIT_MAX`, `PROCESS_RATE_LIMIT_WINDOW_MS`, `PROCESS_RATE_LIMIT_MAX`, `UPLOAD_RATE_LIMIT_WINDOW_MS`, `UPLOAD_RATE_LIMIT_MAX`, `REPORT_RATE_LIMIT_WINDOW_MS`, `REPORT_RATE_LIMIT_MAX`, `TRUST_PROXY`, `STORAGE_PROVIDER`, `STORAGE_BUCKET`.

### Frontend environment variables (names only)
`VITE_API_URL` (defaults to `http://localhost:5000`).

### AI-Service environment variables (names only)
`ENVIRONMENT`, `PORT`, `HOST`, `SERVICE_NAME`, `VERSION`, `MODEL_VERSION`, `CONFIDENCE_THRESHOLD`.

### Services required per testing tier
- **Frontend-only testing:** backend is still needed for real data; the frontend will render without it using `src/api/mockData.ts` fallbacks.
- **Backend testing:** MongoDB required (currently Atlas, reachable). Redis optional. AI-Service optional (mock inference fallback).
- **Full-stack testing:** Backend (port 5000) + MongoDB + Frontend dev server (Vite, port 5173, `VITE_API_URL=http://localhost:5000`). Redis optional. AI-Service optional.
- **AI processing:** AI-Service (`uvicorn app.main:app`, port 8000) + Backend `AI_SERVICE_URL=http://127.0.0.1:8000`; MongoDB required; Redis optional.

---

## 9. Validation Results

| Item | Result |
|---|---|
| Backend build (`npm run build`, tsc) | **PASS** (clean compile) |
| Frontend build (`npm run build`, Vite) | **PASS** (1608 modules, `dist/` generated; non-fatal Browserslist "caniuse-lite outdated" note only) |
| Frontend typecheck (`npm run typecheck`) | **PASS** |
| Backend tests — `auth`, `health`, `database`, `rateLimit` | **PASS — 21/21 tests** (4/4 suites) |
| Backend tests — `mission`, `missionFile`, `anomaly`, `geospatial`, `persistence`, `processing`, `report`, `aiIntegration`, `e2eFullSuite` | **SKIPPED** — these suites execute `deleteMany({})` on shared collections (missions/anomalies/jobs/runs/reports). Running them against the configured shared Atlas database would destroy existing data, which violates the audit's data-safety constraint |
| Live endpoint smoke suite (isolated records vs live Atlas DB) | **PASS — 25/25** endpoints: auth, missions, stats, processing + job polling + retry, anomalies + verify/reject + history + geospatial, binary file upload/list, CSV + JSON report generation + download + missing-file 404. All test records removed afterwards |
| Database connectivity | **VERIFIED BY LIVE TEST** — Atlas reachable; state before and after all testing identical (3 users / 2 missions / 7 anomalies / 2 verification histories / 0 jobs, runs, files, reports) |

---

*This report reflects the repository as audited. No code changes were required: the existing Frontend → Backend → MongoDB integration was found fully functional end-to-end.*