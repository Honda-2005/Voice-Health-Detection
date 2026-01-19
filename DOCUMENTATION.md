# Voice Health Detection: System Reference Manual

## 1. System Architecture
The **Voice Health Detection** system is designed as a **Service-Oriented Architecture (SOA)** with a clear separation of concerns between the user-facing interface, the business logic API, and the data processing pipeline.

### High-Level Architecture
1.  **Frontend (Client Layer)**: A Single Page Application (SPA) built with Vanilla JavaScript and Webpack. It handles user interaction, form input, and displays analysis results.
2.  **Backend (API Layer)**: A high-performance Asynchronous API built with **FastAPI**. It manages:
    -   **Authentication**: JWT-based security.
    -   **User Management**: CRUD operations for user profiles.
    -   **Data Access**: Interface to MongoDB.
3.  **Data Layer (Storage)**:
    -   **MongoDB**: NoSQL database storing:
        -   `users`: User credentials and profiles.
        -   `voice_reference_data`: Processed vectors from the Parkinson's dataset.
    -   **File System**: Stores raw audio uploads (temporary) and ML model artifacts (`.pkl` files).
4.  **ML Pipeline (Engine)**: A dedicated Python module (`ml_training`) that operates on the data to train screening models.

---

## 2. Database Schema Design (MongoDB)

### Collection: `users`
primary collection for storing user identity and profile information.
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Unique identifier. |
| `email` | String | Yes | Unique email address. |
| `hashed_password` | String | Yes | Bcrypt hashed password. |
| `full_name` | String | Yes | User's legal name. |
| `age` | Integer | No | Patient age (relevant for risk factors). |
| `gender` | String | No | 'male', 'female', or 'other'. |
| `created_at` | DateTime | Yes | Account creation timestamp. |

### Collection: `voice_reference_data`
Stores the clean, normalized acoustic features from the research dataset (e.g., from UCI).
| Field | Type | Description |
| :--- | :--- | :--- |
| `subject_id` | Integer | ID of the subject in the study. |
| `age` | Integer | Subject's age. |
| `features` | Object | Dictionary of acoustic features (jitter, shimmer, etc.). |
| `status` | Boolean | `1` = Parkinson's, `0` = Healthy. |
| `dataset_source` | String | Origin of data (e.g., "UCI"). |

---

## 3. API Contract & Specification

### Base URL: `http://localhost:8000/api/v1`

### Module: Authentication (`/auth`)
**1. Register User**
-   **Endpoint**: `POST /auth/register`
-   **Header**: `Content-Type: application/json`
-   **Payload**:
    ```json
    {
      "email": "user@example.com",
      "password": "Password123!",
      "full_name": "John Doe"
    }
    ```
-   **Response (201 Created)**:
    ```json
    {
      "access_token": "eyJhbG...",
      "token_type": "bearer",
      "user": { ... }
    }
    ```

**2. Login User**
-   **Endpoint**: `POST /auth/login`
-   **Payload**:
    ```json
    {
      "email": "user@example.com",
      "password": "Password123!"
    }
    ```
-   **Response (200 OK)**: Returns Access Token + User Info.

### Module: Profile (`/profile`)
*Requires Header*: `Authorization: Bearer <access_token>`

**1. Get Current Profile**
-   **Endpoint**: `GET /profile`
-   **Response**: Returns full user object (excluding password).

**2. Update Profile**
-   **Endpoint**: `PUT /profile`
-   **Payload**: (Partial updates allowed)
    ```json
    {
      "age": 65,
      "phone": "+123456789"
    }
    ```

---

## 4. Machine Learning Implementation

The ML logic is isolated in the `ml_training/` directory to ensure the API remains lightweight.

### 4.1 Data Preprocessing (`preprocessing.py`)
Because raw acoustic data varies wildly in scale (e.g., *fundamental frequency* in Hz vs *shimmer* in %), we use **Standard Scaling**.
-   **Class**: `DataPreprocessor`
-   **Logic**:
    1.  **Ingest**: Loads data from MongoDB or fallback to local CSVs.
    2.  **Split**: Stratified Train/Test split (80/20) to maintain class balance.
    3.  **Fit**: Computes Mean and Variance on the **Training Set only**.
    4.  **Transform**: Applies `(x - mean) / std_dev` to specific features.
    5.  **Persist**: Saves the fitted `StandardScaler` to disk (`scaler.pkl`) so it can be used on new user recordings.

### 4.2 Feature Engineering (Planned)
The system will extract the following standard acoustic features from `.wav` files:
-   **MDVP:Fo(Hz)**: Average vocal fundamental frequency.
-   **MDVP:Jitter(%)**: Measure of frequency variation.
-   **MDVP:Shimmer**: Measure of amplitude variation.
-   **HNR**: Harmonics-to-Noise Ratio.

---

## 5. Development Guide

### Folder Structure Legend
-   **`backend/app/main.py`**: The entry point. Defines the `FastAPI` app and lifecycle events (DB connect/close).
-   **`backend/middleware/`**: Interceptors.
    -   `cors.py`: Whitelists the frontend URL (`localhost:8080`) to allow browser requests.
    -   `auth_middleware.py`: Decodes JWTs and injects the `current_user` into route handlers.
-   **`backend/utils/`**: Helper functions (e.g., hashing logic).

### How to Run Locally
1.  **Start Database**: `mongod --dbpath /data/db`
2.  **Start Backend**:
    ```bash
    cd backend
    uvicorn main:app --reload
    ```
3.  **Start Frontend**:
    ```bash
    cd voice-health-frontend
    npm start
    ```

---

## 6. Security & Best Practices
-   **Passwords**: Never stored in plain text. We use `bcrypt` (via `passlib`) which is currently the industry standard for password hashing.
-   **Tokens**: JWTs are signed with a secret key (`HS256`). They are stateless, meaning the backend doesn't need to query the DB to validate the *format* of the token, only the *user existence* if strictly needed.
-   **Env Variables**: Secrets are loaded from `.env` (using `python-dotenv`) to prevent specific credentials from being committed to Git.
