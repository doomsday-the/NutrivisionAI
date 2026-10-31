# NutriVision AI — Backend API Engine 🥗⚡

The backend service for **NutriVision AI**, built with **Node.js 22**, **Express**, **TypeScript**, **Prisma ORM**, and **PostgreSQL 15/16**. It powers the core nutritional intelligence, multimodal vision cascade, atomic database stored procedures, Google OAuth / Companion pairing, and real-time physical activity synchronization.

---

## Live Production Deployment

- **Production API URL:** [https://nutrivision-backend-i9x2.onrender.com](https://nutrivision-backend-i9x2.onrender.com)
- **Health Check Endpoint:** [https://nutrivision-backend-i9x2.onrender.com/health](https://nutrivision-backend-i9x2.onrender.com/health)
- **Production Web Dashboard:** [https://nutrivision-ai-mu.vercel.app](https://nutrivision-ai-mu.vercel.app)

---

## Core Capabilities & Architecture

### 1. 3NF Relational PostgreSQL Database
- **16 Normalized Tables**: `users`, `user_profiles`, `food_sources`, `food_categories`, `food_items`, `nutrient_types`, `food_nutrients`, `serving_sizes`, `food_aliases`, `tags`, `food_tags`, `meals`, `meal_items`, `daily_logs`, `ai_match_log`, and ETL staging tables.
- **Atomic Stored Procedure (`sp_log_meal`)**: Encapsulates entire meal creation, component insertion, AI match audit logging, nutrient scaling from `vw_food_full`, and daily balance calculation in a single ACID transaction.
- **Database Triggers**:
  - `trg_update_search_vector`: Automatically generates PostgreSQL full-text `tsvector` from English and local food names.
  - `trg_update_daily_log` / `trg_update_daily_log_meals`: Automatically aggregates daily totals upon meal item updates.
  - `trg_set_updated_at`: Maintains `updated_at` timestamps on `food_items` and `user_profiles`.
- **SQL Views**:
  - `public.vw_user_daily_summary`: Fast single-query user daily intake retrieval.
  - `public.vw_food_full`: Denormalized pivot view mapping food items to core macronutrients (Energy, Protein, Carbs, Fat, Fiber).

### 2. Multimodal AI Vision & Reasoning Cascade
- Prioritizes high-availability Google Gemini models (`gemini-flash-lite-latest`, `gemini-3.1-flash-lite`, `gemini-flash-latest`, `gemini-3.5-flash`) to eliminate 503 high-demand spike bottlenecks.
- Detects multi-item plates, portion weights, and per-100g nutritional density.
- Secondary fallback to Python microservice (`POST {AI_SERVICE_URL}/predict`) running Roboflow IndianFoodNet and MiDaS relative depth estimation.
- **Zero False Rice Guessing**: Preserves authentic detected dish labels and dynamically registers unseen dishes with safe sequence discovery (`ADR-013`).

### 3. AI Nutrition Coach (`coachController.ts`)
- `POST /api/coach/explain` and `GET /api/coach/daily-insight` pulling user biometrics (BMR/TDEE targets, dietary goals) and daily meal records directly from PostgreSQL.
- Returns structured JSON containing status badges, executive summaries, healthy Indian food swaps, macro balance critiques, and next-meal advice.

### 4. Samsung Health Companion Sync & Account Pairing
- Integrates with the native Android Companion App (`com.nutrivision.companion`) via `POST /api/auth/companion-login` (30-day JWT) and `POST /api/activity/sync` (idempotent daily log upsert).
- Dynamically expands the user's remaining daily calorie target when physical activity telemetry is received.

---

## API Endpoint Catalog

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | Public | System health status and timestamp |
| `POST` | `/api/auth/google` | Public | Authenticate via Google OAuth `id_token` |
| `POST` | `/api/auth/dev-login` | Public (Dev/Staging) | Instant 1-click evaluation bypass login |
| `POST` | `/api/auth/companion-login` | Public | Pair native Android companion by email (issues 30-day JWT) |
| `GET` | `/api/dashboard` | JWT | Daily dashboard summary (alias for `/api/activity/dashboard`) |
| `GET` | `/api/profile` | JWT | Retrieve user health & TDEE profile |
| `PUT` | `/api/profile` | JWT | Upsert biometric profile and recalculate Mifflin-St Jeor TDEE |
| `POST` | `/api/meals/analyze` | JWT | Upload plate photo for multimodal AI vision analysis and atomic logging |
| `POST` | `/api/meals` | JWT | Create manual empty meal |
| `POST` | `/api/meals/:mealId/items` | JWT | Manually add food item to meal |
| `PUT` | `/api/meals/:mealId/items/:itemId` | JWT | User correction of food item quantity or food match |
| `DELETE` | `/api/meals/:mealId` | JWT | Delete meal with daily balance rebalancing |
| `GET` | `/api/meals/history` | JWT | Paginated past meal history with component breakdown |
| `GET` | `/api/foods/search` | JWT | Full-text autocomplete search across ICMR & USDA food database |
| `POST` | `/api/activity/sync` | JWT | Sync steps and active calories (idempotent upsert) |
| `GET` | `/api/activity/weekly` | JWT | 7-day intake trajectory vs. target calories for Recharts |
| `POST` | `/api/coach/explain` | JWT | Conversational nutritional evaluation & plate advice |
| `GET` | `/api/coach/daily-insight` | JWT | Automatic daily coaching briefing from database context |

---

## Environment Variables

Create `.env` in `backend-api/`:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5433/nutrivision?schema=public
JWT_SECRET=super_secret_jwt_key_for_nutrivision_development
GOOGLE_CLIENT_ID=558532335340-jsbgfpii5qojdbdk8oa23tlukjhljrca.apps.googleusercontent.com
GEMINI_API_KEY=your_gemini_api_key_from_google_ai_studio
GEMINI_MODEL=gemini-flash-lite-latest
AI_SERVICE_URL=http://localhost:8000
X_INTERNAL_TOKEN=shared_secret_between_node_and_python
NODE_ENV=development
DEV_LOGIN_ENABLED=true
DEV_USER_PASSWORD=devpassword
TZ=Asia/Kolkata
```

---

## Local Setup & Execution

### 1. Install Dependencies
```bash
cd backend-api
npm install
```

### 2. Generate Prisma Client & Push Schema
```bash
npx prisma generate
npx prisma db push
```

### 3. Execute Views, Triggers & Stored Procedures
```bash
npx prisma db execute --file prisma/setup_views_triggers.sql
npx prisma db execute --file prisma/setup_stored_procedure.sql
```

### 4. Seed Canonical Nutrition Data
```bash
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```
The server will boot on `http://localhost:3000` and automatically verify database connectivity, execute sequence synchronization (`syncDatabaseSequences`), and seed common foods if missing.

### 6. Run Integration Test Suite
```bash
npm test
```
Runs Jest test suites with an in-memory / service-isolated test database.
