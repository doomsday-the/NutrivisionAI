# 00_01 Project Charter

## Project Name
NutriVision AI

## Problem
Accurately tracking calories and macronutrients is difficult, especially for complex, cooked Indian foods. Existing crowdsourced databases often have inaccurate nutritional information and lack distinction between raw and cooked food states.

## Target Users
- Individuals looking to track daily caloric intake and macronutrients.
- Users seeking dietary tracking optimized for Indian cuisine.
- WearOS users who want integrated health and activity tracking.

## Goals
- Provide seamless, photo-based food detection and nutritional estimation.
- Build an authoritative, scientifically-backed database using ICMR-NIN IFCT 2017 and USDA FoodData Central.
- Establish bi-directional syncing with WearOS (e.g., offsetting consumed calories with tracked steps).
- Deliver a working MVP with a Mock AI engine that proves end-to-end backend data flow.

## Non-Goals
- We are not building a crowdsourced food database (no user-submitted nutritional data).
- We are not providing medical diagnoses or certified dietetic prescriptions.
- We are not supporting Email/Password authentication for the MVP (strictly Google OAuth).

## Scope
1. Node.js (Express) backend API with PostgreSQL.
2. Python (FastAPI) AI microservice (mocked initially, transitioning to real YOLO/MobileNet).
3. React Web Dashboard.
4. React Native Android App.
5. WearOS companion app (pushing activity data).

## Constraints
- **Hosting**: Infrastructure must fit entirely within free-tier limits (Render, Railway, Supabase, etc.). The AI engine must be optimized for CPU-only inference or lightweight models.
- **Database**: Must strictly use a Relational Database (PostgreSQL) to satisfy university requirements (no NoSQL/MongoDB).
- **Time/Budget**: Solo developer, 10-12 month timeline, zero budget.

## Success Criteria
- The system correctly routes an uploaded image from Web/Mobile -> Node API -> Python AI -> Node API -> PostgreSQL.
- WearOS successfully pushes activity data that dynamically updates the user's daily calorie limits.
- The project fulfills all VIT Database Systems course criteria (ER diagrams, 3NF, triggers, minimum 8 tables).
