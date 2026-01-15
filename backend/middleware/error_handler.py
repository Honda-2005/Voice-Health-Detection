"""
Error Handler Middleware - Centralized error handling for the application
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pymongo.errors import PyMongoError
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AppException(Exception):
    """Base exception class for application errors"""
    
    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class DatabaseException(AppException):
    """Exception for database errors"""
    
    def __init__(self, message: str = "Database error occurred"):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR)


class AuthenticationException(AppException):
    """Exception for authentication errors"""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED)


class AuthorizationException(AppException):
    """Exception for authorization errors"""
    
    def __init__(self, message: str = "Not authorized"):
        super().__init__(message, status.HTTP_403_FORBIDDEN)


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handle validation errors from Pydantic models
    
    Args:
        request: The request object
        exc: The validation exception
        
    Returns:
        JSON response with validation errors
    """
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        message = error["msg"]
        errors.append({
            "field": field,
            "message": message
        })
    
    logger.warning(f"Validation error on {request.url.path}: {errors}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "detail": "Invalid input data",
            "errors": errors
        }
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Handle HTTP exceptions
    
    Args:
        request: The request object
        exc: The HTTP exception
        
    Returns:
        JSON response with error details
    """
    logger.warning(f"HTTP {exc.status_code} error on {request.url.path}: {exc.detail}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.__class__.__name__,
            "detail": exc.detail
        }
    )


async def app_exception_handler(request: Request, exc: AppException):
    """
    Handle custom application exceptions
    
    Args:
        request: The request object
        exc: The application exception
        
    Returns:
        JSON response with error details
    """
    logger.error(f"Application error on {request.url.path}: {exc.message}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.__class__.__name__,
            "detail": exc.message
        }
    )


async def database_exception_handler(request: Request, exc: PyMongoError):
    """
    Handle database errors
    
    Args:
        request: The request object
        exc: The database exception
        
    Returns:
        JSON response with error details
    """
    logger.error(f"Database error on {request.url.path}: {str(exc)}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "DatabaseError",
            "detail": "A database error occurred. Please try again later."
        }
    )


async def general_exception_handler(request: Request, exc: Exception):
    """
    Handle all other unhandled exceptions
    
    Args:
        request: The request object
        exc: The exception
        
    Returns:
        JSON response with error details
    """
    logger.error(f"Unhandled error on {request.url.path}: {str(exc)}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "detail": "An unexpected error occurred. Please try again later."
        }
    )


def add_exception_handlers(app):
    """
    Add all exception handlers to the FastAPI app
    
    Args:
        app: FastAPI application instance
    """
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(PyMongoError, database_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
