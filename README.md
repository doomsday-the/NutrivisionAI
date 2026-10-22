# NutriVision AI 🥗📸

Welcome to the central repository for **NutriVision AI**, an AI-powered Calorie Tracker and Nutrition Engine designed for Indian and global cuisines. The platform combines Computer Vision food detection, relative depth estimation, a 3NF relational PostgreSQL database, an Express API with atomic stored procedures, and a modern React web dashboard.

---

## Project Structure & Technology Stack

- **Database**: PostgreSQL 15/16 (via Docker) with 16 normalized tables in 3NF, 3 triggers, 2 SQL views, and atomic stored procedure `sp_log_meal`.
- **Backend API**: Node.js 22, Express, TypeScript, Prisma ORM, Zod validation, JWT authentication (`backend-api/`, port 3000).
- **Multimodal AI Vision & Coach**: Google Gemini Multimodal Vision & Reasoning (`gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.8-flash`) with dynamic model resilience cascade.
- **Computer Vision Microservice**: Python 3.11, FastAPI, Roboflow IndianFoodNet API + MiDaS DPT_Hybrid relative depth estimation (`ai-service/`, port 8000).
- **Frontend Web**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Recharts, Lucide Icons (`frontend-web/`, port 5173).
- **Mobile & WearOS**: React Native and Wear OS companion modules (`mobile-app/`, `wear-os/` - planned clients).

---

## Prerequisites

- Node.js (v20+)
- Python (v3.11+)
- Docker & Docker Compose
- Git

---

## Installation & Execution

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

### 3. Database Migrations & Seeding
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
- **Physiological TDEE Calculator & Physical Activity Sync**: Calculate BMR and caloric equilibrium targets via the scientific Mifflin-St Jeor formula, synchronized with exercise calories burned.
- **Dual-Source Database**: Search and auto-match against a curated repository combining ICMR IFCT 2017 (Indian Food Composition Tables) and USDA FoodData Central.

---

## Documentation Directory (Single Source of Truth)

All architectural decisions, schemas, contracts, and governance maps are maintained under `docs/`:

1. **[00_Governance](./docs/00_Governance/)**: Project Charter, Traceability Matrix, and University Assessment Compliance Map.
2. **[01_Requirements](./docs/01_Requirements/)**: Functional and Non-Functional Requirements.
3. **[02_Architecture](./docs/02_Architecture/)**: ADRs (including ADR-009 for the CV Pipeline).
4. **[03_Data](./docs/03_Data/)**: Canonical 3NF Data Model and ETL Specifications.
5. **[04_Contracts](./docs/04_Contracts/)**: AI Service and Backend API endpoint contracts.
6. **[05_Operations](./docs/05_Operations/)**: Database Backup & Recovery procedures (`pg_dump`/`pg_restore`).
7. **[Implementation Plan](./docs/implementation_plan.md)**: Roadmap and phase completion tracking.
