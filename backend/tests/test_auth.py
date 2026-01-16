"""
Authentication Tests - Comprehensive test suite for authentication endpoints
"""

import pytest
from httpx import AsyncClient
from fastapi import status
from backend.main import app
from backend.database.mongodb import MongoDB
import os
from dotenv import load_dotenv

load_dotenv()

# Test user data
TEST_USER = {
    "email": "test@example.com",
    "password": "Test123456",
    "full_name": "Test User"
}

TEST_USER_2 = {
    "email": "test2@example.com",
    "password": "Test789012",
    "full_name": "Test User 2"
}


@pytest.fixture(scope="module")
async def test_client():
    """Create test client"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture(autouse=True)
async def setup_database():
    """Setup and teardown database for each test"""
    # Connect to test database
    await MongoDB.connect_to_database()
    
    yield
    
    # Cleanup: Remove test users after each test
    from backend.database.mongodb import get_users_collection
    users = get_users_collection()
    await users.delete_many({"email": {"$in": [TEST_USER["email"], TEST_USER_2["email"]]}})


class TestUserRegistration:
    """Tests for user registration endpoint"""
    
    @pytest.mark.asyncio
    async def test_register_success(self, test_client):
        """Test successful user registration"""
        response = await test_client.post(
            "/api/v1/auth/register",
            json=TEST_USER
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["message"] == "User registered successfully"
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == TEST_USER["email"]
        assert data["user"]["full_name"] == TEST_USER["full_name"]
        assert "id" in data["user"] or "_id" in data["user"]
    
    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, test_client):
        """Test registration with duplicate email"""
        # Register first user
        await test_client.post("/api/v1/auth/register", json=TEST_USER)
        
        # Try to register again with same email
        response = await test_client.post(
            "/api/v1/auth/register",
            json=TEST_USER
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already registered" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_register_invalid_email(self, test_client):
        """Test registration with invalid email format"""
        invalid_user = TEST_USER.copy()
        invalid_user["email"] = "invalid-email"
        
        response = await test_client.post(
            "/api/v1/auth/register",
            json=invalid_user
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    @pytest.mark.asyncio
    async def test_register_weak_password(self, test_client):
        """Test registration with weak password"""
        weak_password_user = TEST_USER.copy()
        weak_password_user["email"] = "weak@example.com"
        weak_password_user["password"] = "weak"
        
        response = await test_client.post(
            "/api/v1/auth/register",
            json=weak_password_user
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    @pytest.mark.asyncio
    async def test_register_missing_fields(self, test_client):
        """Test registration with missing required fields"""
        incomplete_user = {"email": "incomplete@example.com"}
        
        response = await test_client.post(
            "/api/v1/auth/register",
            json=incomplete_user
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestUserLogin:
    """Tests for user login endpoint"""
    
    @pytest.mark.asyncio
    async def test_login_success(self, test_client):
        """Test successful login"""
        # Register user first
        await test_client.post("/api/v1/auth/register", json=TEST_USER)
        
        # Login
        response = await test_client.post(
            "/api/v1/auth/login",
            json={
                "email": TEST_USER["email"],
                "password": TEST_USER["password"]
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["message"] == "Login successful"
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == TEST_USER["email"]
    
    @pytest.mark.asyncio
    async def test_login_wrong_password(self, test_client):
        """Test login with wrong password"""
        # Register user first
        await test_client.post("/api/v1/auth/register", json=TEST_USER)
        
        # Try to login with wrong password
        response = await test_client.post(
            "/api/v1/auth/login",
            json={
                "email": TEST_USER["email"],
                "password": "WrongPassword123"
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "invalid" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, test_client):
        """Test login with non-existent user"""
        response = await test_client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "Password123"
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestProtectedEndpoints:
    """Tests for protected endpoints"""
    
    @pytest.mark.asyncio
    async def test_get_current_user_success(self, test_client):
        """Test getting current user with valid token"""
        # Register and get token
        register_response = await test_client.post(
            "/api/v1/auth/register",
            json=TEST_USER
        )
        token = register_response.json()["access_token"]
        
        # Get current user
        response = await test_client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == TEST_USER["email"]
        assert data["full_name"] == TEST_USER["full_name"]
    
    @pytest.mark.asyncio
    async def test_get_current_user_no_token(self, test_client):
        """Test getting current user without token"""
        response = await test_client.get("/api/v1/auth/me")
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self, test_client):
        """Test getting current user with invalid token"""
        response = await test_client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestLogout:
    """Tests for logout endpoint"""
    
    @pytest.mark.asyncio
    async def test_logout_success(self, test_client):
        """Test successful logout"""
        # Register and get token
        register_response = await test_client.post(
            "/api/v1/auth/register",
            json=TEST_USER
        )
        token = register_response.json()["access_token"]
        
        # Logout
        response = await test_client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert "logout successful" in response.json()["message"].lower()


class TestTokenValidation:
    """Tests for JWT token validation"""
    
    @pytest.mark.asyncio
    async def test_token_in_response(self, test_client):
        """Test that token is included in registration and login responses"""
        # Test registration
        register_response = await test_client.post(
            "/api/v1/auth/register",
            json=TEST_USER
        )
        assert "access_token" in register_response.json()
        
        # Test login
        login_response = await test_client.post(
            "/api/v1/auth/login",
            json={
                "email": TEST_USER["email"],
                "password": TEST_USER["password"]
            }
        )
        assert "access_token" in login_response.json()
    
    @pytest.mark.asyncio
    async def test_token_format(self, test_client):
        """Test that token is in correct format"""
        response = await test_client.post(
            "/api/v1/auth/register",
            json=TEST_USER
        )
        
        token = response.json()["access_token"]
        assert isinstance(token, str)
        assert len(token) > 0
        # JWT tokens typically have 3 parts separated by dots
        assert token.count('.') == 2
