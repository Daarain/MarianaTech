import unittest
import os
import io
import cv2
import numpy as np
from PIL import Image
from fastapi.testclient import TestClient

from main import app

class TestBackendPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        
        # Load real side-scan sonar image if available, else synthetic fallback
        test_img_path = os.path.join(os.path.dirname(__file__), "test_sonar.png")
        if os.path.exists(test_img_path):
            with open(test_img_path, "rb") as f:
                cls.valid_png_bytes = f.read()
        else:
            # 1. Create a synthetic valid multi-detection sonar image
            img = np.full((400, 600), 100, dtype=np.uint8)
            cv2.circle(img, (150, 150), 25, 240, -1)
            cv2.rectangle(img, (400, 250), (480, 280), 250, -1)
            pil_img = Image.fromarray(img)
            buf = io.BytesIO()
            pil_img.save(buf, format="PNG")
            cls.valid_png_bytes = buf.getvalue()

        # 2. Create a solid background image (zero detections)
        solid_img = np.full((300, 300), 128, dtype=np.uint8)
        pil_solid = Image.fromarray(solid_img)
        buf_solid = io.BytesIO()
        pil_solid.save(buf_solid, format="PNG")
        cls.solid_png_bytes = buf_solid.getvalue()

    def test_01_health_check(self):
        """Scenario 12: Health check endpoint verification"""
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertEqual(json_data["data"]["status"], "online")
        self.assertIn("MARIANATECH", json_data["data"]["system"])

    def test_02_mission_stats(self):
        """Scenario 12: Mission statistics endpoint verification"""
        response = self.client.get("/api/v1/missions/stats")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertIn("total_missions", json_data["data"])
        self.assertIn("pending_review", json_data["data"])

    def test_03_valid_image_inference(self):
        """Scenario 1 & 6: Valid Sonar image with multiple detections"""
        files = {"file": ("test_sonar.png", self.valid_png_bytes, "image/png")}
        data = {"latitude": -6.3, "longitude": 71.2}
        response = self.client.post("/api/v1/detect", files=files, data=data)
        
        self.assertEqual(response.status_code, 200)
        res = response.json()
        self.assertTrue(res["success"])
        
        pipeline_data = res["data"]
        self.assertEqual(pipeline_data["status"], "success")
        self.assertGreater(pipeline_data["anomalies_detected"], 0)
        self.assertIn("preprocessing_metrics", pipeline_data)
        self.assertIn("metadata", pipeline_data)

    def test_04_invalid_file_type(self):
        """Scenario 2: Plain text file upload rejected"""
        files = {"file": ("document.txt", b"This is a text file", "text/plain")}
        response = self.client.post("/api/v1/detect", files=files)
        
        self.assertEqual(response.status_code, 415)
        res = response.json()
        self.assertFalse(res["success"])
        self.assertEqual(res["error"]["code"], "HTTP_ERROR")
        self.assertIn("Unsupported file extension", res["error"]["message"])

    def test_05_unsupported_file_extension(self):
        """Scenario 3: PDF file upload rejected"""
        files = {"file": ("report.pdf", b"%PDF-1.5 fake pdf content", "application/pdf")}
        response = self.client.post("/api/v1/detect", files=files)
        
        self.assertEqual(response.status_code, 415)
        res = response.json()
        self.assertFalse(res["success"])
        self.assertIn(".pdf", res["error"]["message"])

    def test_06_corrupted_image(self):
        """Scenario 4: Corrupted PNG bytes"""
        files = {"file": ("corrupted.png", b"\x89PNG\x0d\x0a\x1a\x0aCORRUPTED_BYTES_HERE", "image/png")}
        response = self.client.post("/api/v1/detect", files=files)
        
        self.assertEqual(response.status_code, 422)
        res = response.json()
        self.assertFalse(res["success"])
        self.assertIn("Corrupted or invalid image", res["error"]["message"])

    def test_07_zero_detections_solid_image(self):
        """Scenario 5: Solid homogeneous background produces 0 detections"""
        files = {"file": ("solid.png", self.solid_png_bytes, "image/png")}
        response = self.client.post("/api/v1/detect", files=files)
        
        self.assertEqual(response.status_code, 200)
        res = response.json()
        self.assertTrue(res["success"])
        self.assertEqual(res["data"]["anomalies_detected"], 0)
        self.assertEqual(len(res["data"]["anomalies"]), 0)

    def test_08_confidence_values_bounds(self):
        """Scenario 7: Confidence score strictly bounded between 0.0 and 1.0"""
        files = {"file": ("test_sonar.png", self.valid_png_bytes, "image/png")}
        response = self.client.post("/api/v1/detect", files=files)
        res = response.json()
        
        anomalies = res["data"]["anomalies"]
        for a in anomalies:
            conf = a["confidence"]
            self.assertGreaterEqual(conf, 0.0)
            self.assertLessEqual(conf, 1.0)

    def test_09_metadata_extraction(self):
        """Scenario 8: Image metadata correctly extracted"""
        files = {"file": ("test_sonar.png", self.valid_png_bytes, "image/png")}
        response = self.client.post("/api/v1/detect", files=files)
        res = response.json()
        
        metadata = res["data"]["metadata"]
        self.assertIn(metadata["format"], ["PNG", "JPEG", "UNKNOWN"])
        self.assertGreater(metadata["width"], 0)
        self.assertGreater(metadata["height"], 0)

    def test_10_geospatial_coordinates(self):
        """Scenario 9: Coordinates Lat/Lon correctly associated with base coordinates"""
        files = {"file": ("test_sonar.png", self.valid_png_bytes, "image/png")}
        data = {"latitude": -12.3456, "longitude": 88.7654}
        response = self.client.post("/api/v1/detect", files=files, data=data)
        res = response.json()
        
        anomalies = res["data"]["anomalies"]
        for a in anomalies:
            self.assertIn("latitude", a)
            self.assertIn("longitude", a)
            # Should be close to the input base coordinates
            self.assertAlmostEqual(a["latitude"], -12.3456, delta=0.5)
            self.assertAlmostEqual(a["longitude"], 88.7654, delta=0.5)

    def test_11_json_report_download(self):
        """Scenario 10: JSON report download format"""
        response = self.client.get("/api/v1/missions/MSN-2026-0142/reports/download?format=json")
        self.assertEqual(response.status_code, 200)
        res = response.json()
        self.assertTrue(res["success"])
        self.assertEqual(res["data"]["mission_id"], "MSN-2026-0142")
        self.assertGreater(len(res["data"]["anomalies"]), 0)

    def test_12_csv_report_download(self):
        """Scenario 11: CSV report download format"""
        response = self.client.get("/api/v1/missions/MSN-2026-0142/reports/download?format=csv")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "text/csv; charset=utf-8")
        csv_text = response.text
        self.assertIn("Anomaly ID,Mission ID,Class Name", csv_text)
        self.assertIn("ANM-0142-001", csv_text)

    def test_13_analysis_history_list(self):
        """Phase 14: Analysis history listing & status filter"""
        response = self.client.get("/api/v1/analyses?status=completed")
        self.assertEqual(response.status_code, 200)
        res = response.json()
        self.assertTrue(res["success"])
        items = res["data"]["items"]
        self.assertGreater(len(items), 0)
        for item in items:
            self.assertEqual(item["status"], "completed")

    def test_14_analysis_stats(self):
        """Phase 14: Analysis statistics endpoint"""
        response = self.client.get("/api/v1/analyses/stats")
        self.assertEqual(response.status_code, 200)
        res = response.json()
        self.assertTrue(res["success"])
        data = res["data"]
        self.assertIn("total_analyses", data)
        self.assertIn("completed", data)
        self.assertIn("failed", data)

    def test_15_analysis_by_id(self):
        """Phase 14: Single analysis lookup by ID"""
        response = self.client.get("/api/v1/analyses/ANL-2026-0142")
        self.assertEqual(response.status_code, 200)
        res = response.json()
        self.assertTrue(res["success"])
        self.assertEqual(res["data"]["id"], "ANL-2026-0142")

    def test_16_analysis_deletion(self):
        """Phase 14: Analysis deletion endpoint"""
        response = self.client.delete("/api/v1/analyses/ANL-2026-0139")
        self.assertEqual(response.status_code, 200)
        res = response.json()
        self.assertTrue(res["success"])
        self.assertEqual(res["data"]["status"], "deleted")
        
        # Verify it can no longer be found
        get_res = self.client.get("/api/v1/analyses/ANL-2026-0139")
        self.assertEqual(get_res.status_code, 404)

    def test_17_detect_auto_persistence(self):
        """Phase 14: Inference automatically creates persistent analysis record"""
        files = {"file": ("test_sonar.png", self.valid_png_bytes, "image/png")}
        response = self.client.post("/api/v1/detect", files=files)
        self.assertEqual(response.status_code, 200)
        res = response.json()
        self.assertTrue(res["success"])
        self.assertIn("analysis_id", res["data"])
        
        # Verify analysis record exists in history
        analysis_id = res["data"]["analysis_id"]
        history_res = self.client.get(f"/api/v1/analyses/{analysis_id}")
        self.assertEqual(history_res.status_code, 200)
        self.assertEqual(history_res.json()["data"]["id"], analysis_id)

    def test_18_zero_byte_upload(self):
        """Phase 17: Zero-byte image upload rejected with 400 Bad Request"""
        files = {"file": ("empty.png", b"", "image/png")}
        response = self.client.post("/api/v1/detect", files=files)
        self.assertEqual(response.status_code, 400)
        res = response.json()
        self.assertFalse(res["success"])
        self.assertIn("empty", res["error"]["message"].lower())

    def test_19_oversized_file_upload(self):
        """Phase 17: Oversized image upload (>50MB) rejected with 413 Payload Too Large"""
        large_bytes = b"x" * (51 * 1024 * 1024)
        files = {"file": ("large.png", large_bytes, "image/png")}
        response = self.client.post("/api/v1/detect", files=files)
        self.assertEqual(response.status_code, 413)
        res = response.json()
        self.assertFalse(res["success"])
        self.assertIn("exceeds", res["error"]["message"].lower())

    def test_20_out_of_bounds_coordinates(self):
        """Phase 17: Out-of-bounds latitude/longitude rejected with 400 Bad Request"""
        files = {"file": ("test_sonar.png", self.valid_png_bytes, "image/png")}
        data = {"latitude": 150.0, "longitude": 71.2}
        response = self.client.post("/api/v1/detect", files=files, data=data)
        self.assertEqual(response.status_code, 400)
        res = response.json()
        self.assertFalse(res["success"])
        self.assertIn("latitude", res["error"]["message"].lower())

if __name__ == "__main__":
    unittest.main()


