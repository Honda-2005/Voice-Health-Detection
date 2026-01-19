"""
Authentication Integration Tests
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


class TestAuthProtection:
    """Test JWT authentication on protected endpoints"""
    
    def test_recordings_endpoint_requires_jwt(self):
        """Test that recordings submit requires authentication"""
        response = client.post("/api/recordings/submit")
        assert response.status_code == 401  # Unauthorized
    
    def test_history_endpoint_requires_jwt(self):
        """Test that history endpoint requires authentication"""
        response = client.get("/api/history")
        assert response.status_code == 401  # Unauthorized
    
    def test_results_endpoint_requires_jwt(self):
        """Test that results endpoint requires authentication"""
        response = client.get("/api/results/test123")
        assert response.status_code == 401  # Unauthorized
    
    def test_evaluation_endpoint_requires_jwt(self):
        """Test that evaluation endpoint requires authentication"""
        response = client.get("/api/evaluation/")
        assert response.status_code == 401  # Unauthorized
    
    def test_profile_endpoint_requires_jwt(self):
        """Test that profile endpoint requires authentication"""
        response = client.get("/api/profile/")
        assert response.status_code == 401  # Unauthorized


class TestRegistrationAndLogin:
    """Test user registration and login flow"""
    
    @pytest.mark.skip(reason="Requires MongoDB connection")
    def test_user_registration_success(self):
        """Test successful user registration"""
        user_data = {
            "email": "test@example.com",
            "fullName": "Test User",
            "password": "TestPassword123!",
            "termsAgree": True,
            "privacyAgree": True
        }
        response = client.post("/api/auth/register", json=user_data)
        assert response.status_code == 200
        assert "userId" in response.json()
    
    @pytest.mark.skip(reason="Requires MongoDB connection")
    def test_user_login_success(self):
        """Test successful user login"""
        login_data = {
            "email": "test@example.com",
            "password": "TestPassword123!"
        }
        response = client.post("/api/auth/login", json=login_data)
        assert response.status_code == 200
        assert "token" in response.json()


# Run tests with: pytest backend/tests/test_auth.py -v
