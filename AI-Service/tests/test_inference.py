import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "marianatech-ai-service"

def test_internal_inference():
    payload = {
        "jobId": "JOB-TEST-001",
        "missionId": "MSN-TEST-001",
        "inputReference": "test_sonar_data_ref",
        "modelVersion": "v1.0.0",
        "configuration": {}
    }
    response = client.post("/internal/inference", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["jobId"] == "JOB-TEST-001"
    assert data["status"] == "completed"
    assert "quality" in data
    assert "anomalies" in data
    assert len(data["anomalies"]) > 0
    assert data["anomalies"][0]["className"] in [
        "unidentified_object",
        "shipwreck",
        "marine_life_cluster",
        "debris_field",
        "geological_formation",
        "pipeline_damage",
        "mine_like_contact",
    ]
