# Project Structure & Architecture 📂

The codebase is organized as a monorepo containing the web frontend, native Android companion application, Express backend API, and Python computer vision microservice.

```text
NutriVisionAI/
│
├── .github/                       # CI/CD Workflows (GitHub Actions)
│   └── workflows/
│       ├── ci.yml                 # Automated PostgreSQL 15 & Express backend testing pipeline
│       └── build-apk.yml          # Automated Android APK compilation (Gradle 8.7 + JDK 17) & Release publishing
│
├── docs/                          # Single Source of Truth Documentation
│   ├── 00_Governance/             # Project Charter, Traceability Matrix, University Compliance Map
│   ├── 01_Requirements/           # Functional and Non-Functional Requirements
│   ├── 02_Architecture/           # ADRs (including ADR-009, ADR-010, ADR-011, ADR-012, ADR-013)
│   ├── 03_Data/                   # Canonical 3NF Data Model, Entity-Relationship Diagram, ETL Specs
│   ├── 04_Contracts/              # AI Service and Backend API Endpoint Contracts
│   ├── 05_Operations/             # Database Backup & Recovery Procedures (pg_dump/pg_restore)
│   ├── 11_Failure_Philosophy.md   # System-wide error handling and degradation policy
│   ├── deployment/                # Staging & Production Cloud Deployment Guide (Render, Vercel, Neon)
│   ├── implementation_plan.md     # Multi-phase milestone progress and Gantt timeline
│   └── short_term_roadmap.md      # Strategic development roadmap
│
├── frontend-web/                  # React 19 + Vite 8 + Tailwind CSS v4 Web Application (Port 5173)
│   ├── public/                    # Favicons and static assets
│   ├── src/
│   │   ├── assets/                # Hero imagery and SVG logos
│   │   ├── components/            # Layout (navigation, APK download pill), NutriCoachWidget, ProtectedRoute
│   │   │   └── ui/                # Modular UI Design System (Card, Button, Badge, ProgressRing, Skeleton)
│   │   ├── context/               # AuthContext (Google OAuth & Developer login bypass)
│   │   ├── pages/                 # Dashboard, LogMeal, MealHistory, Activity, NutritionCoach, Profile, Login
│   │   ├── config.ts              # API_BASE_URL resolution
│   │   ├── App.tsx                # Client-side routing and GoogleOAuthProvider
│   │   └── main.tsx               # DOM root mount
│   ├── package.json
│   ├── vercel.json                # SPA client-side routing rewrites
│   └── vite.config.ts
│
├── backend-api/                   # Node.js 22 + Express + TypeScript API (Port 3000)
│   ├── prisma/
│   │   ├── schema.prisma          # 16 normalized relational tables, relations, and SQL view previews
│   │   ├── setup_views_triggers.sql # Triggers (search vector, daily totals, timestamps) and views
│   │   ├── setup_stored_procedure.sql # Stored procedure sp_log_meal with inline macro fallback
│   │   ├── recalculate_daily_logs.sql # Daily balance maintenance scripts
│   │   └── seed.ts                # Canonical database seed script (ICMR IFCT staples + USDA foods)
│   ├── src/
│   │   ├── controllers/           # Route logic (auth, meals, coach, activity, profile, foods)
│   │   ├── middlewares/           # JWT verification, Zod request body/query validation
│   │   ├── routes/                # Express routers (auth, meal, coach, activity, profile, food)
│   │   ├── schemas/               # Zod validation schemas
│   │   ├── bootstrap.ts           # Automatic database connection, sequence auto-sync, and food seeding
│   │   ├── seedCommonFoods.ts     # Curated 50+ common fast foods, Indian specialties, produce, and drinks
│   │   └── server.ts              # Express application setup, global rate limit, and error handling
│   ├── tests/                     # Integration test suites (auth, meals, transactions)
│   ├── Dockerfile
│   └── package.json
│
├── ai-service/                    # Python 3.11 + FastAPI Computer Vision Microservice (Port 8000)
│   ├── etl/                       # USDA and IFCT data extraction and ingestion scripts
│   │   ├── load_ifct.py           # Parser for ICMR-NIN IFCT 2017 dataset
│   │   └── load_usda.py           # Parser for USDA FoodData Central CSVs
│   ├── src/
│   │   ├── app.py                 # FastAPI prediction server (Roboflow IndianFoodNet API integration)
│   │   └── depth.py               # MiDaS DPT_Hybrid relative depth estimation & culinary base weights
│   ├── Dockerfile
│   └── requirements.txt
│
├── mobile-app/                    # Native Android Companion App (Kotlin + Jetpack Compose)
│   ├── app/
│   │   ├── src/main/java/com/nutrivision/companion/
│   │   │   ├── MainActivity.kt    # Compose UI, account pairing dialog, live metrics cards, push action
│   │   │   ├── HealthConnectManager.kt # Official Google Health Connect API (StepsRecord aggregation)
│   │   │   ├── SyncService.kt     # OkHttp client for /api/auth/companion-login and /api/activity/sync
│   │   │   └── theme/Color.kt     # Emerald and Slate design system palette
│   │   ├── src/main/AndroidManifest.xml # Health Connect read permissions and deep link intent filter
│   │   └── build.gradle.kts       # Android configuration (compileSdk 35, Health Connect 1.1.0-alpha11)
│   ├── gradle/wrapper/            # Gradle 8.7 wrapper distribution
│   ├── build.gradle.kts           # Root Gradle build configuration
│   └── README.md                  # Companion setup guide, Samsung Health permissions, and direct APK download
│
├── docker-compose.yml             # Local multi-container orchestration (nutrivision-db, backend, ai-service)
├── docker-compose.prod.yml        # Production Docker orchestration
├── render.yaml                    # Render Web Service blueprint for automated backend deployment
├── vercel.json                    # Root Vercel configuration
├── .gitignore                     # Repository exclusion rules
└── README.md                      # Primary project documentation and quickstart guide
```

---

## Architectural Flow

```
                                  [ User Meal Photo ]
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           Client Layer (Web & Android Companion)                        │
├─────────────────────────────────────────────────┬───────────────────────────────────────┤
│  React 19 Web Dashboard (Vite 8, Tailwind v4)   │  Native Kotlin Android Companion      │
│  - Persistent Daily Metabolic Ledger            │  - Official Google Health Connect API │
│  - SVG Circular Calorie Dial & Macro Gauges     │  - Samsung Health Step Aggregation    │
│  - Recharts 7-Day Caloric Intake Trajectories   │  - Zero Background Battery Drain      │
│  - Interactive AI Nutrition Coach Widget        │  - 1-Tap Direct Push to Web Platform  │
└───────────────────────┬─────────────────────────┴───────────────────┬───────────────────┘
                        │ POST /api/meals/analyze                     │ POST /api/activity/sync
                        ▼                                             ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               Backend API (Node.js 22, Express)                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  1. Multimodal AI Vision & Reasoning Cascade                                            │
│     - Primary: Google Gemini (`gemini-flash-lite-latest`, `3.1-flash-lite`, `3.5-flash`)│
│     - Secondary Fallback: FastAPI microservice (`POST /predict` via internal token)     │
│       ├─ Roboflow IndianFoodNet Hosted Classification                                   │
│       └─ MiDaS DPT_Hybrid Relative Depth Estimation & Portion Weight Scaling            │
│  2. Dynamic Database Food Matching & Safe Ingestion (`matchFoodInDb`)                   │
│     - Exact match -> Prefix match -> Containment -> tsvector full-text search           │
│     - Auto-registers missing foods with sequence auto-sync (zero false "rice guessing") │
│  3. Conversational AI Nutrition Coach (`/api/coach/explain`, `/api/coach/daily-insight`) │
│     - Biometric goal analysis, macro critique, and Indian dietary food swaps            │
└────────────────────────────────────────┬────────────────────────────────────────────────┘
                                         │ Atomic Stored Procedure Execution
                                         │ CALL sp_log_meal(...)
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              PostgreSQL Database (3NF Relational)                       │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  - 16 Normalized Tables: users, user_profiles, meals, meal_items, food_items,           │
│    food_nutrients, nutrient_types, daily_logs, ai_match_log, food_sources, etc.         │
│  - 3 Triggers: trg_update_search_vector, trg_update_daily_log, trg_set_updated_at      │
│  - 2 SQL Views: vw_user_daily_summary, vw_food_full                                     │
│  - Stored Procedure: sp_log_meal (atomically logs meal, calculates scaled nutrients,   │
│    records detection audit trails, and updates daily logs in a single transaction)      │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```
