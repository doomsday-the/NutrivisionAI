# Short-Term Goal: Production-Grade Database & AI Integration 🚀

**Objective**: Prioritize and finalize a comprehensive, industry-standard database structure. We will populate this using a dual-source strategy: **ICMR-NIN IFCT 2017** (Primary, for Indian Foods) and **USDA FoodData Central** (Secondary, for Global Foods). Once the database is solid and seeded, connect a scalable Node.js backend to a mocked Python AI microservice.

---

## ✅ Phase 1: Comprehensive Database Architecture
Build out the highly-normalized PostgreSQL database mapped exactly to your uploaded schema design.
*   **Core Entities**: `food_items`, `food_categories`, `food_sources`, `food_aliases`.
*   **Nutritional Mapping**: `nutrient_types`, `food_nutrients` (handling macro/micronutrients).
*   **State & Serving Constraints**: `serving_sizes` and `recipe_ingredients`. *Crucial distinction:* The schema will explicitly distinguish between food states (e.g., "Rice - raw" vs "Rice - cooked/boiled/fried") since their nutritional density by weight differs drastically.
*   **Metadata & Search**: `tags`, `food_tags` (for tracking cuisines like Indian/Western), and PostgreSQL's `TSVECTOR` for high-performance searching.
*   **AI Logging**: `ai_match_log` to track AI detections, confidence scores, and user corrections.
*   **Staging Tables**: Create `staging.icmr_food`, `staging.usda_food`, `staging.usda_nutrient` to prepare for the bulk ETL pipelines.

## ✅ Phase 2: Dual-Source Data Seeding & ETL (Extract, Transform, Load)
Instead of relying on inaccurate crowdsourced APIs (like MyFitnessPal), we will build an authoritative scientific database layer.
*   **Step 2a: Source Registration**: Populate `food_sources` with `ICMR-NIN IFCT 2017` and `USDA FoodData Central`.
*   **Step 2b: Indian Food Ingestion (Primary)**: Build a Python ETL script to parse IFCT 2017 data (extracting items like Dal, Roti, Dosa, Idli, Paneer, and regional cooked foods) into the staging tables, then migrating to `food_items` and `food_nutrients`.
*   **Step 2c: Global Food Ingestion (Secondary)**: Ingest USDA FDC data to fill the gaps with Western and packaged foods (Pizza, Burgers) to act as a fallback.
*   **Step 2d: Normalization**: Ensure every food item maps correctly to its `food_aliases`, `density_g_per_ml`, and `nutrient_types`.

## ✅ Phase 3: Enterprise-Grade Foundation (Node.js/Express)
*   **Layered Architecture**: Controllers -> Services -> Prisma ORM -> PostgreSQL.
*   **Validation & Error Handling**: Zod validation on API payloads, typed error responses, centralized error middleware.
*   **Database Connection & Stored Procedures**: Connected Express to PostgreSQL, executing atomic `sp_log_meal` transactions.

## ✅ Phase 4: Scalable AI Microservice (Python/FastAPI)
*   **FastAPI Architecture**: Pydantic request/response models and token-secured endpoints (`/predict`, `/health`).
*   **CV Inference**: Roboflow hosted IndianFoodNet model integration detecting authentic Indian dishes.
*   **Portion Heuristics**: MiDaS relative depth estimation scaling base portion weights according to plate geometry.

## ✅ Phase 5: Resilient Inter-Service Communication & Containerization
*   **Inter-Service Resilience**: Exponential backoff retry logic (`axios-retry`) and shared internal security tokens.
*   **Audit Logging**: Every AI prediction is recorded in PostgreSQL `ai_match_log` along with user portion adjustments.
*   **Containerization**: `docker-compose.yml` deploying PostgreSQL, Express Backend API, and FastAPI AI Service with health checks.
*   **Frontend Client**: Modern React + Vite web dashboard featuring SVG calorie rings, Recharts, and dual-mode meal logging.

## ✅ Phase 6: AI Nutrition Coach (Gemini LLM)
*   **Conversational Feedback**: Integrated Gemini 1.5 Flash via `@google/generative-ai` with structured dietary prompts and local fallback.
*   **Endpoints**: Added `POST /api/coach/explain` for chat Q&A and `GET /api/coach/daily-insight` for macro evaluations.
*   **UI Components**: Dedicated `NutritionCoach.tsx` chat screen and `NutriCoachWidget.tsx` embedded on the Dashboard auto-updating on meal logs.

---

## ⏳ Next Milestones (Subject to User Confirmation)
1. **Cloud Deployment (Option C)**: Staging rollout to free-tier cloud hosting (Vercel frontend, Render backend, Supabase PostgreSQL).
2. **Per-Bounding-Box Depth Masking**: Upgrade MiDaS center-crop proxy to evaluate depth over individual bounding boxes as defined in ADR-009.
3. **Mobile Client (React Native)**: Connect camera scanning on Android/iOS to the existing `POST /api/meals/analyze` endpoint.
