# NutriVision AI — Clinical-Grade Frontend Web Dashboard 🥗💻

The frontend web application for **NutriVision AI**, built with **React 19**, **TypeScript**, **Vite 8**, and **Tailwind CSS v4**. It delivers an editorial visual hierarchy, dark luxury aesthetic with emerald ambient glows, a persistent daily metabolic ledger, and real-time computer vision plate tracking.

---

## Live Deployment

- **Production Web Dashboard:** [https://nutrivision-ai-mu.vercel.app](https://nutrivision-ai-mu.vercel.app)
- **Backend API Endpoint:** [https://nutrivision-backend-i9x2.onrender.com](https://nutrivision-backend-i9x2.onrender.com)
- **Android Companion APK:** [NutriVisionSync.apk (Direct Download)](https://github.com/doomsday-the/NutrivisionAI/releases/download/companion-latest/NutriVisionSync.apk)

---

## Architectural Highlights & Features

1. **Persistent Daily Metabolic Ledger**:
   - Sticky top control bar showing quick date navigation (`YYYY-MM-DD`), remaining calories vs. goal, live steps, AI coach readiness, and instant meal logging CTA.
2. **Editorial Aesthetics & Dark Luxury Lighting**:
   - `#071013` deep obsidian background with glassmorphic cards (`#0b171b`), emerald accents (`#10b981`, `#34d399`), and typography modeled after clinical metabolic journals.
3. **Interactive Nutritional Visualizations**:
   - Custom SVG circular energy intake dial reflecting consumed vs. remaining calories.
   - 7-day intake trajectory bar chart powered by **Recharts** (`/api/activity/weekly`).
   - Dynamic macronutrient donut breakdown (Protein, Carbohydrates, Total Fat).
4. **Dual-Mode Meal Logging**:
   - **Computer Vision Mode**: Camera capture / file upload invoking Google Gemini multimodal vision cascade with realistic portion scaling.
   - **Manual Search Mode**: Real-time autocomplete searching against ICMR IFCT 2017 and USDA FoodData Central databases.
5. **Interactive NutriCoach Widget**:
   - Embedded AI nutritionist analyzing meal intake against personal biometrics, offering Indian food swaps and next meal guidance with sessionStorage caching.
6. **Native Companion App Bridge**:
   - 1-tap APK download button directly in the navbar and mobile drawer.
   - Deep-linking support (`nutrivision://connect?token=...`) on the Activity page for seamless 1-tap Google Account pairing with Samsung Health.

---

## Design System & Modular UI Primitives

Reusable design system components are organized under `src/components/ui/`:
- **`Card`**: Obsidian surface with subtle 1px border (`#18282c`) and hover elevation.
- **`Button`**: High-contrast luxury buttons (Primary white, Emerald glow, Outline, Ghost).
- **`Badge`**: Status indicators for meal types, macro tags, and AI coach status.
- **`ProgressRing`**: SVG animated circular gauge with glowing SVG filters.
- **`Skeleton`**: Shimmer loading placeholders for async chart and meal row loading.

---

## Project Structure

```text
frontend-web/
├── public/                 # Static assets and icons
├── src/
│   ├── assets/             # Logos and imagery
│   ├── components/         # Layout, NutriCoachWidget, ProtectedRoute
│   │   └── ui/             # Design system primitives (Card, Button, Badge, ProgressRing, Skeleton)
│   ├── context/            # AuthContext (Google OAuth & dev bypass authentication)
│   ├── pages/
│   │   ├── Dashboard.tsx   # Ledger, energy dial, Recharts trajectories, meal cards
│   │   ├── LogMeal.tsx     # Plate scan upload, portion editor, manual search
│   │   ├── MealHistory.tsx # Historical calendar, macro badges, meal item deletion
│   │   ├── Activity.tsx    # Samsung Health companion pairing & manual step sync
│   │   ├── NutritionCoach.tsx # Conversational AI nutritionist chat interface
│   │   ├── Profile.tsx     # Mifflin-St Jeor TDEE biometric profile calculator
│   │   └── Login.tsx       # Google OAuth & instant demo bypass login
│   ├── config.ts           # Dynamic API base URL configuration
│   ├── App.tsx             # Route declarations and OAuth provider wrapper
│   └── main.tsx            # Application bootstrap
├── package.json
├── vercel.json             # SPA rewrites for Vercel deployment
└── vite.config.ts          # Vite build configuration
```

---

## Local Development & Setup

### Prerequisites
- Node.js 20+
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create `.env` in `frontend-web/`:
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=558532335340-jsbgfpii5qojdbdk8oa23tlukjhljrca.apps.googleusercontent.com
```

### 3. Start Development Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

Click **"Instant Demo Login (Bypass)"** on the login screen for instant authenticated access without requiring external Google OAuth popups.

### 4. Build for Production
```bash
npm run build
```
The compiled SPA bundle will be placed in `dist/`.
