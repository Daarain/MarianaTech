import io
from typing import Dict, Any

from PIL import Image
from ultralytics import YOLO


# ============================================================
# MARIANATECH YOLO MODEL
# ============================================================

MODEL_PATH = "best.pt"

model = YOLO(MODEL_PATH)


# These MUST match the classes used during YOLO training
CLASS_NAMES = {
    0: "shipwreck",
    1: "submarine_pipeline",
    2: "cylinder",
    3: "ghost_net",
    4: "crab_pot",
}


# ============================================================
# IMAGE METADATA
# ============================================================

def extract_image_metadata(pil_img: Image.Image) -> Dict[str, Any]:

    return {
        "format": pil_img.format or "UNKNOWN",
        "mode": pil_img.mode,
        "width": pil_img.width,
        "height": pil_img.height,
        "aspect_ratio": round(
            pil_img.width / pil_img.height, 2
        ) if pil_img.height > 0 else 1.0
    }


# ============================================================
# YOLO PIPELINE
# ============================================================

def run_pipeline(
    image_bytes: bytes,
    base_lat: float = -6.3,
    base_lon: float = 71.2
) -> Dict[str, Any]:

    # --------------------------------------------------------
    # 1. Read image
    # --------------------------------------------------------

    try:
        pil_img = Image.open(
            io.BytesIO(image_bytes)
        ).convert("RGB")

    except Exception as e:
        raise ValueError(
            f"Corrupted or invalid image file: {str(e)}"
        )

    if pil_img.width == 0 or pil_img.height == 0:
        raise ValueError("Image has invalid dimensions.")

    metadata = extract_image_metadata(pil_img)


    # --------------------------------------------------------
    # 2. YOLO inference
    # --------------------------------------------------------

    results = model.predict(
        source=pil_img,
        imgsz=640,
        conf=0.25,
        verbose=False
    )


    # --------------------------------------------------------
    # 3. Collect detections
    # --------------------------------------------------------

    detections = []

    for result in results:

        if result.boxes is None:
            continue

        for box in result.boxes:

            class_id = int(box.cls[0])
            confidence = float(box.conf[0])

            xyxy = box.xyxy[0].tolist()

            x1, y1, x2, y2 = xyxy

            class_name = CLASS_NAMES.get(
                class_id,
                "unknown"
            )

            detections.append({
                "class_id": class_id,
                "class_name": class_name,
                "confidence": confidence,
                "bbox": {
                    "x1": round(x1, 2),
                    "y1": round(y1, 2),
                    "x2": round(x2, 2),
                    "y2": round(y2, 2)
                }
            })


    # --------------------------------------------------------
    # 4. No detection
    # --------------------------------------------------------

    if not detections:

        return {
            "status": "success",

            "image_dimensions": {
                "width": pil_img.width,
                "height": pil_img.height
            },

            "metadata": metadata,

            "anomalies_detected": 0,

            "detected_object": "none",

            "confidence": 0.0,

            "message": "No underwater object detected",

            "anomaly": None
        }


    # --------------------------------------------------------
    # 5. Select highest-confidence detection
    # --------------------------------------------------------

    best_detection = max(
        detections,
        key=lambda x: x["confidence"]
    )


    class_name = best_detection["class_name"]
    confidence = best_detection["confidence"]


    # --------------------------------------------------------
    # 6. Singular output
    # --------------------------------------------------------

    return {

        "status": "success",

        "image_dimensions": {
            "width": pil_img.width,
            "height": pil_img.height
        },

        "metadata": metadata,

        "anomalies_detected": len(detections),

        "detected_object": class_name,

        "confidence": round(
            confidence * 100,
            2
        ),

        "message": (
            f"{class_name.replace('_', ' ').title()} detected"
        ),

        "anomaly": {
            "class_id": best_detection["class_id"],

            "class_name": class_name,

            "confidence": round(
                confidence,
                4
            ),

            "bbox": best_detection["bbox"]
        }
    }