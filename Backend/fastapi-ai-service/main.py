from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.router import router as sonar_router

app = FastAPI(
    title=settings.SERVICE_NAME,
    version=settings.VERSION,
    description="Dedicated AI/ML Service for Sonar Preprocessing, YOLO Inference, Segmentation, and Anomaly Scoring",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sonar_router)

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": settings.SERVICE_NAME,
        "version": settings.VERSION,
        "model": settings.MODEL_NAME,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
