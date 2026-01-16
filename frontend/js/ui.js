// ui.js - Complete UI Utilities Module

/**
 * ============================================================================
 * TOAST NOTIFICATIONS
 * ============================================================================
 */

const TOAST_CONFIG = {
    duration: 5000,
    position: 'top-right',
    maxToasts: 3
};

class ToastManager {
    constructor() {
        this.toastContainer = null;
        this.toastQueue = [];
        this.activeToasts = 0;
        this.initContainer();
    }
    
    initContainer() {
        this.toastContainer = document.createElement('div');
        this.toastContainer.className = 'toast-container';
        this.toastContainer.setAttribute('aria-live', 'polite');
        this.toastContainer.setAttribute('aria-atomic', 'true');
        document.body.appendChild(this.toastContainer);
    }
    
    show(message, type = 'info', duration = TOAST_CONFIG.duration) {
        const toast = this.createToast(message, type);
        this.toastContainer.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto remove
        if (duration > 0) {
            setTimeout(() => this.removeToast(toast), duration);
        }
        
        this.activeToasts++;
        
        // Limit number of toasts
        if (this.activeToasts > TOAST_CONFIG.maxToasts) {
            const oldestToast = this.toastContainer.firstChild;
            if (oldestToast) this.removeToast(oldestToast);
        }
        
        return toast;
    }
    
    createToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        
        const icon = this.getToastIcon(type);
        
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${icon}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close" aria-label="Close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.removeToast(toast));
        
        return toast;
    }
    
    removeToast(toast) {
        toast.classList.remove('show');
        toast.classList.add('hide');
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
                this.activeToasts--;
            }
        }, 300);
    }
    
    getToastIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }
    
    clearAll() {
        while (this.toastContainer.firstChild) {
            this.removeToast(this.toastContainer.firstChild);
        }
    }
}

// Global toast instance
let toastManager;

function showToast(message, type = 'info', duration = TOAST_CONFIG.duration) {
    if (!toastManager) {
        toastManager = new ToastManager();
    }
    return toastManager.show(message, type, duration);
}

/**
 * ============================================================================
 * MODAL SYSTEM
 * ============================================================================
 */

class ModalManager {
    constructor() {
        this.modals = new Map();
    }
    
    create(id, content, options = {}) {
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal';
        
        const { title, size = 'medium', closable = true } = options;
        
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-dialog modal-${size}">
                <div class="modal-header">
                    <h3 class="modal-title">${title || ''}</h3>
                    ${closable ? '<button class="modal-close">&times;</button>' : ''}
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
            </div>
        `;
        
        document.body.appendChild(modal);
        this.modals.set(id, modal);
        
        // Add event listeners
        const overlay = modal.querySelector('.modal-overlay');
        const closeBtn = modal.querySelector('.modal-close');
        
        if (overlay && closable) {
            overlay.addEventListener('click', () => this.close(id));
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close(id));
        }
        
        // Close on Escape key
        if (closable) {
            const escapeHandler = (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    this.close(id);
                }
            };
            modal.escapeHandler = escapeHandler;
            document.addEventListener('keydown', escapeHandler);
        }
        
        return modal;
    }
    
    open(id) {
        const modal = this.modals.get(id);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Focus first focusable element
            setTimeout(() => {
                const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (focusable) focusable.focus();
            }, 100);
        }
    }
    
    close(id) {
        const modal = this.modals.get(id);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            
            // Remove escape handler
            if (modal.escapeHandler) {
                document.removeEventListener('keydown', modal.escapeHandler);
            }
        }
    }
    
    remove(id) {
        this.close(id);
        const modal = this.modals.get(id);
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
            this.modals.delete(id);
        }
    }
}

// Global modal instance
let modalManager;

function showModal(id, content, options) {
    if (!modalManager) {
        modalManager = new ModalManager();
    }
    
    if (!modalManager.modals.has(id)) {
        modalManager.create(id, content, options);
    }
    
    modalManager.open(id);
}

function closeModal(id) {
    if (modalManager) {
        modalManager.close(id);
    }
}

/**
 * ============================================================================
 * FORM VALIDATION
 * ============================================================================
 */

function initFormValidation() {
    // Add validation styles to CSS
    addValidationStyles();
    
    // Initialize all forms
    document.querySelectorAll('form').forEach(form => {
        form.setAttribute('novalidate', 'true');
        form.addEventListener('submit', validateForm);
        
        // Real-time validation
        form.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('blur', validateField);
            input.addEventListener('input', clearFieldError);
        });
    });
}

function validateForm(event) {
    const form = event.target;
    let isValid = true;
    
    // Validate all required fields
    form.querySelectorAll('[required]').forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    // Validate custom rules
    form.querySelectorAll('[data-validate]').forEach(field => {
        if (!validateCustomRule(field)) {
            isValid = false;
        }
    });
    
    if (!isValid) {
        event.preventDefault();
        showToast('Please correct the errors in the form', 'error');
        
        // Scroll to first error
        const firstError = form.querySelector('.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    return isValid;
}

function validateField(eventOrField) {
    const field = eventOrField.target || eventOrField;
    let isValid = true;
    
    // Clear previous errors
    clearFieldError(field);
    
    // Check required
    if (field.hasAttribute('required') && !field.value.trim()) {
        setFieldError(field, 'This field is required');
        isValid = false;
    }
    
    // Check email format
    if (field.type === 'email' && field.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(field.value)) {
            setFieldError(field, 'Please enter a valid email address');
            isValid = false;
        }
    }
    
    // Check minimum length
    const minLength = field.getAttribute('minlength');
    if (minLength && field.value.length < parseInt(minLength)) {
        setFieldError(field, `Minimum ${minLength} characters required`);
        isValid = false;
    }
    
    // Check maximum length
    const maxLength = field.getAttribute('maxlength');
    if (maxLength && field.value.length > parseInt(maxLength)) {
        setFieldError(field, `Maximum ${maxLength} characters allowed`);
        isValid = false;
    }
    
    // Check pattern
    const pattern = field.getAttribute('pattern');
    if (pattern && field.value.trim()) {
        const regex = new RegExp(pattern);
        if (!regex.test(field.value)) {
            const title = field.getAttribute('title') || 'Invalid format';
            setFieldError(field, title);
            isValid = false;
        }
    }
    
    // Validate custom rules
    if (field.hasAttribute('data-validate')) {
        isValid = validateCustomRule(field) && isValid;
    }
    
    return isValid;
}

function validateCustomRule(field) {
    const rule = field.getAttribute('data-validate');
    const value = field.value.trim();
    let isValid = true;
    
    switch(rule) {
        case 'password-strength':
            if (value) {
                const hasUpper = /[A-Z]/.test(value);
                const hasLower = /[a-z]/.test(value);
                const hasNumber = /[0-9]/.test(value);
                const hasSpecial = /[^A-Za-z0-9]/.test(value);
                
                if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
                    setFieldError(field, 'Password must contain uppercase, lowercase, number, and special character');
                    isValid = false;
                }
            }
            break;
            
        case 'phone':
            if (value) {
                const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
                const cleaned = value.replace(/[\s\(\)\-]/g, '');
                if (!phoneRegex.test(cleaned)) {
                    setFieldError(field, 'Please enter a valid phone number');
                    isValid = false;
                }
            }
            break;
            
        case 'match':
            const matchFieldId = field.getAttribute('data-match-field');
            const matchField = document.getElementById(matchFieldId);
            if (matchField && value !== matchField.value) {
                setFieldError(field, 'Fields do not match');
                isValid = false;
            }
            break;
    }
    
    return isValid;
}

function setFieldError(field, message) {
    const fieldWrapper = field.closest('.form-group') || field.parentElement;
    
    // Add error class
    field.classList.add('error');
    fieldWrapper.classList.add('has-error');
    
    // Create or update error message
    let errorElement = fieldWrapper.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        fieldWrapper.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.setAttribute('role', 'alert');
}

function clearFieldError(eventOrField) {
    const field = eventOrField.target || eventOrField;
    const fieldWrapper = field.closest('.form-group') || field.parentElement;
    
    // Remove error classes
    field.classList.remove('error');
    fieldWrapper.classList.remove('has-error');
    
    // Remove error message
    const errorElement = fieldWrapper.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
}

function addValidationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .has-error input,
        .has-error select,
        .has-error textarea {
            border-color: var(--danger) !important;
            box-shadow: 0 0 0 3px rgba(247, 37, 133, 0.1) !important;
        }
        
        .error-message {
            color: var(--danger);
            font-size: 0.85rem;
            margin-top: 5px;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .error-message:before {
            content: '⚠';
        }
        
        .toast-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 350px;
        }
        
        .toast {
            background: white;
            border-radius: var(--border-radius);
            padding: 15px 20px;
            box-shadow: var(--box-shadow);
            display: flex;
            justify-content: space-between;
            align-items: center;
            transform: translateX(100%);
            opacity: 0;
            transition: transform 0.3s ease, opacity 0.3s ease;
        }
        
        .toast.show {
            transform: translateX(0);
            opacity: 1;
        }
        
        .toast.hide {
            transform: translateX(100%);
            opacity: 0;
        }
        
        .toast-content {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
        }
        
        .toast i {
            font-size: 1.2rem;
        }
        
        .toast-success {
            border-left: 4px solid var(--success);
        }
        
        .toast-error {
            border-left: 4px solid var(--danger);
        }
        
        .toast-warning {
            border-left: 4px solid var(--warning);
        }
        
        .toast-info {
            border-left: 4px solid var(--primary);
        }
        
        .toast-success i {
            color: var(--success);
        }
        
        .toast-error i {
            color: var(--danger);
        }
        
        .toast-warning i {
            color: var(--warning);
        }
        
        .toast-info i {
            color: var(--primary);
        }
        
        .toast-close {
            background: none;
            border: none;
            color: var(--gray);
            cursor: pointer;
            padding: 5px;
            margin-left: 10px;
            border-radius: 4px;
            transition: var(--transition);
        }
        
        .toast-close:hover {
            background: var(--gray-light);
            color: var(--dark);
        }
        
        /* Modal Styles */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10000;
        }
        
        .modal.active {
            display: block;
        }
        
        .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(2px);
        }
        
        .modal-dialog {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.9);
            background: white;
            border-radius: var(--border-radius);
            box-shadow: var(--box-shadow);
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            opacity: 0;
            transition: transform 0.3s ease, opacity 0.3s ease;
        }
        
        .modal.active .modal-dialog {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
        
        .modal-small {
            max-width: 400px;
        }
        
        .modal-large {
            max-width: 800px;
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid var(--gray-light);
        }
        
        .modal-title {
            margin: 0;
            font-size: 1.5rem;
        }
        
        .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--gray);
            padding: 5px;
            border-radius: 4px;
            transition: var(--transition);
        }
        
        .modal-close:hover {
            background: var(--gray-light);
            color: var(--dark);
        }
        
        .modal-body {
            padding: 20px;
            overflow-y: auto;
            flex: 1;
        }
        
        .modal-footer {
            padding: 20px;
            border-top: 1px solid var(--gray-light);
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
    `;
    
    document.head.appendChild(style);
}

/**
 * ============================================================================
 * LOADING STATES
 * ============================================================================
 */

function showLoadingOverlay(message = 'Loading...') {
    let overlay = document.getElementById('global-loading-overlay');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'global-loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-message">${message}</div>
        `;
        
        document.body.appendChild(overlay);
    }
    
    overlay.classList.add('active');
    return overlay;
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('global-loading-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            if (overlay.parentNode && !overlay.classList.contains('active')) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 300);
    }
}

/**
 * ============================================================================
 * TOOLTIPS
 * ============================================================================
 */

function initTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
        element.addEventListener('focus', showTooltip);
        element.addEventListener('blur', hideTooltip);
    });
}

function showTooltip(event) {
    const element = event.target;
    const tooltipText = element.getAttribute('data-tooltip');
    
    if (!tooltipText) return;
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = tooltipText;
    tooltip.setAttribute('role', 'tooltip');
    
    document.body.appendChild(tooltip);
    
    // Position tooltip
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let top = rect.top - tooltipRect.height - 10;
    let left = rect.left + (rect.width - tooltipRect.width) / 2;
    
    // Adjust if tooltip goes off screen
    if (top < 10) top = rect.bottom + 10;
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
    }
    
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    
    // Store reference
    element.tooltip = tooltip;
}

function hideTooltip(event) {
    const element = event.target;
    if (element.tooltip && element.tooltip.parentNode) {
        element.tooltip.parentNode.removeChild(element.tooltip);
        element.tooltip = null;
    }
}

/**
 * ============================================================================
 * ANIMATIONS
 * ============================================================================
 */

function initAnimations() {
    // Add animation on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    // Observe all elements with animation class
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        .animate-on-scroll {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .animate-on-scroll.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--gray-light);
            border-top: 3px solid var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 15px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

/**
 * ============================================================================
 * INITIALIZATION
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all UI components
    initFormValidation();
    initTooltips();
    initAnimations();
    
    // Initialize toast and modal managers on first use
    Object.defineProperty(window, 'showToast', {
        get: function() {
            if (!toastManager) {
                toastManager = new ToastManager();
            }
            return showToast;
        }
    });
    
    Object.defineProperty(window, 'showModal', {
        get: function() {
            if (!modalManager) {
                modalManager = new ModalManager();
            }
            return showModal;
        }
    });
    
    console.log('UI System Initialized');
});

/**
 * ============================================================================
 * EXPORT UTILITY FUNCTIONS
 * ============================================================================
 */

window.UI = {
    showToast,
    showModal,
    closeModal,
    showLoadingOverlay,
    hideLoadingOverlay,
    initFormValidation,
    initTooltips,
    initAnimations
};