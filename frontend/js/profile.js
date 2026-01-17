// Profile Management Module
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Profile Manager
    const profileManager = new ProfileManager();
    profileManager.init();
});

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.isEditing = false;
        this.originalData = {};
        this.currentSection = 'personal';
    }

    async init() {
        // Load user data
        await this.loadUserData();
        
        // Initialize UI components
        this.initNavigation();
        this.initForms();
        this.initModals();
        this.initEventListeners();
        
        // Set current section
        this.showSection(this.currentSection);
    }

    async loadUserData() {
        // Simulate API call to load user data
        try {
            // In real implementation, this would be an API call
            const userData = await this.fetchUserData();
            this.currentUser = userData;
            this.originalData = { ...userData };
            
            this.updateProfileUI(userData);
            this.updateProfileStats(userData.stats);
        } catch (error) {
            console.error('Failed to load user data:', error);
            this.showToast('Failed to load profile data', 'error');
        }
    }

    async fetchUserData() {
        // Simulated user data - replace with actual API call
        return {
            id: 'user-001',
            fullName: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+1 (555) 123-4567',
            age: 35,
            gender: 'male',
            location: 'New York, USA',
            occupation: 'Software Engineer',
            healthConditions: 'Mild seasonal allergies',
            stats: {
                totalRecordings: 24,
                daysActive: 45,
                joinDate: 'Dec 2023'
            },
            settings: {
                notifications: true,
                theme: 'light',
                language: 'en',
                timezone: 'UTC-5',
                dataRetention: '90'
            }
        };
    }

    updateProfileUI(userData) {
        // Update profile information
        document.getElementById('profileName').textContent = userData.fullName;
        document.getElementById('profileEmail').textContent = userData.email;
        document.getElementById('joinDate').textContent = userData.stats.joinDate;
        
        // Update form fields
        const fields = {
            'fullName': userData.fullName,
            'email': userData.email,
            'phone': userData.phone || '',
            'age': userData.age || '',
            'gender': userData.gender || '',
            'location': userData.location || '',
            'occupation': userData.occupation || '',
            'healthConditions': userData.healthConditions || ''
        };
        
        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        });
    }

    updateProfileStats(stats) {
        document.getElementById('totalRecordingsProfile').textContent = stats.totalRecordings;
        document.getElementById('daysActive').textContent = stats.daysActive;
    }

    initNavigation() {
        // Section navigation
        const navButtons = document.querySelectorAll('.profile-nav-btn');
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
                
                // Update active state
                navButtons.forEach(btn => btn.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
    }

    showSection(sectionId) {
        // Hide all sections
        const sections = document.querySelectorAll('.profile-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const targetSection = document.getElementById(`${sectionId}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
            
            // Update save button visibility based on section
            this.updateSaveButtonVisibility(sectionId);
        }
    }

    updateSaveButtonVisibility(sectionId) {
        const saveBtn = document.getElementById('saveProfileBtn');
        const editBtn = document.getElementById('editPersonalBtn');
        
        switch(sectionId) {
            case 'personal':
                saveBtn.style.display = this.isEditing ? 'block' : 'none';
                editBtn.style.display = this.isEditing ? 'none' : 'block';
                break;
            default:
                saveBtn.style.display = 'none';
                if (editBtn) editBtn.style.display = 'none';
        }
    }

    initForms() {
        // Personal info form
        const editPersonalBtn = document.getElementById('editPersonalBtn');
        if (editPersonalBtn) {
            editPersonalBtn.addEventListener('click', () => this.enablePersonalInfoEditing());
        }
        
        const saveProfileBtn = document.getElementById('saveProfileBtn');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => this.savePersonalInfo());
        }
        
        // Password form
        const passwordForm = document.getElementById('changePasswordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
            
            // Password strength indicator
            const newPasswordInput = document.getElementById('newPassword');
            if (newPasswordInput) {
                newPasswordInput.addEventListener('input', (e) => this.checkPasswordStrength(e.target.value));
            }
        }
        
        // Two-factor authentication
        const twoFactorToggle = document.getElementById('twoFactorToggle');
        if (twoFactorToggle) {
            twoFactorToggle.addEventListener('change', (e) => this.toggleTwoFactor(e.target.checked));
        }
    }

    enablePersonalInfoEditing() {
        const editableFields = ['phone', 'age', 'gender', 'location', 'occupation', 'healthConditions'];
        editableFields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.disabled = false;
                element.classList.add('editable');
            }
        });
        
        this.isEditing = true;
        this.updateSaveButtonVisibility('personal');
    }

    async savePersonalInfo() {
        try {
            this.showLoading(true);
            
            // Collect updated data
            const updatedData = {
                phone: document.getElementById('phone').value,
                age: document.getElementById('age').value,
                gender: document.getElementById('gender').value,
                location: document.getElementById('location').value,
                occupation: document.getElementById('occupation').value,
                healthConditions: document.getElementById('healthConditions').value
            };
            
            // Simulate API call
            await this.updateUserData(updatedData);
            
            // Update local data
            Object.assign(this.currentUser, updatedData);
            this.originalData = { ...this.currentUser };
            
            // Disable editing
            this.disablePersonalInfoEditing();
            
            this.showToast('Profile updated successfully!', 'success');
        } catch (error) {
            console.error('Failed to update profile:', error);
            this.showToast('Failed to update profile', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    disablePersonalInfoEditing() {
        const editableElements = document.querySelectorAll('.editable');
        editableElements.forEach(element => {
            element.disabled = true;
            element.classList.remove('editable');
        });
        
        this.isEditing = false;
        this.updateSaveButtonVisibility('personal');
    }

    async updateUserData(data) {
        // Simulate API call - replace with actual API
        return new Promise(resolve => {
            setTimeout(() => {
                console.log('User data updated:', data);
                resolve(data);
            }, 1000);
        });
    }

    async handlePasswordChange(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        
        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showToast('Please fill in all password fields', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showToast('New passwords do not match', 'error');
            return;
        }
        
        if (!this.validatePasswordStrength(newPassword)) {
            this.showToast('Password does not meet requirements', 'error');
            return;
        }
        
        try {
            this.showLoading(true);
            
            // Simulate API call
            await this.updatePassword(currentPassword, newPassword);
            
            this.showToast('Password updated successfully!', 'success');
            
            // Clear form
            e.target.reset();
            this.resetPasswordRequirements();
            
        } catch (error) {
            console.error('Password update failed:', error);
            this.showToast('Failed to update password', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    validatePasswordStrength(password) {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        
        return Object.values(requirements).every(req => req);
    }

    checkPasswordStrength(password) {
        let strength = 0;
        const requirements = [
            password.length >= 8,
            /[A-Z]/.test(password),
            /[a-z]/.test(password),
            /\d/.test(password),
            /[!@#$%^&*(),.?":{}|<>]/.test(password)
        ];
        
        strength = requirements.filter(req => req).length;
        
        // Update strength indicator
        const strengthBar = document.querySelector('.strength-bar');
        const strengthText = document.getElementById('passwordStrengthText');
        
        if (strengthBar && strengthText) {
            const percentages = ['0%', '20%', '40%', '60%', '80%', '100%'];
            const colors = ['#f72585', '#f8961e', '#f8961e', '#4cc9f0', '#4cc9f0', '#4cc9f0'];
            const texts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
            
            strengthBar.style.width = percentages[strength];
            strengthBar.style.background = colors[strength];
            strengthText.textContent = texts[strength];
            strengthText.style.color = colors[strength];
        }
        
        // Update requirement indicators
        this.updatePasswordRequirements(password);
    }

    updatePasswordRequirements(password) {
        const requirements = {
            'req-length': password.length >= 8,
            'req-uppercase': /[A-Z]/.test(password),
            'req-lowercase': /[a-z]/.test(password),
            'req-number': /\d/.test(password),
            'req-special': /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        
        Object.entries(requirements).forEach(([className, isValid]) => {
            const element = document.querySelector(`.${className}`);
            if (element) {
                element.classList.toggle('valid', isValid);
            }
        });
    }

    resetPasswordRequirements() {
        const requirementElements = document.querySelectorAll('.form-requirements li');
        requirementElements.forEach(element => {
            element.classList.remove('valid');
        });
        
        const strengthBar = document.querySelector('.strength-bar');
        const strengthText = document.getElementById('passwordStrengthText');
        
        if (strengthBar) strengthBar.style.width = '0%';
        if (strengthText) strengthText.textContent = 'Weak';
    }

    async updatePassword(currentPassword, newPassword) {
        // Simulate API call - replace with actual API
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (currentPassword === 'password123') { // Demo validation
                    reject(new Error('Current password is incorrect'));
                } else {
                    console.log('Password updated successfully');
                    resolve();
                }
            }, 1500);
        });
    }

    toggleTwoFactor(enabled) {
        const setupElement = document.getElementById('twoFactorSetup');
        if (setupElement) {
            setupElement.style.display = enabled ? 'block' : 'none';
            
            if (enabled) {
                // Show first step
                const steps = setupElement.querySelectorAll('.setup-step');
                steps.forEach((step, index) => {
                    step.classList.toggle('active', index === 0);
                });
            }
        }
    }

    initModals() {
        // Avatar modal
        this.initAvatarModal();
        
        // Delete account modal
        this.initDeleteAccountModal();
        
        // Export data modal
        this.initExportDataModal();
    }

    initAvatarModal() {
        const modal = document.getElementById('avatarModal');
        const editBtn = document.getElementById('editAvatarBtn');
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = document.getElementById('cancelAvatarBtn');
        const saveBtn = document.getElementById('saveAvatarBtn');
        
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                modal.classList.add('active');
            });
        }
        
        const closeModal = () => {
            modal.classList.remove('active');
        };
        
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        if (modal.querySelector('.modal-overlay')) {
            modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                // In real implementation, upload avatar to server
                const preview = document.getElementById('avatarPreview');
                const profileAvatar = document.getElementById('profileAvatar');
                
                if (preview && profileAvatar) {
                    profileAvatar.src = preview.src;
                    this.showToast('Avatar updated successfully!', 'success');
                }
                
                closeModal();
            });
        }
        
        // Color selection
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                colorOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                // In real implementation, update avatar with selected color
                const preview = document.getElementById('avatarPreview');
                if (preview) {
                    // This would generate an avatar with the selected color
                    console.log('Selected color:', option.dataset.color);
                }
            });
        });
    }

    initDeleteAccountModal() {
        const modal = document.getElementById('deleteAccountModal');
        const deleteBtn = document.getElementById('deleteAccountBtn');
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = document.getElementById('cancelDeleteAccountBtn');
        const confirmBtn = document.getElementById('confirmDeleteAccountBtn');
        const verificationInput = document.getElementById('deleteVerification');
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                modal.classList.add('active');
            });
        }
        
        const closeModal = () => {
            modal.classList.remove('active');
            if (verificationInput) verificationInput.value = '';
            if (confirmBtn) confirmBtn.disabled = true;
        };
        
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        if (modal.querySelector('.modal-overlay')) {
            modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
        }
        
        // Verification input
        if (verificationInput) {
            verificationInput.addEventListener('input', (e) => {
                const confirmBtn = document.getElementById('confirmDeleteAccountBtn');
                if (confirmBtn) {
                    confirmBtn.disabled = e.target.value !== 'DELETE';
                }
            });
        }
        
        // Confirm delete
        if (confirmBtn) {
            confirmBtn.addEventListener('click', async () => {
                try {
                    this.showLoading(true);
                    
                    // Simulate API call
                    await this.deleteAccount();
                    
                    this.showToast('Account deleted successfully', 'success');
                    
                    // Redirect to login page
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                    
                } catch (error) {
                    console.error('Failed to delete account:', error);
                    this.showToast('Failed to delete account', 'error');
                    closeModal();
                } finally {
                    this.showLoading(false);
                }
            });
        }
    }

    async deleteAccount() {
        // Simulate API call - replace with actual API
        return new Promise(resolve => {
            setTimeout(() => {
                console.log('Account deleted');
                resolve();
            }, 2000);
        });
    }

    initExportDataModal() {
        const modal = document.getElementById('exportDataModal');
        const exportBtn = document.getElementById('exportDataBtn');
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = document.getElementById('cancelExportBtn');
        const startBtn = document.getElementById('startExportBtn');
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                modal.classList.add('active');
            });
        }
        
        const closeModal = () => {
            modal.classList.remove('active');
        };
        
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        if (modal.querySelector('.modal-overlay')) {
            modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
        }
        
        // Data range selection
        const rangeOptions = document.querySelectorAll('input[name="dataRange"]');
        const customRange = document.querySelector('.custom-range');
        
        rangeOptions.forEach(option => {
            option.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    customRange.style.display = 'block';
                } else {
                    customRange.style.display = 'none';
                }
            });
        });
        
        // Start export
        if (startBtn) {
            startBtn.addEventListener('click', async () => {
                try {
                    this.showLoading(true);
                    
                    const format = document.querySelector('input[name="exportFormat"]:checked').value;
                    const range = document.querySelector('input[name="dataRange"]:checked').value;
                    
                    let startDate, endDate;
                    if (range === 'custom') {
                        startDate = document.getElementById('exportStartDate').value;
                        endDate = document.getElementById('exportEndDate').value;
                    }
                    
                    // Simulate export process
                    await this.exportData(format, range, startDate, endDate);
                    
                    this.showToast('Data exported successfully!', 'success');
                    closeModal();
                    
                } catch (error) {
                    console.error('Export failed:', error);
                    this.showToast('Failed to export data', 'error');
                } finally {
                    this.showLoading(false);
                }
            });
        }
    }

    async exportData(format, range, startDate, endDate) {
        // Simulate export process - replace with actual API
        return new Promise(resolve => {
            setTimeout(() => {
                console.log(`Exporting data as ${format}, range: ${range}`);
                if (range === 'custom') {
                    console.log(`From ${startDate} to ${endDate}`);
                }
                
                // In real implementation, this would trigger a file download
                resolve();
            }, 3000);
        });
    }

    initEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }
        
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                document.querySelector('.sidebar').classList.toggle('active');
            });
        }
    }

    handleLogout() {
        // Clear user session and redirect to login
        localStorage.removeItem('userToken');
        sessionStorage.removeItem('userData');
        
        this.showToast('Logged out successfully', 'success');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('global-loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.toggle('active', show);
        }
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close">&times;</button>
        `;
        
        // Add to container
        const container = document.querySelector('.toast-container') || this.createToastContainer();
        container.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
        
        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });
    }

    getToastIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }
}