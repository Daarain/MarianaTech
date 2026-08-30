import time
from fastapi import APIRouter, HTTPException
from .schemas import (
    AIProcessRequest,
    AIProcessResponse,
    ProcessingMetrics,
    QualityAssessmentRequest,
    QualityAssessmentResponse,
)
from .preprocessor import preprocessor
from .quality import quality_analyzer
from .inference import yolo_engine

router = APIRouter(prefix="/api/v1/sonar", tags=["Sonar AI"])

@router.post("/process", response_model=AIProcessResponse)
async def process_sonar(request: AIProcessRequest):
    """
    Asynchronous AI inference pipeline:
    1. Preprocesses raw sonar acoustic pings
    2. Calculates sonar quality and Signal-to-Noise Ratio (SNR)
    3. Runs YOLO model object detection, segmentation, and natural vs artificial classification
    4. Computes confidence scores and anomaly priorities
    """
    try:
        start_time = time.time()

        # Step 1: Preprocessing
        prep_info = preprocessor.preprocess_acoustic_data(request.file_path or "default.xtf")

        # Step 2: Quality Assessment
        qual_info = quality_analyzer.assess_quality(request.file_path or "default.xtf", request.sonar_type or "Side-scan")

        # Step 3 & 4: YOLO Inference & Anomaly Scoring
        anomalies = yolo_engine.run_inference(
            mission_id=request.mission_id,
            file_path=request.file_path,
            depth_min=request.depth_min or 4100,
            depth_max=request.depth_max or 4250,
        )

        duration = round(time.time() - start_time, 2)

        return AIProcessResponse(
            job_id=request.job_id,
            status="completed",
            processing_metrics=ProcessingMetrics(
                sonar_quality_score=qual_info["quality_score"],
                tiles_processed=prep_info["estimated_tiles"],
                duration_seconds=duration,
            ),
            anomalies_detected=anomalies,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/assess-quality", response_model=QualityAssessmentResponse)
async def assess_sonar_quality(request: QualityAssessmentRequest):
    res = quality_analyzer.assess_quality(request.file_path, request.sonar_type or "Side-scan")
    return QualityAssessmentResponse(**res)
