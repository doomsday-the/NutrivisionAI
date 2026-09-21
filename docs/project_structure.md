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
├── ai-service/                # Python + FastAPI (Computer Vision)
│   ├── dataset/               # Training images (gitignored)
│   ├── models/                # Saved YOLO/MobileNet weights (.pt files)
│   ├── src/
│   │   ├── predict.py         # Inference script
│   │   ├── train.py           # Model training script
│   │   └── app.py             # FastAPI server for predictions
│   └── requirements.txt
│
├── mobile-app/                # React Native (Android)
│   ├── src/
│   │   ├── screens/           # Camera, Home, Profile
│   │   ├── components/
│   │   └── navigation/        # React Navigation setup
│   └── package.json
│
├── wear-os/                   # Google Fit & WearOS integrations
│   └── src/                   # Watch faces and syncing logic
│
├── .gitignore                 # Ignore node_modules, .env, datasets
└── README.md                  # Main entry point linking everything
```

## Architectural Flow
1. **Client** (React / Android) uploads a meal image to the **Backend API**.
2. **Backend API** proxies the image to the **AI Service**.
3. **AI Service** runs YOLO to detect foods, returns bounding boxes and labels.
4. **Backend API** looks up caloric density in **PostgreSQL** and saves the meal log.
5. **Backend API** returns macro-nutrients and AI feedback to the **Client** for display.
