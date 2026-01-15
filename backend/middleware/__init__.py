"""
Middleware package initialization
"""

from backend.middleware.auth_middleware import get_current_user, get_current_user_optional
from backend.middleware.error_handler import (
    AppException,
    DatabaseException,
    AuthenticationException,
    AuthorizationException
)
from backend.middleware.cors import setup_cors

__all__ = [
    "get_current_user",
    "get_current_user_optional",
    "AppException",
    "DatabaseException",
    "AuthenticationException",
    "AuthorizationException",
    "setup_cors"
]
