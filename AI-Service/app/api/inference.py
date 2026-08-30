from fastapi import APIRouter, HTTPException, status
from app.schemas.inference import InferenceRequest, InferenceResponse
from app.pipeline.processor import pipeline_processor

router = APIRouter()

@router.post("/internal/inference", response_model=InferenceResponse, status_code=status.HTTP_200_OK)
def run_internal_inference(request: InferenceRequest) -> InferenceResponse:
    try:
        response = pipeline_processor.run_pipeline(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Pipeline execution error: {str(e)}"
        )
