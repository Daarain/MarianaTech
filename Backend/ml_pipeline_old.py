import cv2
import numpy as np
import io
import math
from typing import List, Dict, Any, Tuple
from PIL import Image

CLASSES = [
    "unidentified_object",
    "shipwreck",
    "marine_life_cluster",
    "debris_field",
    "geological_formation",
    "pipeline_damage",
    "mine_like_contact"
]

def preprocess_sonar_image(image_np: np.ndarray) -> Tuple[np.ndarray, Dict[str, float]]:
    """
    Applies speckle noise reduction and contrast enhancement (CLAHE) on Side-Scan Sonar imagery.
    """
    if len(image_np.shape) == 3:
        gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY)
    else:
        gray = image_np.copy()

    # Calculate raw noise metrics (Signal-to-Noise Ratio)
    mean_val = np.mean(gray)
    std_val = np.std(gray)
    raw_snr = float(mean_val / (std_val + 1e-5))

    # 1. Speckle Noise Reduction using Bilateral Filter & Median Blur
    denoised = cv2.bilateralFilter(gray, d=7, sigmaColor=75, sigmaSpace=75)
    denoised = cv2.medianBlur(denoised, 3)

    # 2. Adaptive Histogram Equalization (CLAHE) for Acoustic Contrast
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)

    metrics = {
        "raw_snr": round(raw_snr, 2),
        "mean_intensity": round(float(mean_val), 1),
        "std_intensity": round(float(std_val), 1),
        "noise_reduction_factor": round(float(np.std(enhanced) / (std_val + 1e-5)), 2)
    }

    return enhanced, metrics

def analyze_anomaly(contour: np.ndarray, gray_img: np.ndarray, img_w: int, img_h: int) -> Dict[str, Any]:
    """
    Extracts geometric & acoustic shadow features to classify sonar contacts and compute confidence score.
    """
    x, y, w, h = cv2.boundingRect(contour)
    area = cv2.contourArea(contour)
    perimeter = cv2.arcLength(contour, True)

    aspect_ratio = float(w) / float(h) if h > 0 else 1.0
    circularity = (4 * math.pi * area) / (perimeter * perimeter) if perimeter > 0 else 0.0

    # Extract Region of Interest (ROI)
    roi = gray_img[y:y+h, x:x+w]
    if roi.size == 0:
        mean_roi = 128.0
        std_roi = 10.0
    else:
        mean_roi = float(np.mean(roi))
        std_roi = float(np.std(roi))

    # Acoustic shadow analysis: sample region adjacent to the highlight
    shadow_y2 = min(img_h, y + h + int(h * 0.5))
    shadow_roi = gray_img[y+h:shadow_y2, x:x+w]
    has_acoustic_shadow = False
    if shadow_roi.size > 0 and np.mean(shadow_roi) < (mean_roi * 0.6):
        has_acoustic_shadow = True

    # Rule-based Classification based on Sonar Acoustic Signatures
    if aspect_ratio > 3.0 or aspect_ratio < 0.33:
        cls_name = "pipeline_damage"
        priority = "critical"
    elif area > (img_w * img_h * 0.05):
        cls_name = "shipwreck"
        priority = "high"
    elif circularity > 0.65 and has_acoustic_shadow:
        cls_name = "mine_like_contact"
        priority = "critical"
    elif area > 500 and circularity < 0.35:
        cls_name = "debris_field"
        priority = "medium"
    elif std_roi < 15.0 and not has_acoustic_shadow:
        cls_name = "marine_life_cluster"
        priority = "low"
    elif circularity < 0.25 and std_roi > 35.0:
        cls_name = "geological_formation"
        priority = "low"
    else:
        cls_name = "unidentified_object"
        priority = "high"

    # Confidence Score Calculation based on Signal contrast, shadow, and shape clarity
    contrast = (mean_roi - np.mean(gray_img)) / 255.0
    confidence = 0.50 + (0.25 * min(1.0, max(0.0, contrast))) + (0.15 if has_acoustic_shadow else 0.0) + (0.10 * min(1.0, circularity))
    confidence = float(round(min(0.98, max(0.40, confidence)), 2))

    # Convert coordinates to percentages relative to image dimensions
    rel_x = float(round((x / img_w) * 100, 2))
    rel_y = float(round((y / img_h) * 100, 2))
    rel_w = float(round((w / img_w) * 100, 2))
    rel_h = float(round((h / img_h) * 100, 2))

    size_m = float(round(math.sqrt(area) * 0.1, 1))

    return {
        "class_name": cls_name,
        "confidence": confidence,
        "priority": priority,
        "bbox": {"x": rel_x, "y": rel_y, "w": rel_w, "h": rel_h},
        "area_px": int(area),
        "size_m": max(1.0, size_m),
        "has_acoustic_shadow": bool(has_acoustic_shadow),
        "aspect_ratio": float(round(aspect_ratio, 2)),
        "circularity": float(round(circularity, 2)),
        "description": f"Sonar contact ({cls_name.replace('_', ' ')}) detected with acoustic return contrast {round(float(contrast), 2)}."
    }

def extract_image_metadata(pil_img: Image.Image) -> Dict[str, Any]:
    """
    Extracts image metadata (resolution, color space, EXIF if available).
    """
    metadata = {
        "format": pil_img.format or "UNKNOWN",
        "mode": pil_img.mode,
        "width": pil_img.width,
        "height": pil_img.height,
        "aspect_ratio": round(float(pil_img.width) / float(pil_img.height), 2) if pil_img.height > 0 else 1.0,
        "has_exif": False,
        "exif_data": {}
    }
    
    try:
        exif = pil_img.getexif()
        if exif:
            metadata["has_exif"] = True
            for tag_id, value in exif.items():
                metadata["exif_data"][str(tag_id)] = str(value)[:50]
    except Exception:
        pass
        
    return metadata

def run_pipeline(image_bytes: bytes, base_lat: float = -6.3, base_lon: float = 71.2) -> Dict[str, Any]:
    """
    Executes full End-to-End ML Pipeline on uploaded Sonar Image:
    Preprocessing -> Anomaly Detection -> Feature Extraction -> Geotagging -> Output Formatting
    """
    try:
        pil_img = Image.open(io.BytesIO(image_bytes))
        metadata = extract_image_metadata(pil_img)
        image_np = np.array(pil_img)
    except Exception as e:
        raise ValueError(f"Corrupted or invalid image file: {str(e)}")
    
    if image_np.size == 0 or len(image_np.shape) < 2:
        raise ValueError("Image array is empty or unreadable.")

    img_h, img_w = image_np.shape[:2]

    # Preprocessing
    enhanced_img, prep_metrics = preprocess_sonar_image(image_np)

    # Check if image is homogeneous / solid background (e.g. solid black or white)
    if prep_metrics["std_intensity"] < 3.0:
        # Zero detections for solid/homogeneous images
        return {
            "status": "success",
            "image_dimensions": {"width": img_w, "height": img_h},
            "metadata": metadata,
            "preprocessing_metrics": prep_metrics,
            "anomalies_detected": 0,
            "anomalies": []
        }

    # Combined Otsu & Adaptive Thresholding for High Contrast Sonar Contact Detection
    blur = cv2.GaussianBlur(enhanced_img, (5, 5), 0)
    _, otsu_thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    adap_thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    thresh = cv2.bitwise_or(otsu_thresh, adap_thresh)

    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    anomalies = []
    min_area = (img_w * img_h) * 0.0005  # filter noise contours smaller than 0.05% of image
    max_area = (img_w * img_h) * 0.45    # filter background artifacts

    anom_idx = 1
    for c in contours:
        area = cv2.contourArea(c)
        if min_area <= area <= max_area:
            analysis = analyze_anomaly(c, enhanced_img, img_w, img_h)

            # Geotagging calculation based on center of bounding box relative to base lat/lon
            rel_x = analysis["bbox"]["x"] / 100.0
            rel_y = analysis["bbox"]["y"] / 100.0
            lat = float(round(base_lat + (0.5 - rel_y) * 0.05, 4))
            lon = float(round(base_lon + (rel_x - 0.5) * 0.05, 4))

            anomalies.append({
                "id": f"ANM-AUTO-{String_pad(anom_idx)}",
                "class_name": analysis["class_name"],
                "confidence": analysis["confidence"],
                "priority": analysis["priority"],
                "latitude": lat,
                "longitude": lon,
                "status": "pending_review",
                "depth_m": 4180,
                "size_m": analysis["size_m"],
                "bbox": analysis["bbox"],
                "has_acoustic_shadow": analysis["has_acoustic_shadow"],
                "description": analysis["description"]
            })
            anom_idx += 1

    return {
        "status": "success",
        "image_dimensions": {"width": img_w, "height": img_h},
        "metadata": metadata,
        "preprocessing_metrics": prep_metrics,
        "anomalies_detected": len(anomalies),
        "anomalies": anomalies
    }

def String_pad(idx: int) -> str:
    return str(idx).zfill(3)

