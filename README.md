# NutriVision AI 🥗📸

Welcome to the central repository for **NutriVision AI**, an AI-powered Calorie Tracker and Nutrition Coach. This project integrates Computer Vision (for food detection), a Relational Database (for tracking), a web dashboard, a mobile app, and Wear OS integration.

## Project Structure & Technology Stack
- **Database**: PostgreSQL (via Docker)
- **Backend API**: Node.js, Express, Prisma, Zod, JWT
- **AI Service**: Python, FastAPI, Pydantic (Mocked inference via ADR-005)
- **Frontend / WearOS**: (Coming soon)

## Prerequisites
- Node.js (v20+)
- Python (v3.11+)
- Docker & Docker Compose
- Git

## Installation & Execution

### 1. Environment Setup
```bash
# Clone the repository
git clone https://github.com/your-username/NutriVision.git
cd NutriVision

# Backend API env
cp backend-api/.env.example backend-api/.env
# Edit backend-api/.env to include your GOOGLE_CLIENT_ID
```

### 2. Start the Stack (Postgres + API + AI Service)
```bash
docker-compose up -d --build
```
*Note: The backend API runs on port 3000, AI service on port 8000.*

### 3. Database Setup (Migrations & Seeding)
Run this locally (requires Node installed on host) after the database container is up:
```bash
cd backend-api
npm install
npx prisma generate
npx prisma db push
npx prisma db execute --file prisma/setup_views_triggers.sql
npx prisma db execute --file prisma/setup_stored_procedure.sql
npm run seed
```

### 4. Verify Services
- **Backend Health**: `curl http://localhost:3000/health`
- **AI Service Health**: `curl http://localhost:8000/health`

## Documentation Directory (Single Source of Truth)
All project planning, schemas, and structural documents are linked below:

1. **[Project Roadmap & Implementation Plan](./docs/implementation_plan.md)**: Detailed phase-by-phase development guide, starting from AI verification to AWS deployment.
2. **[Database Schema & ER Diagram](./docs/database_schema.md)**: Fulfills the 8-table, 3NF, and ER diagram criteria from your PDF.
3. **[Repository & Folder Structure](./docs/project_structure.md)**: The architectural layout of the monorepo for the Web, Mobile, API, and AI services.

## Core Features
*   **AI Food Recognition**: Upload meals, detect foods via YOLO/MobileNet.
*   **Nutritional Estimation**: Calculate calories, proteins, carbs, and fats.
*   **Daily Tracking**: Dashboard for caloric goals and historical tracking.
*   **AI Nutrition Coach**: Personalized LLM-based diet feedback.
*   **Cross-Platform**: React Web, React Native Android, and WearOS.
