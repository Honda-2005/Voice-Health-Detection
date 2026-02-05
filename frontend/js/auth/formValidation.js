/**
 * Form Validation Utilities
 * XSS-safe validation with DOM sanitization
 */

export const FormValidation = {
    /**
     * Sanitize input to prevent XSS
     */
    sanitize(input) {
        if (typeof input !== 'string') return input;

        // Create a temporary element to leverage browser's HTML parsing
        const temp = document.createElement('div');
        temp.textContent = input;
        return temp.innerHTML;
    },

    /**
     * Validate email format
     */
    validateEmail(email) {
        if (!email) {
            return { valid: false, error: 'Email is required' };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { valid: false, error: 'Please enter a valid email address' };
        }

        return { valid: true };
    },

    /**
     * Validate required field
     */
    validateRequired(value, fieldName = 'This field') {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            return { valid: false, error: `${fieldName} is required` };
        }

        return { valid: true };
    },

    /**
     * Validate phone number
     */
    validatePhone(phone) {
        if (!phone) {
            return { valid: true }; // Optional field
        }

        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(phone) || phone.replace(/\D/g, '').length < 10) {
            return { valid: false, error: 'Please enter a valid phone number' };
        }

        return { valid: true };
    },

    /**
     * Validate age
     */
    validateAge(age) {
        if (!age) {
            return { valid: true }; // Optional field
        }

        const numAge = parseInt(age);
        if (isNaN(numAge) || numAge < 18 || numAge > 120) {
            return { valid: false, error: 'Please enter a valid age (18-120)' };
        }

        return { valid: true };
    },

    /**
     * Display error message safely (XSS protection)
     */
    displayError(elementId, message) {
        const element = document.getElementById(elementId);
        if (!element) return;

        // Use textContent instead of innerHTML to prevent XSS
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message; // Safe - no HTML parsing

        // Clear previous errors
        this.clearError(elementId);

        element.parentNode.insertBefore(errorDiv, element.nextSibling);
    },

    /**
     * Clear error message
     */
    clearError(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const nextEl = element.nextSibling;
        if (nextEl && nextEl.classList && nextEl.classList.contains('error-message')) {
            nextEl.remove();
        }
    },

    /**
     * Display success message safely
     */
    displaySuccess(elementId, message) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message; // Safe - no HTML parsing

        element.appendChild(successDiv);

        // Auto-remove after  3 seconds
        setTimeout(() => successDiv.remove(), 3000);
    },

    /**
     * Validate entire form
     */
    validateForm(formData, rules) {
        const errors = {};
        let isValid = true;

        Object.keys(rules).forEach(field => {
            const rule = rules[field];
            const value = formData[field];

            if (rule.required) {
                const result = this.validateRequired(value, rule.label || field);
                if (!result.valid) {
                    errors[field] = result.error;
                    isValid = false;
                    return;
                }
            }

            if (rule.type === 'email') {
                const result = this.validateEmail(value);
                if (!result.valid) {
                    errors[field] = result.error;
                    isValid = false;
                }
            }

            if (rule.type === 'phone') {
                const result = this.validatePhone(value);
                if (!result.valid) {
                    errors[field] = result.error;
                    isValid = false;
                }
            }

            if (rule.type === 'age') {
                const result = this.validateAge(value);
                if (!result.valid) {
                    errors[field] = result.error;
                    isValid = false;
                }
            }

            if (rule.custom) {
                const result = rule.custom(value);
                if (!result.valid) {
                    errors[field] = result.error;
                    isValid = false;
                }
            }
        });

        return { valid: isValid, errors };
    },
};

export default FormValidation;
