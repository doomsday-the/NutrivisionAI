# NutriVision AI — Computer Vision Microservice 🥗🤖

The computer vision and depth estimation microservice for **NutriVision AI**, built with **Python 3.11**, **FastAPI**, **Roboflow IndianFoodNet**, and **MiDaS DPT_Hybrid** relative depth estimation.

---

## Architecture Overview

The AI service operates as an internal microservice called by the Node.js backend when falling back from the primary multimodal Gemini cascade:

```
[ Backend API ] ──(POST /predict + X-Internal-Token)──▶ [ FastAPI Service ]
                                                              │
                                     ┌────────────────────────┴────────────────────────┐
                                     ▼                                                 ▼
                          [ Roboflow Inference ]                            [ MiDaS DPT_Hybrid Depth ]
                      Identifies Indian & global dishes                   Generates relative depth map &
                        (Dosa, Dal, Paneer, Biryani)                     scales calibrated portion weights
```

---

## Core Modules

### 1. `src/app.py`
- Exposes `POST /predict` and `GET /health`.
- Validates the shared internal authentication token (`X-Internal-Token`).
- Encodes meal photographs to base64 and invokes the hosted **Roboflow IndianFoodNet** model (`indianfoodnet/1`).
- Maps predicted classes (`Dosa`, `Idli`, `Biryani`, `Paneer`, `Dal`, etc.) to canonical database `food_id`s.

### 2. `src/depth.py`
- Implements **MiDaS DPT_Hybrid** relative depth estimation via PyTorch Hub (`intel-isl/MiDaS`).
- Transforms the input image, calculates normalized 0–1 depth maps, and scales baseline culinary portion weights (`BASE_WEIGHTS`) according to plate scene geometry.
- Enforces safe clamping bounds (`MIN_WEIGHT: 20g`, `MAX_WEIGHT: 800g`).

### 3. `etl/` (Extract, Transform, Load)
- `load_ifct.py`: Parses the ICMR-NIN Indian Food Composition Tables 2017 dataset (`ifct2017.csv`) into the 3NF schema.
- `load_usda.py`: Parses USDA FoodData Central CSVs (`food.csv`, `nutrient.csv`, `food_nutrient.csv`).
- `generate_data.py`: Synthesizes priority test dishes and nutrition records for staging validation.

---

## API Endpoints

### `GET /health`
Verifies microservice operational status and checks whether the MiDaS PyTorch model is loaded in memory.
```json
{
  "status": "ok",
  "midas_loaded": false
}
```

### `POST /predict`
- **Headers:** `X-Internal-Token: <shared_secret>`
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `image`: Image file (JPEG or PNG, <= 10MB)
  - `session_id`: Correlation UUID v4
- **Response (200 OK):**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "match_method": "roboflow",
  "detections": [
    {
      "detected_label": "Dosa",
      "matched_food_id": 26,
      "confidence": 0.942,
      "suggested_weight_grams": 150.0
    },
    {
      "detected_label": "CoconutChutney",
      "matched_food_id": 28,
      "confidence": 0.885,
      "suggested_weight_grams": 50.0
    }
  ]
}
```

---

## Local Development & Setup

### Prerequisites
- Python 3.11+
- pip and virtualenv

### 1. Create Virtual Environment
```bash
cd ai-service
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Create `.env` in `ai-service/`:
```env
X_INTERNAL_TOKEN=shared_secret_between_node_and_python
ROBOFLOW_API_KEY=R6ctDFt29vNejksIHIOC
```

### 4. Run the Service
```bash
uvicorn src.app:app --host 0.0.0.0 --port 8000 --reload
```
Test health: `curl http://localhost:8000/health`.

### 5. Run via Docker
```bash
docker build -t nutrivision-ai .
docker run -p 8000:8000 -e X_INTERNAL_TOKEN=shared_secret_between_node_and_python nutrivision-ai
```
