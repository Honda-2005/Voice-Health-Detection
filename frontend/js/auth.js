// auth.js - Complete Authentication Module
// Voice Health System - Authentication Controller

/**
 * ============================================================================
 * MAIN AUTHENTICATION MODULE
 * ============================================================================
 */

// Configuration
const AUTH_CONFIG = {
    apiBaseUrl: 'http://localhost:8000/api', // Change to your backend URL
    tokenKey: 'voiceHealthToken',
    userKey: 'voiceHealthUser',
    rememberMeKey: 'voiceHealthRememberMe',
    usersKey: 'voiceHealthUsers', // For demo storage
    minPasswordLength: 8,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    demoMode: true // Set to false when connecting to real backend
};

/**
 * ============================================================================
 * DOM INITIALIZATION
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Voice Health Auth System Initialized');
    
    // Check current page and initialize appropriate handlers
    const currentPage = window.location.pathname.split('/').pop();
    
    switch(currentPage) {
        case 'login.html':
            initLoginPage();
            break;
        case 'register.html':
            initRegistrationPage();
            break;
        default:
            // Check authentication status for protected pages
            if (isProtectedPage(currentPage)) {
                checkAuthStatus();
            }
    }
    
    // Initialize common UI elements
    initCommonUI();
});

/**
 * ============================================================================
 * PAGE-SPECIFIC INITIALIZERS
 * ============================================================================
 */

function initLoginPage() {
    console.log('Initializing Login Page');
    
    // Check if user is already logged in
    if (isAuthenticated() && localStorage.getItem(AUTH_CONFIG.rememberMeKey) === 'true') {
        redirectToHomepage();
        return;
    }
    
    // Password visibility toggle
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function() {
            togglePasswordVisibility(passwordInput, this);
        });
    }
    
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    // Google Sign In button (placeholder)
    const googleBtn = document.querySelector('.btn-google');
    if (googleBtn) {
        googleBtn.addEventListener('click', handleGoogleSignIn);
    }
    
    // Forgot password link
    const forgotLink = document.querySelector('.forgot-link');
    if (forgotLink) {
        forgotLink.addEventListener('click', handleForgotPassword);
    }
}

function initRegistrationPage() {
    console.log('Initializing Registration Page');
    
    // Initialize multi-step form
    initMultiStepForm();
    
    // Password strength checker
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', handlePasswordInput);
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', handleConfirmPasswordInput);
    }
    
    // Password visibility toggles
    const toggleButtons = document.querySelectorAll('.password-toggle i');
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const inputId = this.id === 'togglePassword' ? 'password' : 'confirmPassword';
            const input = document.getElementById(inputId);
            if (input) {
                togglePasswordVisibility(input, this);
            }
        });
    });
    
    // Registration form submission
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistrationSubmit);
    }
}

/**
 * ============================================================================
 * FORM HANDLERS
 * ============================================================================
 */

async function handleLoginSubmit(event) {
    event.preventDefault();
    
    // Get form data
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    
    // Validate inputs
    const validation = validateLoginInputs(email, password);
    if (!validation.isValid) {
        showToast(validation.message, 'error');
        return;
    }
    
    // Show loading state
    showLoading(true);
    
    try {
        // Attempt login
        const result = await performLogin(email, password, rememberMe);
        
        // Store authentication data
        storeAuthData(result, rememberMe);
        
        // Show success message
        showToast('Login successful! Redirecting...', 'success');
        
        // Redirect to homepage
        setTimeout(redirectToHomepage, 1500);
        
    } catch (error) {
        // Handle login error
        showToast(error.message || 'Login failed. Please try again.', 'error');
        console.error('Login error:', error);
    } finally {
        // Hide loading state
        showLoading(false);
    }
}

async function handleRegistrationSubmit(event) {
    event.preventDefault();
    
    // Validate all steps
    if (!validateAllRegistrationSteps()) {
        showToast('Please complete all steps correctly', 'error');
        return;
    }
    
    // Gather form data
    const userData = gatherRegistrationData();
    
    // Validate final data
    const validation = validateRegistrationData(userData);
    if (!validation.isValid) {
        showToast(validation.message, 'error');
        return;
    }
    
    // Show loading state
    showLoading(true);
    
    try {
        // Attempt registration
        const result = await performRegistration(userData);
        
        // Auto-login after registration
        const loginResult = await performLogin(userData.email, userData.password, true);
        
        // Store authentication data
        storeAuthData(loginResult, true);
        
        // Show success message
        showToast('Account created successfully! Welcome to Voice Health.', 'success');
        
        // Redirect to homepage
        setTimeout(redirectToHomepage, 2000);
        
    } catch (error) {
        // Handle registration error
        showToast(error.message || 'Registration failed. Please try again.', 'error');
        console.error('Registration error:', error);
    } finally {
        // Hide loading state
        showLoading(false);
    }
}

function handleGoogleSignIn() {
    showToast('Google Sign-In would be implemented here with OAuth 2.0', 'info');
    // Implementation would connect to Google OAuth API
    // For now, this is a placeholder
}

function handleForgotPassword(event) {
    event.preventDefault();
    showToast('Password reset functionality would be implemented here', 'info');
    // In production, this would open a password reset modal or page
}

/**
 * ============================================================================
 * REGISTRATION MULTI-STEP FORM
 * ============================================================================
 */

function initMultiStepForm() {
    const steps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-steps .step');
    let currentStep = 1;
    
    // Initialize step 1
    showStep(currentStep, steps, progressSteps);
    
    // Next step buttons
    document.getElementById('nextStep1')?.addEventListener('click', () => {
        if (validateStep1()) {
            currentStep = 2;
            showStep(currentStep, steps, progressSteps);
        }
    });
    
    document.getElementById('nextStep2')?.addEventListener('click', () => {
        if (validateStep2()) {
            currentStep = 3;
            showStep(currentStep, steps, progressSteps);
        }
    });
    
    // Previous step buttons
    document.getElementById('prevStep2')?.addEventListener('click', () => {
        currentStep = 1;
        showStep(currentStep, steps, progressSteps);
    });
    
    document.getElementById('prevStep3')?.addEventListener('click', () => {
        currentStep = 2;
        showStep(currentStep, steps, progressSteps);
    });
    
    // Handle Enter key to go to next step
    document.querySelectorAll('.form-step input').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const step = parseInt(this.closest('.form-step').dataset.step);
                if (step === 1) {
                    document.getElementById('nextStep1')?.click();
                } else if (step === 2) {
                    document.getElementById('nextStep2')?.click();
                }
            }
        });
    });
}

function showStep(stepNumber, steps, progressSteps) {
    // Hide all steps
    steps.forEach(step => step.classList.remove('active'));
    
    // Show target step
    const targetStep = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
    if (targetStep) {
        targetStep.classList.add('active');
        
        // Focus first input in the step
        const firstInput = targetStep.querySelector('input, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 300);
        }
    }
    
    // Update progress steps
    progressSteps.forEach(progressStep => {
        progressStep.classList.remove('active');
        if (parseInt(progressStep.dataset.step) <= stepNumber) {
            progressStep.classList.add('active');
        }
    });
}

function validateStep1() {
    const fullName = document.getElementById('fullName')?.value.trim();
    const age = parseInt(document.getElementById('age')?.value);
    const gender = document.getElementById('gender')?.value;
    
    let isValid = true;
    let message = '';
    
    if (!fullName || fullName.length < 2) {
        markInvalid('fullName');
        isValid = false;
        message = 'Please enter a valid full name (min. 2 characters)';
    } else {
        markValid('fullName');
    }
    
    if (!age || age < 18 || age > 120) {
        markInvalid('age');
        isValid = false;
        message = message || 'Please enter a valid age (18-120)';
    } else {
        markValid('age');
    }
    
    if (!gender) {
        markInvalid('gender');
        isValid = false;
        message = message || 'Please select your gender';
    } else {
        markValid('gender');
    }
    
    if (!isValid && message) {
        showToast(message, 'error');
    }
    
    return isValid;
}

function validateStep2() {
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    
    let isValid = true;
    let message = '';
    
    // Email validation
    if (!email || !validateEmail(email)) {
        markInvalid('email');
        isValid = false;
        message = 'Please enter a valid email address';
    } else {
        markValid('email');
    }
    
    // Password validation
    if (!password) {
        markInvalid('password');
        isValid = false;
        message = message || 'Please enter a password';
    } else if (password.length < AUTH_CONFIG.minPasswordLength) {
        markInvalid('password');
        isValid = false;
        message = `Password must be at least ${AUTH_CONFIG.minPasswordLength} characters`;
    } else {
        const strength = checkPasswordStrength(password);
        if (strength.score < 3) {
            markInvalid('password');
            isValid = false;
            message = 'Please use a stronger password';
        } else {
            markValid('password');
        }
    }
    
    // Confirm password validation
    if (password !== confirmPassword) {
        markInvalid('confirmPassword');
        isValid = false;
        message = message || 'Passwords do not match';
    } else if (confirmPassword) {
        markValid('confirmPassword');
    }
    
    if (!isValid && message) {
        showToast(message, 'error');
    }
    
    return isValid;
}

function validateAllRegistrationSteps() {
    return validateStep1() && validateStep2() && validateStep3();
}

function validateStep3() {
    const termsAgree = document.getElementById('termsAgree')?.checked;
    const privacyAgree = document.getElementById('privacyAgree')?.checked;
    
    if (!termsAgree || !privacyAgree) {
        showToast('You must agree to the Terms of Service and Privacy Policy', 'error');
        return false;
    }
    
    return true;
}

function gatherRegistrationData() {
    return {
        fullName: document.getElementById('fullName').value.trim(),
        age: parseInt(document.getElementById('age').value),
        gender: document.getElementById('gender').value,
        phone: document.getElementById('phone')?.value.trim() || null,
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        termsAgree: document.getElementById('termsAgree').checked,
        privacyAgree: document.getElementById('privacyAgree').checked,
        dataConsent: document.getElementById('dataConsent')?.checked || false,
        newsletterOptIn: document.getElementById('newsletterOptIn')?.checked || false,
        createdAt: new Date().toISOString()
    };
}

/**
 * ============================================================================
 * PASSWORD HANDLERS
 * ============================================================================
 */

function handlePasswordInput() {
    const password = this.value;
    checkPasswordStrength(password);
}

function handleConfirmPasswordInput() {
    const password = document.getElementById('password')?.value;
    const confirmPassword = this.value;
    
    if (confirmPassword) {
        if (password === confirmPassword) {
            markValid('confirmPassword');
        } else {
            markInvalid('confirmPassword');
        }
    }
}

function checkPasswordStrength(password) {
    const requirements = {
        length: password.length >= AUTH_CONFIG.minPasswordLength,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };
    
    // Update requirement checkmarks
    Object.keys(requirements).forEach(key => {
        const element = document.querySelector(`.req-${key}`);
        if (element) {
            element.classList.toggle('valid', requirements[key]);
        }
    });
    
    // Calculate score
    const score = Object.values(requirements).filter(Boolean).length;
    updatePasswordStrengthUI(score);
    
    return { score, requirements };
}

function updatePasswordStrengthUI(score) {
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.getElementById('strengthText');
    
    if (!strengthBar || !strengthText) return;
    
    let strength = 'Weak';
    let color = 'var(--danger)';
    let width = '20%';
    
    switch(score) {
        case 5:
            strength = 'Very Strong';
            color = '#2ecc71';
            width = '100%';
            break;
        case 4:
            strength = 'Strong';
            color = 'var(--success)';
            width = '80%';
            break;
        case 3:
            strength = 'Good';
            color = 'var(--warning)';
            width = '60%';
            break;
        case 2:
            strength = 'Fair';
            color = '#ffa726';
            width = '40%';
            break;
        default:
            strength = 'Weak';
            color = 'var(--danger)';
            width = '20%';
    }
    
    strengthBar.style.width = width;
    strengthBar.style.backgroundColor = color;
    strengthText.textContent = strength;
    strengthText.style.color = color;
}

/**
 * ============================================================================
 * AUTHENTICATION OPERATIONS
 * ============================================================================
 */

async function performLogin(email, password, rememberMe) {
    if (AUTH_CONFIG.demoMode) {
        // Demo mode - simulate API call
        return simulateLogin(email, password, rememberMe);
    } else {
        // Production mode - real API call
        return realLogin(email, password, rememberMe);
    }
}

async function simulateLogin(email, password, rememberMe) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Check demo users in localStorage
            const users = JSON.parse(localStorage.getItem(AUTH_CONFIG.usersKey) || '[]');
            const user = users.find(u => u.email === email);
            
            // Default demo users
            const demoUsers = [
                { email: 'test@example.com', password: 'Password123!', name: 'Test User' },
                { email: 'user@voicehealth.com', password: 'Health2023!', name: 'Voice Health User' }
            ];
            
            // Check demo users first
            const demoUser = demoUsers.find(u => u.email === email && u.password === password);
            
            if (demoUser) {
                resolve({
                    token: `demo-token-${Date.now()}`,
                    user: {
                        id: Date.now(),
                        email: demoUser.email,
                        name: demoUser.name,
                        role: 'user'
                    },
                    expiresIn: AUTH_CONFIG.sessionTimeout
                });
                return;
            }
            
            // Check registered users
            if (user && atob(user.password) === password) {
                resolve({
                    token: `user-token-${user.id}`,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.fullName,
                        age: user.age,
                        gender: user.gender,
                        role: 'user'
                    },
                    expiresIn: AUTH_CONFIG.sessionTimeout
                });
                return;
            }
            
            reject(new Error('Invalid email or password'));
        }, 1000);
    });
}

async function realLogin(email, password, rememberMe) {
    // This would be the actual API call in production
    try {
        const response = await fetch(`${AUTH_CONFIG.apiBaseUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, rememberMe })
        });
        
        if (!response.ok) {
            throw new Error('Login failed');
        }
        
        return await response.json();
    } catch (error) {
        throw new Error('Network error. Please check your connection.');
    }
}

async function performRegistration(userData) {
    if (AUTH_CONFIG.demoMode) {
        // Demo mode - store in localStorage
        return simulateRegistration(userData);
    } else {
        // Production mode - real API call
        return realRegistration(userData);
    }
}

async function simulateRegistration(userData) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                // Check if user already exists
                const users = JSON.parse(localStorage.getItem(AUTH_CONFIG.usersKey) || '[]');
                const userExists = users.some(u => u.email === userData.email);
                
                if (userExists) {
                    reject(new Error('An account with this email already exists'));
                    return;
                }
                
                // Create new user object
                const newUser = {
                    ...userData,
                    id: Date.now(),
                    password: btoa(userData.password), // Simple encoding for demo
                    createdAt: new Date().toISOString(),
                    verified: false,
                    lastLogin: null
                };
                
                // Save to localStorage
                users.push(newUser);
                localStorage.setItem(AUTH_CONFIG.usersKey, JSON.stringify(users));
                
                resolve({
                    success: true,
                    message: 'Registration successful',
                    userId: newUser.id
                });
            } catch (error) {
                reject(new Error('Registration failed. Please try again.'));
            }
        }, 1500);
    });
}

async function realRegistration(userData) {
    try {
        const response = await fetch(`${AUTH_CONFIG.apiBaseUrl}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Registration failed');
        }
        
        return await response.json();
    } catch (error) {
        throw new Error(error.message || 'Network error. Please check your connection.');
    }
}

/**
 * ============================================================================
 * AUTH UTILITIES
 * ============================================================================
 */

function storeAuthData(authResult, rememberMe) {
    // Store token
    if (rememberMe) {
        localStorage.setItem(AUTH_CONFIG.tokenKey, authResult.token);
        localStorage.setItem(AUTH_CONFIG.rememberMeKey, 'true');
    } else {
        sessionStorage.setItem(AUTH_CONFIG.tokenKey, authResult.token);
    }
    
    // Store user data
    localStorage.setItem(AUTH_CONFIG.userKey, JSON.stringify(authResult.user));
    
    // Store expiration
    const expiresAt = Date.now() + authResult.expiresIn;
    if (rememberMe) {
        localStorage.setItem('authExpiresAt', expiresAt);
    } else {
        sessionStorage.setItem('authExpiresAt', expiresAt);
    }
    
    console.log('Auth data stored for user:', authResult.user.email);
}

function isAuthenticated() {
    const token = localStorage.getItem(AUTH_CONFIG.tokenKey) || 
                  sessionStorage.getItem(AUTH_CONFIG.tokenKey);
    
    if (!token) return false;
    
    // Check expiration
    const expiresAt = localStorage.getItem('authExpiresAt') || 
                      sessionStorage.getItem('authExpiresAt');
    
    if (expiresAt && Date.now() > parseInt(expiresAt)) {
        logout();
        return false;
    }
    
    return true;
}

function logout() {
    // Clear all auth data
    localStorage.removeItem(AUTH_CONFIG.tokenKey);
    localStorage.removeItem(AUTH_CONFIG.userKey);
    localStorage.removeItem('authExpiresAt');
    localStorage.removeItem(AUTH_CONFIG.rememberMeKey);
    
    sessionStorage.removeItem(AUTH_CONFIG.tokenKey);
    sessionStorage.removeItem(AUTH_CONFIG.userKey);
    sessionStorage.removeItem('authExpiresAt');
    
    // Redirect to login page
    window.location.href = 'login.html';
}

function checkAuthStatus() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
    }
}

function redirectToHomepage() {
    window.location.href = 'homepage.html';
}

function isProtectedPage(pageName) {
    const protectedPages = [
        'homepage.html',
        'profile.html',
        'record.html',
        'prediction_result.html',
        'history.html',
        'evaluation.html'
    ];
    
    return protectedPages.includes(pageName);
}

/**
 * ============================================================================
 * VALIDATION FUNCTIONS
 * ============================================================================
 */

function validateLoginInputs(email, password) {
    if (!email || !password) {
        return { isValid: false, message: 'Please fill in all fields' };
    }
    
    if (!validateEmail(email)) {
        return { isValid: false, message: 'Please enter a valid email address' };
    }
    
    return { isValid: true, message: '' };
}

function validateRegistrationData(userData) {
    // Basic validation
    if (!userData.fullName || userData.fullName.length < 2) {
        return { isValid: false, message: 'Please enter a valid full name' };
    }
    
    if (!userData.age || userData.age < 18 || userData.age > 120) {
        return { isValid: false, message: 'Please enter a valid age (18-120)' };
    }
    
    if (!userData.gender) {
        return { isValid: false, message: 'Please select your gender' };
    }
    
    if (!userData.email || !validateEmail(userData.email)) {
        return { isValid: false, message: 'Please enter a valid email address' };
    }
    
    if (!userData.password || userData.password.length < AUTH_CONFIG.minPasswordLength) {
        return { isValid: false, message: `Password must be at least ${AUTH_CONFIG.minPasswordLength} characters` };
    }
    
    // Check password strength
    const strength = checkPasswordStrength(userData.password);
    if (strength.score < 3) {
        return { isValid: false, message: 'Please use a stronger password' };
    }
    
    if (!userData.termsAgree || !userData.privacyAgree) {
        return { isValid: false, message: 'You must agree to the Terms and Privacy Policy' };
    }
    
    return { isValid: true, message: '' };
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * ============================================================================
 * UI UTILITIES
 * ============================================================================
 */

function initCommonUI() {
    // Initialize tooltips
    initTooltips();
    
    // Initialize form validation
    initFormValidation();
}

function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.toggle('active', show);
    }
}

function togglePasswordVisibility(inputElement, toggleButton) {
    const type = inputElement.getAttribute('type') === 'password' ? 'text' : 'password';
    inputElement.setAttribute('type', type);
    
    // Toggle eye icon
    toggleButton.classList.toggle('fa-eye');
    toggleButton.classList.toggle('fa-eye-slash');
}

function markInvalid(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.style.borderColor = 'var(--danger)';
        field.style.boxShadow = '0 0 0 3px rgba(247, 37, 133, 0.1)';
    }
}

function markValid(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.style.borderColor = 'var(--success)';
        field.style.boxShadow = '0 0 0 3px rgba(76, 201, 240, 0.1)';
    }
}

function showToast(message, type = 'info') {
    // This function would be implemented in ui.js
    // For now, we'll use alert for simplicity
    alert(`${type.toUpperCase()}: ${message}`);
}

// These would be imported from ui.js in production
function initTooltips() {
    // Tooltip initialization
    console.log('Tooltips initialized');
}

function initFormValidation() {
    // Form validation initialization
    console.log('Form validation initialized');
}

/**
 * ============================================================================
 * EXPORT FUNCTIONS FOR USE IN OTHER FILES
 * ============================================================================
 */

// Export functions that might be needed by other modules
window.Auth = {
    isAuthenticated,
    logout,
    getUser: () => {
        const userData = localStorage.getItem(AUTH_CONFIG.userKey);
        return userData ? JSON.parse(userData) : null;
    },
    getToken: () => {
        return localStorage.getItem(AUTH_CONFIG.tokenKey) || 
               sessionStorage.getItem(AUTH_CONFIG.tokenKey);
    }
};

// Auto-check session expiration every minute
setInterval(() => {
    if (isAuthenticated()) {
        const expiresAt = localStorage.getItem('authExpiresAt') || 
                         sessionStorage.getItem('authExpiresAt');
        
        if (expiresAt && Date.now() > parseInt(expiresAt) - 60000) {
            // Expiring in less than 1 minute, show warning
            if (confirm('Your session is about to expire. Would you like to stay logged in?')) {
                // Refresh token (would call API in production)
                console.log('Session extended');
            } else {
                logout();
            }
        }
    }
}, 60000); // Check every minute