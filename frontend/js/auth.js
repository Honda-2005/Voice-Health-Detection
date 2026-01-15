/**
 * Authentication JavaScript
 * Handles login and registration forms
 */

/**
 * Show alert message
 */
function showAlert(message, type = 'error') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    const container = document.querySelector('.auth-card');
    container.insertBefore(alertDiv, container.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

/**
 * Show loading state on button
 */
function setButtonLoading(button, loading) {
    if (loading) {
        button.dataset.originalText = button.textContent;
        button.innerHTML = '<span class="spinner"></span> Loading...';
        button.disabled = true;
    } else {
        button.textContent = button.dataset.originalText;
        button.disabled = false;
    }
}

/**
 * Validate email format
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate password strength
 */
function validatePassword(password) {
    const errors = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain an uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain a lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain a number');
    }

    return errors;
}

/**
 * Handle registration form submission
 */
async function handleRegister(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');

    // Get form data
    const formData = {
        email: form.email.value.trim(),
        password: form.password.value,
        full_name: form.full_name.value.trim()
    };

    // Client-side validation
    if (!validateEmail(formData.email)) {
        showAlert('Please enter a valid email address', 'error');
        return;
    }

    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
        showAlert(passwordErrors.join('. '), 'error');
        return;
    }

    if (formData.full_name.length < 2) {
        showAlert('Full name must be at least 2 characters', 'error');
        return;
    }

    // Make API request
    setButtonLoading(submitButton, true);

    try {
        const response = await API.auth.register(formData);

        // Store token and user data
        setAuthToken(response.access_token);
        localStorage.setItem('currentUser', JSON.stringify(response.user));

        showAlert('Registration successful! Redirecting...', 'success');

        // Redirect to homepage
        setTimeout(() => {
            window.location.href = '/frontend/views/homepage.html';
        }, 1500);

    } catch (error) {
        showAlert(error.message || 'Registration failed. Please try again.', 'error');
        setButtonLoading(submitButton, false);
    }
}

/**
 * Handle login form submission
 */
async function handleLogin(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');

    // Get form data
    const formData = {
        email: form.email.value.trim(),
        password: form.password.value
    };

    // Client-side validation
    if (!validateEmail(formData.email)) {
        showAlert('Please enter a valid email address', 'error');
        return;
    }

    if (!formData.password) {
        showAlert('Please enter your password', 'error');
        return;
    }

    // Make API request
    setButtonLoading(submitButton, true);

    try {
        const response = await API.auth.login(formData);

        // Store token and user data
        setAuthToken(response.access_token);
        localStorage.setItem('currentUser', JSON.stringify(response.user));

        showAlert('Login successful! Redirecting...', 'success');

        // Redirect to homepage
        setTimeout(() => {
            window.location.href = '/frontend/views/homepage.html';
        }, 1500);

    } catch (error) {
        showAlert(error.message || 'Login failed. Please check your credentials.', 'error');
        setButtonLoading(submitButton, false);
    }
}

/**
 * Initialize auth pages
 */
document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already authenticated
    redirectIfAuthenticated();

    // Setup form handlers
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Password visibility toggle
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                button.textContent = '👁️';
            } else {
                input.type = 'password';
                button.textContent = '👁️‍🗨️';
            }
        });
    });
});
