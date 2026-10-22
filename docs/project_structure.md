# Project Structure & Architecture 📂

The codebase is organized as a monorepo containing the web frontend, mobile applications, node backend, and the python AI service.

```text
NutriVision/
│
├── .github/                   # CI/CD pipelines (GitHub Actions)
│   └── workflows/
│
├── docs/                          # Single Source of Truth Documentation
│   ├── 00_Governance/             # Project Charter, Traceability Matrix
│   ├── 01_Requirements/           # Functional and Non-Functional Requirements
│   ├── 02_Architecture/           # ADRs, System Overview
│   ├── 03_Data/                   # Canonical Schema, ETL Specification
│   ├── 04_Contracts/              # API and AI Service Contracts
│   ├── 11_Failure_Philosophy.md   # Failure handling policy
│   └── short_term_roadmap.md      # Current milestone roadmap
│
├── frontend-web/              # React 19 + Vite 8 Web Application
│   ├── public/
│   ├── src/
│   │   ├── components/        # Layout, NutriCoachWidget
│   │   │   └── ui/            # Reusable UI Primitives (Card, Button, Badge, ProgressRing, Skeleton)
│   │   ├── pages/             # Dashboard, LogMeal, MealHistory, Activity, NutritionCoach, Profile, Login
│   │   ├── context/           # AuthContext (JWT & dev bypass)
│   │   ├── services/          # API wrappers
│   │   └── utils/
│   ├── package.json
│   └── vite.config.ts
│
├── backend-api/               # Node.js 22 + Express (PERN Stack)
│   ├── prisma/                # ORM schema, migrations, and SQL seeds
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/       # Route logic (auth, meals, coach, activity, profile, foods)
│   │   ├── middlewares/       # JWT auth, Zod validation
│   │   ├── routes/            # Express routers (auth, meal, coach, activity, profile, food)
│   │   └── server.ts          # TypeScript entry point
│   ├── .env.example
│   └── package.json
│
├── ai-service/                # Python 3.11 + FastAPI (Computer Vision Microservice)
│   ├── etl/                   # USDA and IFCT data extraction scripts
│   ├── src/
│   │   ├── app.py             # FastAPI prediction server (Roboflow IndianFoodNet)
│   │   └── depth.py           # MiDaS relative depth estimation & portion heuristics
│   ├── Dockerfile
│   └── requirements.txt
│
├── mobile-app/                # React Native (Android) [Planned client]
│
├── wear-os/                   # Google Fit & WearOS integrations [Planned client]
│
├── docker-compose.yml         # Multi-container orchestration (Postgres, API, AI)
├── .gitignore                 # Exclude node_modules, .env, .agents, datasets
└── README.md                  # Main project guide and quickstart
```

## Architectural Flow
1. **Client** (`frontend-web` React / Vite) uploads meal photo to **Backend API** (`POST /api/meals/analyze`).
2. **Primary Detection**: Backend API invokes the Google Gemini Multimodal Vision cascade (`gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.8-flash`) to detect any global or Indian food item, estimate realistic portion weights, compute nutritional density per 100g, and auto-match or insert canonical items.
3. **Fallback Detection**: If Gemini Vision is unavailable, the backend forwards the image with header `X-Internal-Token` to **AI Service** (`POST /predict`), querying Roboflow IndianFoodNet for food classification and MiDaS for relative depth estimation.
4. **Database Transaction**: Backend API executes atomic database stored procedure `sp_log_meal` in **PostgreSQL**, inserting meal items, computing total calories and macros from `food_nutrients`, recording audit trails in `ai_match_log`, and updating `daily_logs`.
5. **Real-Time Client Update**: The created meal, computed macros, and items are returned to the client and immediately reflected in the **Daily Metabolic Ledger**, the SVG calorie dial, Recharts trajectories, and the **AI Nutrition Coach** daily briefing.
