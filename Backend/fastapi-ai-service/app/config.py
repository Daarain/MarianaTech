import os

class AIServiceConfig:
    SERVICE_NAME: str = "MarianaTech AI/ML Service"
    VERSION: str = "2.1.0"
    MODEL_NAME: str = "YOLOv8x-Sonar"
    CONFIDENCE_THRESHOLD: float = 0.50
    TILE_SIZE: int = 512
    DEFAULT_BATCH_SIZE: int = 16

settings = AIServiceConfig()
