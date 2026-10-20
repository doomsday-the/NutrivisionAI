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
├── frontend-web/              # React.js Web Application
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable UI (Buttons, Navbars)
│   │   ├── pages/             # Dashboard, Login, History
│   │   ├── services/          # API call wrappers
│   │   └── utils/
│   ├── package.json
│   └── tailwind.config.js
│
├── backend-api/               # Node.js + Express (PERN Stack)
│   ├── prisma/                # ORM schema and migrations
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/       # Route logic (auth, meals)
│   │   ├── middlewares/       # JWT auth, role-based checks
│   │   ├── routes/            # Express routers
│   │   └── server.js          # Entry point
│   ├── .env.example           # Exclude actual .env in .gitignore
│   └── package.json
│
├── ai-service/                # Python + FastAPI (Computer Vision Microservice)
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
├── docker-compose.yml         # Multi-container orchestration (DB, API, AI)
├── .gitignore                 # Ignore node_modules, .env, datasets
└── README.md                  # Main entry point linking everything
```

## Architectural Flow
1. **Client** (`frontend-web` React / Vite) uploads meal photo to **Backend API** (`POST /api/meals/analyze`).
2. **Backend API** forwards image with authentication header `X-Internal-Token` to **AI Service** (`POST /predict`).
3. **AI Service** queries Roboflow IndianFoodNet for food detection, estimates portion weights via MiDaS depth heuristics, and maps detected dish labels to PostgreSQL `food_id`s.
4. **Backend API** executes atomic database stored procedure `sp_log_meal` in **PostgreSQL**, inserting meal items, calculating nutritional values from `food_nutrients`, recording audit trails in `ai_match_log`, and updating `daily_logs`.
5. **Backend API** returns the created meal, computed macros, and items back to the **Client** for interactive review and portion adjustment.
