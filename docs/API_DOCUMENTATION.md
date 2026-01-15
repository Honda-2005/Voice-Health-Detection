# API Documentation
Voice Health Detection - Person 1: Authentication & User Management

## Base URL

```
Development: http://localhost:8000/api/v1
Production: https://your-domain.com/api/v1
```

## Authentication

Most endpoints require authentication via JWT Bearer tokens.

**Header Format:**
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints Overview

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/login` | No | User login |
| POST | `/auth/logout` | Yes | User logout |
| GET | `/auth/me` | Yes | Get current user |
| GET | `/profile` | Yes | Get user profile |
| PUT | `/profile` | Yes | Update user profile |
| DELETE | `/profile` | Yes | Delete user account |

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /api/v1/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "full_name": "John Doe"
}
```

**Validation Rules:**
- `email`: Valid email format, unique
- `password`: Minimum 8 characters, must contain uppercase, lowercase, and digit
- `full_name`: 2-100 characters

**Success Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone": null,
    "age": null,
    "gender": null,
    "created_at": "2026-01-16T00:00:00",
    "updated_at": "2026-01-16T00:00:00"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error Responses:**

`400 Bad Request` - Email already registered
```json
{
  "detail": "Email already registered"
}
```

`422 Unprocessable Entity` - Validation error
```json
{
  "error": "Validation Error",
  "detail": "Invalid input data",
  "errors": [
    {
      "field": "password",
      "message": "Password must contain at least one digit"
    }
  ]
}
```

---

### Login

Authenticate a user and receive an access token.

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response:** `200 OK`
```json
{
  "message": "Login successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone": null,
    "age": null,
    "gender": null,
    "created_at": "2026-01-16T00:00:00",
    "updated_at": "2026-01-16T00:00:00"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error Response:** `401 Unauthorized`
```json
{
  "detail": "Invalid email or password"
}
```

---

### Logout

Logout the current user (client should remove token).

**Endpoint:** `POST /api/v1/auth/logout`

**Authentication:** Required

**Request Body:** None

**Success Response:** `200 OK`
```json
{
  "message": "Logout successful. Please remove the token from client storage."
}
```

**Error Response:** `401 Unauthorized`
```json
{
  "detail": "Invalid or expired token"
}
```

---

### Get Current User

Retrieve information about the currently authenticated user.

**Endpoint:** `GET /api/v1/auth/me`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "age": 30,
  "gender": "male",
  "created_at": "2026-01-16T00:00:00",
  "updated_at": "2026-01-16T00:00:00"
}
```

**Error Response:** `401 Unauthorized`
```json
{
  "detail": "Invalid or expired token"
}
```

---

## Profile Management Endpoints

### Get Profile

Get the authenticated user's profile.

**Endpoint:** `GET /api/v1/profile`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "age": 30,
  "gender": "male",
  "created_at": "2026-01-16T00:00:00",
  "updated_at": "2026-01-16T00:00:00"
}
```

---

### Update Profile

Update the authenticated user's profile information.

**Endpoint:** `PUT /api/v1/profile`

**Authentication:** Required

**Request Body:** (All fields optional)
```json
{
  "full_name": "John Smith",
  "phone": "+1234567890",
  "age": 31,
  "gender": "male"
}
```

**Field Constraints:**
- `full_name`: 2-100 characters
- `phone`: Valid phone number format
- `age`: 0-150
- `gender`: One of: "male", "female", "other"

**Success Response:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "full_name": "John Smith",
  "phone": "+1234567890",
  "age": 31,
  "gender": "male",
  "created_at": "2026-01-16T00:00:00",
  "updated_at": "2026-01-16T01:30:00"
}
```

**Error Responses:**

`400 Bad Request` - No data provided
```json
{
  "detail": "No data provided for update"
}
```

`422 Unprocessable Entity` - Invalid data
```json
{
  "error": "Validation Error",
  "detail": "Invalid input data",
  "errors": [
    {
      "field": "age",
      "message": "Age must be between 0 and 150"
    }
  ]
}
```

---

### Delete Account

Permanently delete the authenticated user's account.

**Endpoint:** `DELETE /api/v1/profile`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "message": "Account deleted successfully"
}
```

**Error Response:** `500 Internal Server Error`
```json
{
  "detail": "Failed to delete account"
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created (registration successful) |
| 400 | Bad Request (validation failed, duplicate email) |
| 401 | Unauthorized (invalid credentials or token) |
| 403 | Forbidden (missing authorization header) |
| 404 | Not Found (resource doesn't exist) |
| 422 | Unprocessable Entity (validation error) |
| 500 | Internal Server Error |

---

## Common Patterns

### Making Authenticated Requests

**JavaScript Example:**
```javascript
const token = localStorage.getItem('authToken');

fetch('http://localhost:8000/api/v1/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

**Python Example:**
```python
import requests

token = "your_jwt_token_here"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

response = requests.get(
    "http://localhost:8000/api/v1/profile",
    headers=headers
)
print(response.json())
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/api/v1/profile" \
  -H "Authorization: Bearer your_jwt_token_here" \
  -H "Content-Type: application/json"
```

---

## Rate Limiting

Currently, there are no rate limits implemented. This is planned for future releases.

**Recommended client-side practices:**
- Implement exponential backoff for retries
- Cache responses when appropriate
- Avoid unnecessary repeated requests

---

## Pagination

Profile endpoints do not currently support pagination as they return single user data.

For future list endpoints (e.g., viewing prediction history), pagination will follow this format:

```json
{
  "items": [...],
  "pagination": {
    "current_page": 1,
    "page_size": 10,
    "total_items": 50,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## CORS Configuration

The API supports CORS for the following origins (configurable via `.env`):
- `http://localhost:3000`
- `http://localhost:8000`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:8000`

**Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS  
**Allowed Headers:** All headers

---

## Testing the API

### Using Swagger UI

Visit `http://localhost:8000/api/docs` for interactive API documentation where you can:
1. View all endpoints
2. Test requests directly from the browser
3. See request/response schemas
4. Authenticate using the "Authorize" button

### Using ReDoc

Visit `http://localhost:8000/api/redoc` for a clean, readable API reference.

### Using Postman

1. Create a new collection
2. Set base URL: `http://localhost:8000/api/v1`
3. For authenticated requests:
   - Add Header: `Authorization: Bearer {{token}}`
   - Set `{{token}}` variable after login

---

## JWT Token Structure

Tokens are signed using HS256 algorithm and contain:

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "user_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "exp": 1705363200
}
```

**Expiration:** 24 hours (1440 minutes) by default

---

## Security Best Practices

### For Client Developers

1. **Store tokens securely**
   - Use `localStorage` for web apps
   - Use secure storage for mobile apps
   - Never store in cookies without HttpOnly flag

2. **Handle token expiration**
   - Check for 401 responses
   - Redirect to login when token expires
   - Implement token refresh (future feature)

3. **Protect sensitive data**
   - Never log tokens in production
   - Use HTTPS in production
   - Validate all user inputs

4. **Handle errors gracefully**
   - Show user-friendly error messages
   - Don't expose technical details to users
   - Log errors for debugging

---

## Integration with Person 2

Person 2 can use the authentication system by:

1. **Importing the auth middleware:**
```python
from backend.middleware.auth_middleware import get_current_user
from fastapi import Depends

@router.post("/predict")
async def predict_disease(
    audio_file: UploadFile,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    # Use user_id for personalized predictions
    ...
```

2. **Accessing user data:**
```python
user_email = current_user["email"]
user_name = current_user["full_name"]
```

---

## Changelog

### Version 1.0.0 (2026-01-16)

**Initial Release - Person 1 Implementation**

- ✅ User registration with email verification
- ✅ JWT-based authentication
- ✅ Secure password hashing (bcrypt)
- ✅ User profile management (view, update, delete)
- ✅ Protected endpoints with middleware
- ✅ Comprehensive error handling
- ✅ Input validation
- ✅ CORS support
- ✅ API documentation

---

## Support & Contact

**Person 1 - Authentication & User Management Team**

- API Documentation: `http://localhost:8000/api/docs`
- Repository: Voice-Health-Detection
- Issues: Contact project maintainers

---

**Last Updated:** 2026-01-16  
**API Version:** 1.0.0  
**Maintained by:** Person 1 Team
