# Short-Term & Long-Term Roadmap: Production-Grade Nutrition Engine 🚀

**Objective**: Provide an authoritative, multimodal nutrition platform integrating Indian (ICMR IFCT 2017) and global cuisines (USDA FoodData Central), backed by 3NF relational PostgreSQL, a high-availability Express API, a modern React web dashboard, a zero-battery-drain Android companion app for Samsung Health synchronization, and an intelligent AI Nutrition Coach.

---

## ✅ Phase 1: Comprehensive Database Architecture
* **Core Entities**: 16 normalized tables in Third Normal Form (3NF) (`users`, `user_profiles`, `meals`, `meal_items`, `food_items`, `food_nutrients`, `nutrient_types`, `daily_logs`, `ai_match_log`, `food_sources`, `food_categories`, `serving_sizes`, `food_aliases`, `tags`, `food_tags`).
* **Food State Constraints**: Explicit differentiation between food states (e.g., "Rice - raw" vs "Rice - cooked (boiled)") reflecting distinct caloric and nutrient densities.
* **Full-Text Search**: PostgreSQL `TSVECTOR` with GIN indexing on food names and local Indian aliases.
* **Database Triggers**: Automatic search vector updates (`trg_update_search_vector`), timestamp updates (`trg_set_updated_at`), and transactional daily log calculations (`trg_update_daily_log`).
* **SQL Views**: Pre-joined views `public.vw_user_daily_summary` and `public.vw_food_full`.

## ✅ Phase 2: Dual-Source Data Seeding & ETL
* **Source Registration**: Curated repositories combining ICMR-NIN IFCT 2017 (primary, for Indian staples) and USDA FoodData Central (secondary, for global/packaged foods).
* **Ingestion Pipelines**: Python ETL scripts (`load_ifct.py`, `load_usda.py`) parsing source CSVs with de-duplication and nutrient mapping.
* **Production Bootstrap**: Node.js `bootstrap.ts` with 50+ common seed items and dynamic PostgreSQL sequence discovery (`syncDatabaseSequences`).

## ✅ Phase 3: Enterprise-Grade Express Backend
* **Layered Architecture**: Express API in TypeScript with Prisma ORM, Zod validation, and centralized error handling.
* **Atomic Stored Procedure**: `public.sp_log_meal` encapsulating meal logging, portion scaling, AI audit trails, and daily log balance updates in a single ACID transaction.
* **Authentication Suite**: Google OAuth 2.0, Developer bypass authentication (`/api/auth/dev-login`), and dedicated Android Companion email pairing (`/api/auth/companion-login`).

## ✅ Phase 4: Scalable AI Vision Microservice
* **FastAPI Microservice**: Token-authenticated Python service (`X-Internal-Token`) with `/predict` and `/health` endpoints.
* **Roboflow IndianFoodNet**: Hosted inference model classifying 30+ regional Indian dishes.
* **MiDaS Depth Estimation**: DPT_Hybrid relative depth estimation scaling base portion weights according to plate scene geometry.

## ✅ Phase 5: Modern Luxury Web Dashboard (React 19 + Vite 8 + Tailwind v4)
* **Visual Hierarchy**: Dark luxury aesthetic with emerald ambient lighting and editorial typography.
* **Daily Metabolic Ledger**: Compact control bar with quick date navigation, remaining calories, steps, and instant meal logging.
* **Interactive Visualizations**: SVG circular calorie gauge, macronutrient target bars, Recharts 7-day intake trajectory bar chart, and macro distribution donut charts.
* **Dual-Mode Meal Logging**: Camera plate recognition and instant search across ICMR & USDA databases.

## ✅ Phase 6: AI Nutrition Coach & Multimodal Vision Cascade
* **Multimodal Cascade**: Resilient Google Gemini cascade (`gemini-flash-lite-latest`, `gemini-3.1-flash-lite`, `gemini-flash-latest`, `gemini-3.5-flash`) eliminating 503 high-demand spike bottlenecks.
* **NutriCoach Intelligence**: Personalized dietary briefing, Indian culinary food swaps, and macro assessments via `POST /api/coach/explain` and `GET /api/coach/daily-insight`.
* **Zero Rice Guessing**: Crash-proof dynamic food ingestion with sequence auto-recovery (`ADR-013`), preserving authentic detected dish labels.

## ✅ Phase 7: Native Android Companion App & Samsung Health Sync (ADR-010)
* **Native Kotlin + Jetpack Compose**: Lightweight companion app (`mobile-app/`, `compileSdk = 35`, Java 17).
* **Official Google Health Connect API**: Uses `HealthConnectClient.aggregate(StepsRecord.COUNT_TOTAL)` for verified, deduplicated step counts from Samsung Health.
* **Zero Background Battery Drain**: Runs strictly on-demand. Never runs background polling daemons or battery-draining timers.
* **One-Tap Push to Web**: Open app, inspect live steps & active calories, and tap **"PUSH TO NUTRIVISION WEB"** (`POST /api/activity/sync`).
* **Automated Cloud Builds**: GitHub Actions compiles and publishes `NutriVisionSync.apk` to release `companion-latest`.

## ✅ Phase 8: Cloud Production Deployment & CI/CD (ADR-004)
* **Production Web Dashboard**: [https://nutrivision-ai-mu.vercel.app](https://nutrivision-ai-mu.vercel.app)
* **Production Backend API**: [https://nutrivision-backend-i9x2.onrender.com](https://nutrivision-backend-i9x2.onrender.com)
* **Managed Database**: Cloud PostgreSQL database on Neon.
* **CI/CD Pipelines**: Automated backend testing (`ci.yml`) and Android APK compilation & release (`build-apk.yml`).

---

## 🔮 Future Enhancements (Post-Submission Backlog)
1. **Per-Bounding-Box Depth Masking**: Refine MiDaS relative depth estimation from whole-crop heuristics to individual segmented bounding box masks.
2. **Barcode Scanner Integration**: Ingest OpenFoodFacts API for instant barcode scanning of Indian packaged snacks and grocery items.
3. **Micronutrient & Vitamin RDA Tracking**: Expand UI meters to track Vitamin D, B12, Iron, and Calcium from ICMR IFCT 2017 data.
4. **Offline PWA Caching**: Progressive Web App service worker caching for offline meal browsing and logging when network connectivity is lost.
