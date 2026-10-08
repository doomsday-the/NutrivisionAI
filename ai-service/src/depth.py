import io
import logging
from typing import List, Dict, Any, Optional
import numpy as np
from PIL import Image

logger = logging.getLogger("midas_depth")

_model: Any = None
_transform: Any = None
_device: Any = None

BASE_WEIGHTS: Dict[str, float] = {
    "rice": 150.0,
    "dal": 120.0,
    "paneer": 100.0,
    "roti": 60.0,
    "chicken": 150.0,
    "egg": 60.0,
    "dosa": 100.0,
    "idli": 80.0,
    "biryani": 250.0,
    "pizza": 200.0,
    "burger": 220.0,
    "pasta": 180.0,
    "oats": 150.0,
    "bread": 60.0,
    "apple": 150.0,
    "banana": 120.0,
}
DEFAULT_BASE_WEIGHT: float = 100.0
DEPTH_SCALE_FACTOR: float = 0.8
MIN_WEIGHT: float = 20.0
MAX_WEIGHT: float = 800.0

def load_midas() -> Any:
    """Loads the MiDaS DPT_Hybrid model and transform as a module-level singleton."""
    global _model, _transform, _device
    if _model is not None:
        return _model

    try:
        import torch

        _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Loading MiDaS DPT_Hybrid model on {_device}...")

        _model = torch.hub.load("intel-isl/MiDaS", "DPT_Hybrid", pretrained=True, trust_repo=True)
        _model.to(_device)
        _model.eval()

        midas_transforms = torch.hub.load("intel-isl/MiDaS", "transforms", trust_repo=True)
        _transform = midas_transforms.dpt_transform
        logger.info("MiDaS model and transforms initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to load MiDaS model: {e}")
        _model = None
        _transform = None

    return _model

# Attempt eager load on startup
# try:
#     load_midas()
# except Exception as e:
#     logger.warning(f"Initial eager MiDaS loading skipped: {e}")

def is_model_loaded() -> bool:
    """Returns True if the MiDaS model is initialized in memory."""
    return _model is not None

def compute_depth_map(img_pil: Image.Image) -> np.ndarray:
    """Generates a normalized 0-1 depth map matching the input image dimensions."""
    import torch

    if _model is None or _transform is None:
        raise RuntimeError("MiDaS model is not loaded")

    img_np = np.array(img_pil.convert("RGB"))
    input_batch = _transform(img_np).to(_device)

    with torch.no_grad():
        prediction = _model(input_batch)
        prediction = torch.nn.functional.interpolate(
            prediction.unsqueeze(1),
            size=img_np.shape[:2],
            mode="bicubic",
            align_corners=False,
        ).squeeze()

    depth_map = prediction.cpu().numpy()
    d_min = float(depth_map.min())
    d_max = float(depth_map.max())

    if d_max - d_min > 1e-6:
        norm_depth = (depth_map - d_min) / (d_max - d_min)
    else:
        norm_depth = np.zeros_like(depth_map, dtype=np.float32)

    return norm_depth.astype(np.float32)

def estimate_weights(image_bytes: bytes, detections: List[Dict[str, Any]]) -> List[float]:
    """
    Decodes an image, computes a normalized depth map, evaluates the dominant
    depth in the center 40% region, and scales base food weights accordingly.
    """
    img = Image.open(io.BytesIO(image_bytes))
    norm_depth = compute_depth_map(img)

    h, w = norm_depth.shape
    y_start = int(h * 0.3)
    y_end = int(h * 0.7)
    x_start = int(w * 0.3)
    x_end = int(w * 0.7)

    center_region = norm_depth[y_start:y_end, x_start:x_end]
    if center_region.size > 0:
        median_depth = float(np.median(center_region))
    else:
        median_depth = 0.5

    estimated_weights: List[float] = []
    for detection in detections:
        label = str(detection.get("detected_label", "")).lower().strip()
        base_weight = BASE_WEIGHTS.get(label, DEFAULT_BASE_WEIGHT)

        # Inverted linear relationship: closer objects (lower depth value) represent larger volumes
        weight_g = base_weight * (1.0 + DEPTH_SCALE_FACTOR * (0.5 - median_depth))
        clamped_weight = float(np.clip(weight_g, MIN_WEIGHT, MAX_WEIGHT))
        estimated_weights.append(round(clamped_weight, 2))

    return estimated_weights
