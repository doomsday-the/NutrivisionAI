# NutriVision AI 🥗📸

Welcome to the central repository for **NutriVision AI**, an AI-powered Calorie Tracker and Nutrition Engine designed for Indian and global cuisines. The platform combines Computer Vision food detection, relative depth estimation, a 3NF relational PostgreSQL database, an Express API with atomic stored procedures, an on-demand Android companion app for Samsung Health synchronization, and a modern React web dashboard.

---

## Live Deployments

- **Production Web Dashboard**: [https://nutrivision-ai-mu.vercel.app](https://nutrivision-ai-mu.vercel.app)
- **Production Backend API**: [https://nutrivision-backend-i9x2.onrender.com](https://nutrivision-backend-i9x2.onrender.com)
- **Android Companion APK (Direct Download)**: [NutriVisionSync.apk (Latest)](https://github.com/doomsday-the/NutrivisionAI/releases/download/companion-latest/NutriVisionSync.apk)

---

## Project Structure & Technology Stack

- **Database**: PostgreSQL 15/16 (via Docker & Neon Cloud) with 16 normalized tables in 3NF, 3 triggers, 2 SQL views, and atomic stored procedure `sp_log_meal`.
- **Backend API**: Node.js 22, Express, TypeScript, Prisma ORM, Zod validation, JWT authentication (`backend-api/`, port 3000).
- **Multimodal AI Vision & Coach**: Google Gemini Multimodal Vision & Reasoning (`gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.8-flash`) with dynamic model resilience cascade.
- **Computer Vision Microservice**: Python 3.11, FastAPI, Roboflow IndianFoodNet API + MiDaS DPT_Hybrid relative depth estimation (`ai-service/`, port 8000).
- **Frontend Web Dashboard**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Recharts, Lucide Icons (`frontend-web/`, port 5173).
- **Android Companion App**: Native Kotlin + Jetpack Compose companion (`mobile-app/`) leveraging official Google Health Connect API (`compileSdk = 35`), zero-background battery usage, and 1-tap Samsung Health steps/calories synchronization.
- **CI/CD Pipeline**: GitHub Actions for automated testing and automated Android APK compilation & release publishing (`.github/workflows/build-apk.yml`).

---

## Prerequisites

- Node.js (v20+)
- Python (v3.11+)
- Docker & Docker Compose
- Git

---

## Installation & Local Execution

### 1. Environment Setup
```bash
# Clone the repository
git clone https://github.com/doomsday-the/NutrivisionAI.git
cd NutrivisionAI

# Copy backend environment config
cp backend-api/.env.example backend-api/.env
```

### 2. Start the Stack (PostgreSQL + API + AI Service)
```bash
docker-compose up -d --build
```
*Containers running: `nutrivision-db` (port 5433:5432), `nutrivision-backend` (port 3000), `nutrivision-ai` (port 8000).*

### 3. Database Migrations & Seeding.
```bash
cd backend-api
npm install
npx prisma generate
npx prisma db push
npx prisma db execute --file prisma/setup_views_triggers.sql
npx prisma db execute --file prisma/setup_stored_procedure.sql
npm run seed
```

### 4. Start the Frontend Web Dashboard
```bash
cd ../frontend-web
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser. Click **"Instant Demo Login (Bypass)"** for immediate authenticated access without requiring Google OAuth popups.

### 5. Verify Services
- **Backend Health**: `curl http://localhost:3000/health` → `{"status":"ok"}`
- **AI Service Health**: `curl http://localhost:8000/health` → `{"status":"ok","midas_loaded":false}`
- **Frontend Web**: `http://localhost:5173`

---

## Android Companion App (Samsung Health Sync) 📱

The Android companion module (`mobile-app/`) solves the problem of getting real-time step and exercise data from **Samsung Health** into your web dashboard without battery-draining background daemons:

### Key Features:
- **Zero Background Battery Drain**: Runs strictly on-demand. Never runs background polling daemons or periodic timers.
- **Official Health Connect API**: Uses Google Jetpack's `HealthConnectClient.aggregate(StepsRecord.COUNT_TOTAL)` for verified, deduplicated step counts.
- **Account Pairing**: Seamlessly links to the user's Google Account (`/api/auth/companion-login`) so the companion app and web dashboard update the exact same database records.
- **One-Tap Push to Web**: Open the app, view live steps and active calories, and tap **"PUSH TO NUTRIVISION WEB"**.
- **Automated Cloud Builds**: Every push compiles a fresh release APK via GitHub Actions.

👉 **[Download NutriVisionSync.apk](https://github.com/doomsday-the/NutrivisionAI/releases/download/companion-latest/NutriVisionSync.apk)**

---

## Core Features & Architecture

- **Multimodal Plate Food Detection**: Upload a meal photo to detect Indian and global dishes. Leverages a high-resilience Google Gemini vision cascade (`gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.8-flash`) with automatic fallback to Roboflow IndianFoodNet and MiDaS relative depth estimation.
- **AI Nutrition Coach & Plate Insights**: Real-time contextual coaching powered by Gemini (`/api/coach/explain` and `/api/coach/daily-insight`). Analyzes your full daily meal log against caloric goals, detects macro imbalances, and suggests healthy culinary swaps.
- **Redesigned Clinical-Grade Frontend**: Complete UI redesign featuring:
  - **Strong Visual Hierarchy**: Editorial page headings and dark luxury aesthetics with emerald ambient glows.
  - **Persistent Daily Metabolic Ledger**: Compact control bar with quick date navigation, remaining calories, steps, coach status, and instant meal logging.
  - **Sidebar + Main Composition**: Left-hand filter pills, SVG circular energy intake gauge, and macronutrient target bars paired with interactive 7-day intake trajectory charts and macro distribution donut visualizations.
  - **Information-Dense Meal Rows**: Detailed cards with component pills, portion weights, macro summaries, and inline actions.
  - **Reusable Design System**: Modular UI primitives in `frontend-web/src/components/ui/` (`Card`, `Button`, `Badge`, `ProgressRing`, `Skeleton`).
- **Atomic Stored Procedure Logging**: PostgreSQL `sp_log_meal` atomically writes the meal, computes precise nutritional totals from `food_nutrients`, records AI audit trails in `ai_match_log`, and updates `daily_logs` in a single transaction.
- **Physiological TDEE Calculator & Dynamic Physical Activity Sync**: Calculate BMR and caloric equilibrium targets via the scientific Mifflin-St Jeor formula, dynamically expanded in real time when steps and active calories are synced from the Android companion.
- **Dual-Source Database**: Search and auto-match against a curated repository combining ICMR IFCT 2017 (Indian Food Composition Tables) and USDA FoodData Central.

---

## Documentation Directory (Single Source of Truth)

All architectural decisions, schemas, contracts, and governance maps are maintained under `docs/`:

1. **[00_Governance](./docs/00_Governance/)**: Project Charter, Traceability Matrix, and University Assessment Compliance Map.
2. **[01_Requirements](./docs/01_Requirements/)**: Functional and Non-Functional Requirements (FR-001 through FR-011, NFR-001 through NFR-011).
3. **[02_Architecture](./docs/02_Architecture/)**: Architectural Decision Records (ADR-001 through ADR-013).
4. **[03_Data](./docs/03_Data/)**: Canonical 3NF Data Model with Mermaid ER Diagram and ETL Specifications.
5. **[04_Contracts](./docs/04_Contracts/)**: AI Service (TC-001, TC-002) and Backend API (API-001 through API-017) contracts.
6. **[05_Operations](./docs/05_Operations/)**: Database Backup & Recovery procedures (`pg_dump`/`pg_restore`).
7. **[Implementation Plan](./docs/implementation_plan.md)**: Roadmap, milestone completion tracking, and Gantt timeline.
8. **[Cloud Deployment Guide](./docs/deployment/STAGING_DEPLOYMENT_GUIDE.md)**: Cloud staging and production deployment instructions (Vercel, Render, Neon).
9. **[Project Structure & Flow](./docs/project_structure.md)**: Monorepo layout, system diagrams, and architectural flow.
10. **[Failure Philosophy](./docs/11_Failure_Philosophy.md)**: System degradation, error handling, and fault tolerance policies.
11. **[Strategic Roadmap](./docs/short_term_roadmap.md)**: Completed milestones and future enhancement backlog.
