from fastapi import FastAPI, File, UploadFile, Header, HTTPException, Form
from pydantic import BaseModel
from typing import List, Optional
import os

app = FastAPI(title="NutriVision AI Service")

# Mock Auth Token (In production, read from env)
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
    return {"status": "ok"}

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

    # ADR-005: Mock Response Phase
    # We return the exact mock JSON specified in the API contract TC-001
    return PredictResponse(
        session_id=session_id,
        match_method="mock",
        detections=[
            DetectionItem(
                detected_label="rice",
                matched_food_id=12,
                confidence=0.9400,
                suggested_weight_grams=150.00
            ),
            DetectionItem(
                detected_label="dal",
                matched_food_id=34,
                confidence=0.8700,
                suggested_weight_grams=120.00
            )
        ]
    )
