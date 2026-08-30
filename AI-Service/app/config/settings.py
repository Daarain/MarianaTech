from pydantic import ConfigDict
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    SERVICE_NAME: str = "marianatech-ai-service"
    VERSION: str = "1.0.0"
    MODEL_VERSION: str = "YOLOv8-sonar-v1.0.0"
    CONFIDENCE_THRESHOLD: float = 0.75

    model_config = ConfigDict(env_file=".env", extra="ignore")

settings = Settings()
