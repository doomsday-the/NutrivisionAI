# NutriVision AI 🥗📸

Welcome to the central repository for **NutriVision AI**, an AI-powered Calorie Tracker and Nutrition Engine designed for Indian and global cuisines. The platform combines Computer Vision food detection, relative depth estimation, a 3NF relational PostgreSQL database, an Express API with atomic stored procedures, and a modern React web dashboard.

---

## Project Structure & Technology Stack

- **Database**: PostgreSQL 16 (via Docker) with 16 normalized tables, 3 triggers, 2 SQL views, and stored procedure `sp_log_meal`.
- **Backend API**: Node.js, Express, TypeScript, Prisma ORM, Zod, JWT (`backend-api/`, port 3000).
- **AI Microservice**: Python 3.11, FastAPI, Roboflow IndianFoodNet API + MiDaS DPT_Hybrid relative depth (`ai-service/`, port 8000).
- **Frontend Web**: React 18, TypeScript, Vite, Tailwind CSS v4, Recharts, Lucide Icons (`frontend-web/`, port 5173).
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
Open **`http://localhost:5173`** in your browser. Click **"Instant Demo Login (Bypass)"** for immediate authenticated access.

### 5. Verify Services
- **Backend Health**: `curl http://localhost:3000/health` → `{"status":"ok"}`
- **AI Service Health**: `curl http://localhost:8000/health` → `{"status":"ok","midas_loaded":false}`
- **Frontend Web**: `http://localhost:5173`

---

## Core Features

- **Plate Food Detection**: Upload a meal photo to detect Indian foods (Dosa, Idli, Dal, Rice, Paneer, Biryani, Roti, etc.) via Roboflow IndianFoodNet.
- **Portion & Depth Estimation**: Scale portion weights using MiDaS relative depth estimation and calibrated culinary base weights.
- **Atomic Stored Procedure Logging**: Uses PostgreSQL `sp_log_meal` to atomically create the meal, compute calories from `food_nutrients`, log to `ai_match_log`, and aggregate `daily_logs`.
- **Dynamic Calorie Gauge & Analytics**: Interactive SVG circular calorie ring, macro distribution donut chart, and 7-day intake trends via Recharts.
- **Physiological TDEE Calculator**: Calculate Basal Metabolic Rate and daily caloric targets based on the scientific Mifflin-St Jeor formula.
- **Manual Logging Fallback**: Search the verified dual-source food database (ICMR IFCT 2017 + USDA) and adjust detected portions.

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
