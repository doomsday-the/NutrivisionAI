# 00_01 Project Charter

## Project Name
NutriVision AI 🥗📸

## Problem
Accurately tracking calories and macronutrients is notoriously difficult, especially for complex, cooked Indian foods with high culinary variability. Existing crowdsourced databases often have inaccurate nutritional information, conflate raw and cooked states, and lack robust multimodal plate detection. Furthermore, health enthusiasts tracking activity on smartwatches (e.g. Samsung Health) struggle with battery-draining background sync or disconnected web platforms.

## Target Users
- Individuals looking to track daily caloric intake and macronutrients with clinical accuracy.
- Users seeking dietary tracking optimized for Indian cuisine (ICMR IFCT 2017) and global staples (USDA FoodData Central).
- Android & Samsung Health users who want zero-background-drain, on-demand physical activity syncing to expand daily caloric budgets in real time.

## Team Structure & Responsibilities
- **Arush Mehta (Lead Architect & Developer)**:
  - **Relational Database Design**: 16 normalized tables in 3NF, ER modeling, SQL triggers, SQL views, and atomic stored procedures (`sp_log_meal`).
  - **Backend API Engineering**: Node.js 22, Express, TypeScript, Prisma ORM, Zod validation, JWT authentication, companion login, and activity synchronization.
  - **Multimodal AI Vision & Coach**: High-resilience Google Gemini vision cascade (`gemini-flash-lite-latest`, `gemini-3.1-flash-lite`, `gemini-flash-latest`, `gemini-3.5-flash`), dynamic food creation with sequence auto-recovery, and NutriCoach nutritional reasoning.
  - **Computer Vision Microservice**: Python 3.11, FastAPI, Roboflow IndianFoodNet inference, and MiDaS `DPT_Hybrid` relative depth estimation.
  - **Web Dashboard**: React 19, Vite 8, Tailwind CSS v4, Recharts intake trajectories, persistent Daily Metabolic Ledger, and modular design system.
  - **Native Android Companion App**: Native Kotlin, Jetpack Compose, official Google Health Connect API (`compileSdk = 35`), and Samsung Health aggregation.
  - **DevOps & CI/CD**: Docker multi-container orchestration, Render backend deployment, Vercel frontend deployment, and automated GitHub Actions APK compilation (`build-apk.yml`).

## Goals
- Provide seamless, photo-based food detection and nutritional estimation with high resilience and zero false "rice guessing".
- Build an authoritative, scientifically-backed database combining ICMR-NIN IFCT 2017 and USDA FoodData Central with raw vs. cooked state distinction.
- Establish seamless on-demand activity synchronization from Samsung Health via Google Health Connect, offsetting consumed calories in real time.
- Provide contextual AI Nutrition Coaching (`/api/coach/explain` and `/api/coach/daily-insight`) tailored to Indian dietary habits and personal goals.
- Satisfy all university Database Systems course criteria (BCSE307L) including 3NF normalization, transactions, triggers, views, stored procedures, and professional development standards.

## Non-Goals
- We are not building an uncontrolled crowdsourced food database (no unverified user-submitted nutritional values).
- We are not providing medical diagnoses or certified clinical prescriptions.
- We do not run persistent background daemons on mobile devices that drain battery; activity sync operates strictly on-demand.

## Scope
1. **Node.js (Express) backend API** with PostgreSQL 15/16 and Prisma ORM (`backend-api/`).
2. **Multimodal AI Vision & Coach Engine**: Google Gemini Multimodal cascade with dynamic food matching and automated database backfilling.
3. **Computer Vision Microservice**: Python FastAPI microservice with Roboflow IndianFoodNet and MiDaS relative depth estimation (`ai-service/`).
4. **React Web Dashboard**: Modern React 19, Vite 8, Tailwind CSS v4, Recharts, and embedded NutriCoach widget (`frontend-web/`).
5. **Native Android Companion App**: Kotlin + Jetpack Compose companion app using official Google Health Connect API for Samsung Health synchronization (`mobile-app/`).
6. **Automated CI/CD**: GitHub Actions for automated unit testing (`ci.yml`) and automated release APK compilation (`build-apk.yml`).

## Constraints
- **Hosting**: Infrastructure fits within free-tier limits (Render, Vercel, Neon/Supabase cloud PostgreSQL).
- **Database**: Strictly Relational PostgreSQL in 3NF satisfying university requirements (no MongoDB/NoSQL).
- **Battery & Privacy**: Android companion requires explicit user consent via official Android Health Connect dialogs and zero background battery usage.

## Success Criteria
- The system correctly detects uploaded meal photos from Web/Mobile, maps items to canonical database records, and logs meals atomically via `sp_log_meal`.
- Android companion successfully reads Samsung Health step counts and pushes activity telemetry that dynamically updates the user's daily remaining calorie balance.
- Live web dashboard reflects meal logs, macro distribution donuts, weekly trajectories, and AI coach insights without page refresh.
- The project fulfills all VIT Database Systems course criteria (ER diagrams, 3NF, triggers, views, stored procedures, minimum 8 tables).
