import logging
import os
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, Header, HTTPException, Form
from pydantic import BaseModel

from src.depth import estimate_weights, is_model_loaded

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

    import base64
    import json
    import urllib.request
    import os

    api_key = os.getenv("ROBOFLOW_API_KEY", "R6ctDFt29vNejksIHIOC")
    url = f"https://detect.roboflow.com/indianfoodnet/1?api_key={api_key}"

    req = urllib.request.Request(
        url,
        data=base64.b64encode(image_bytes).decode("ascii").encode('ascii'),
        headers={'Content-Type': 'application/x-www-form-urlencoded'},
        method='POST'
    )

    detections: List[DetectionItem] = []
    
    CLASS_TO_ID = {
        "Dosa": 26,
        "Idli": 27,
        "CoconutChutney": 28,
        "Sambar": 29,
        "Roti": 30,
        "Samosa": 31,
        "Vada": 32,
        "Paneer": 33,
        "Biryani": 35,
        "Gulab Jamun": 36,
        "Rice": 12,
        "Dal": 34
    }

    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                for i, pred in enumerate(data.get("predictions", [])):
                    cls_name = pred["class"]
                    safe_id = CLASS_TO_ID.get(cls_name, 12)  # fallback to Rice if unknown
                    detections.append(
                        DetectionItem(
                            detected_label=cls_name,
                            matched_food_id=safe_id,
                            confidence=pred["confidence"],
                            suggested_weight_grams=150.0
                        )
                    )
            else:
                logger.error(f"Roboflow API error: {response.status}")
    except Exception as e:
        logger.error(f"Failed to call Roboflow: {e}")

    return PredictResponse(
        session_id=session_id,
        match_method="roboflow",
        detections=detections,
    )
