import logging
import os
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, Header, HTTPException, Form
from pydantic import BaseModel

try:
    from src.depth import estimate_weights, is_model_loaded
except ImportError:
    from depth import estimate_weights, is_model_loaded

logger = logging.getLogger("ai_service")

app = FastAPI(title="NutriVision AI Service")

X_INTERNAL_TOKEN = os.getenv("X_INTERNAL_TOKEN", "shared_secret_between_node_and_python")

class DetectionItem(BaseModel):
    detected_label: str
    matched_food_id: Optional[int]
    confidence: float
    suggested_weight_grams: Optional[float]

class PredictResponse(BaseModel):
    session_id: str
    match_method: str
    detections: List[DetectionItem]

def verify_token(x_internal_token: str = Header(None)):
    if not x_internal_token or x_internal_token != X_INTERNAL_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "midas_loaded": is_model_loaded()
    }

@app.post("/predict", response_model=PredictResponse)
async def predict(
    image: UploadFile = File(...),
    session_id: str = Form(...),
    x_internal_token: str = Header(None)
):
    verify_token(x_internal_token)

    # Validate image
    if image.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail={
            "error": "INVALID_IMAGE",
            "message": "File must be JPEG or PNG and under 10MB."
        })

    image_bytes = await image.read()

    # Classification remains strictly mocked per prompt instructions
    mocked_detections = [
        {
            "detected_label": "rice",
            "matched_food_id": 12,
            "confidence": 0.9400,
            "default_weight": 150.00,
        },
        {
            "detected_label": "dal",
            "matched_food_id": 34,
            "confidence": 0.8700,
            "default_weight": 120.00,
        },
    ]

    # Dynamically estimate weights via MiDaS depth estimation with graceful fallback
    try:
        calculated_weights = estimate_weights(image_bytes, mocked_detections)
    except Exception as e:
        logger.warning(f"MiDaS depth weight estimation failed, falling back to default weights: {e}")
        calculated_weights = [item["default_weight"] for item in mocked_detections]

    detections: List[DetectionItem] = []
    for i, item in enumerate(mocked_detections):
        weight = calculated_weights[i] if i < len(calculated_weights) else item["default_weight"]
        detections.append(
            DetectionItem(
                detected_label=item["detected_label"],
                matched_food_id=item["matched_food_id"],
                confidence=item["confidence"],
                suggested_weight_grams=weight,
            )
        )

    return PredictResponse(
        session_id=session_id,
        match_method="mock",
        detections=detections,
    )
