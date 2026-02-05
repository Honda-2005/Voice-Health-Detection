/**
 * Password Validation and Security Helpers
 * Implements strong password requirements
 */

export const PasswordHelpers = {
    /**
     * Minimum password requirements
     */
    requirements: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecialChar: true,
    },

    /**
     * Validate password strength
     */
    validate(password) {
        const errors = [];

        if (!password) {
            return { valid: false, errors: ['Password is required'] };
        }

        if (password.length < this.requirements.minLength) {
            errors.push(`Password must be at least ${this.requirements.minLength} characters`);
        }

        if (this.requirements.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }

        if (this.requirements.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }

        if (this.requirements.requireNumber && !/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        if (this.requirements.requireSpecialChar && !/[@$!%*?&]/.test(password)) {
            errors.push('Password must contain at least one special character (@$!%*?&)');
        }

        // Check for common passwords
        if (this.isCommonPassword(password)) {
            errors.push('This password is too common. Please choose a stronger password');
        }

        return {
            valid: errors.length === 0,
            errors,
            strength: this.calculateStrength(password),
        };
    },

    /**
     * Calculate password strength (0-100)
     */
    calculateStrength(password) {
        let strength = 0;

        // Length bonus
        strength += Math.min(password.length * 4, 40);

        // Character variety bonus
        if (/[a-z]/.test(password)) strength += 10;
        if (/[A-Z]/.test(password)) strength += 10;
        if (/\d/.test(password)) strength += 10;
        if (/[@$!%*?&]/.test(password)) strength += 10;

        // Complexity bonus
        const uniqueChars = new Set(password).size;
        strength += Math.min(uniqueChars * 2, 20);

        return Math.min(strength, 100);
    },

    /**
     * Get password strength label
     */
    getStrengthLabel(strength) {
        if (strength < 40) return { text: 'Weak', color: 'red' };
        if (strength < 70) return { text: 'Fair', color: 'orange' };
        if (strength < 90) return { text: 'Good', color: 'yellow' };
        return { text: 'Strong', color: 'green' };
    },

    /**
     * Check if password is in common password list
     */
    isCommonPassword(password) {
        const commonPasswords = [
            'password', 'Password123', '12345678', 'qwerty', 'abc123',
            'password1', 'admin', 'letmein', 'welcome', 'monkey',
            '1234567890', 'password123', 'Password1', 'admin123'
        ];

        return commonPasswords.some(common =>
            password.toLowerCase().includes(common.toLowerCase())
        );
    },

    /**
     * Validate password confirmation
     */
    validateConfirmation(password, confirmation) {
        if (!confirmation) {
            return { valid: false, error: 'Please confirm your password' };
        }

        if (password !== confirmation) {
            return { valid: false, error: 'Passwords do not match' };
        }

        return { valid: true };
    },

    /**
     * Generate password strength meter HTML
     */
    generateStrengthMeter(password) {
        const strength = this.calculateStrength(password);
        const label = this.getStrengthLabel(strength);

        return `
      <div class="password-strength-meter">
        <div class="strength-bar" style="width: ${strength}%; background-color: ${label.color}"></div>
      </div>
      <div class="strength-label" style="color: ${label.color}">${label.text}</div>
    `;
    },
};

export default PasswordHelpers;
