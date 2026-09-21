# Short-Term Goal: Production-Grade Database & AI Integration 🚀

**Objective**: Prioritize and finalize a comprehensive, industry-standard database structure. We will populate this using a dual-source strategy: **ICMR-NIN IFCT 2017** (Primary, for Indian Foods) and **USDA FoodData Central** (Secondary, for Global Foods). Once the database is solid and seeded, connect a scalable Node.js backend to a mocked Python AI microservice.

---

## Phase 1: Comprehensive Database Architecture
Build out the highly-normalized PostgreSQL database mapped exactly to your uploaded schema design.
*   **Core Entities**: `food_items`, `food_categories`, `food_sources`, `food_aliases`.
*   **Nutritional Mapping**: `nutrient_types`, `food_nutrients` (handling macro/micronutrients).
*   **State & Serving Constraints**: `serving_sizes` and `recipe_ingredients`. *Crucial distinction:* The schema will explicitly distinguish between food states (e.g., "Rice - raw" vs "Rice - cooked/boiled/fried") since their nutritional density by weight differs drastically.
*   **Metadata & Search**: `tags`, `food_tags` (for tracking cuisines like Indian/Western), and PostgreSQL's `TSVECTOR` for high-performance searching.
*   **AI Logging**: `ai_match_log` to track AI detections, confidence scores, and user corrections.
*   **Staging Tables**: Create `staging.icmr_food`, `staging.usda_food`, `staging.usda_nutrient` to prepare for the bulk ETL pipelines.

## Phase 2: Dual-Source Data Seeding & ETL (Extract, Transform, Load)
Instead of relying on inaccurate crowdsourced APIs (like MyFitnessPal), we will build an authoritative scientific database layer.
*   **Step 2a: Source Registration**: Populate `food_sources` with `ICMR-NIN IFCT 2017` and `USDA FoodData Central`.
*   **Step 2b: Indian Food Ingestion (Primary)**: Build a Python ETL script to parse IFCT 2017 data (extracting items like Dal, Roti, Dosa, Idli, Paneer, and regional cooked foods) into the staging tables, then migrating to `food_items` and `food_nutrients`.
*   **Step 2c: Global Food Ingestion (Secondary)**: Ingest USDA FDC data to fill the gaps with Western and packaged foods (Pizza, Burgers) to act as a fallback.
*   **Step 2d: Normalization**: Ensure every food item maps correctly to its `food_aliases`, `density_g_per_ml`, and `nutrient_types`.

## Phase 3: Enterprise-Grade Foundation (Node.js/Express)
*   **Layered Architecture**: Controllers -> Services -> Data Access Layer.
*   **Validation & Error Handling**: Use `Zod`/`Joi` and centralized global error handlers.
*   **Database Connection**: Connect Express to the newly populated dual-source PostgreSQL database.

## Phase 4: Scalable AI Microservice (Python/FastAPI)
*   **FastAPI Setup**: Use `Pydantic` models for strict request/response typing.
*   **Mock Inference**: Create a service that accepts an image but returns a hardcoded JSON response. *Crucially, this mock JSON will now intelligently return `food_id`s corresponding to the exact IFCT or USDA cooked records we seeded in Phase 2.*

## Phase 5: Resilient Inter-Service Communication & Containerization
*   Node.js calls the Python API using robust timeout/retry logic.
*   When the mock AI returns a match, Node.js logs the interaction into the `ai_match_log` table to establish the AI feedback loop.
*   Wrap PostgreSQL, Node.js, and Python into a `docker-compose.yml` for professional, one-click deployment.
