"""
Input Validators - Utilities for validating user input
"""

import re
from typing import Optional
from fastapi import HTTPException, status


def validate_email(email: str) -> bool:
    """
    Validate email format
    
    Args:
        email: Email address to validate
        
    Returns:
        True if valid, False otherwise
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password_strength(password: str) -> tuple[bool, Optional[str]]:
    """
    Validate password strength
    
    Requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    
    Args:
        password: Password to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not any(char.isupper() for char in password):
        return False, "Password must contain at least one uppercase letter"
    
    if not any(char.islower() for char in password):
        return False, "Password must contain at least one lowercase letter"
    
    if not any(char.isdigit() for char in password):
        return False, "Password must contain at least one digit"
    
    return True, None


def validate_phone_number(phone: str) -> bool:
    """
    Validate phone number format
    
    Accepts various formats:
    - +1234567890
    - 123-456-7890
    - (123) 456-7890
    - 1234567890
    
    Args:
        phone: Phone number to validate
        
    Returns:
        True if valid, False otherwise
    """
    # Remove common formatting characters
    cleaned = re.sub(r'[\s\-\(\)\+]', '', phone)
    
    # Check if it's all digits and has appropriate length (10-15 digits)
    return cleaned.isdigit() and 10 <= len(cleaned) <= 15


def sanitize_input(input_str: str, max_length: int = 1000) -> str:
    """
    Sanitize user input by removing potentially harmful characters
    
    Args:
        input_str: Input string to sanitize
        max_length: Maximum allowed length
        
    Returns:
        Sanitized string
        
    Raises:
        HTTPException: If input exceeds max length
    """
    if len(input_str) > max_length:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Input exceeds maximum length of {max_length} characters"
        )
    
    # Remove potential XSS characters
    sanitized = input_str.strip()
    
    # Remove null bytes
    sanitized = sanitized.replace('\x00', '')
    
    return sanitized


def validate_age(age: int) -> bool:
    """
    Validate age is within acceptable range
    
    Args:
        age: Age to validate
        
    Returns:
        True if valid (0-150), False otherwise
    """
    return 0 <= age <= 150


def validate_gender(gender: str) -> bool:
    """
    Validate gender value
    
    Args:
        gender: Gender to validate
        
    Returns:
        True if valid, False otherwise
    """
    allowed_values = ["male", "female", "other"]
    return gender.lower() in allowed_values
