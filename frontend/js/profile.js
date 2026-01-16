/**
 * Profile Management JavaScript
 * Handles profile viewing, editing, and deletion
 */

let currentUser = null;

/**
 * Load and display user profile
 */
async function loadProfile() {
    try {
        currentUser = await API.profile.getProfile();
        displayProfile();
    } catch (error) {
        showAlert('Failed to load profile: ' + error.message, 'error');
    }
}

/**
 * Display user profile information
 */
function displayProfile() {
    // Update avatar
    const avatar = document.getElementById('profileAvatar');
    if (avatar && currentUser) {
        avatar.textContent = currentUser.full_name.charAt(0).toUpperCase();
    }

    // Update name
    const nameElement = document.getElementById('profileName');
    if (nameElement) {
        nameElement.textContent = currentUser.full_name;
    }

    // Update email
    const emailElement = document.getElementById('profileEmail');
    if (emailElement) {
        emailElement.textContent = currentUser.email;
    }

    // Update form fields if in edit mode
    const editForm = document.getElementById('editProfileForm');
    if (editForm) {
        editForm.full_name.value = currentUser.full_name || '';
        editForm.phone.value = currentUser.phone || '';
        editForm.age.value = currentUser.age || '';
        editForm.gender.value = currentUser.gender || '';
    }

    // Display additional info
    const infoContainer = document.getElementById('profileInfo');
    if (infoContainer) {
        infoContainer.innerHTML = `
            <div class="form-group">
                <span class="form-label">Phone:</span>
                <span>${currentUser.phone || 'Not provided'}</span>
            </div>
            <div class="form-group">
                <span class="form-label">Age:</span>
                <span>${currentUser.age || 'Not provided'}</span>
            </div>
            <div class="form-group">
                <span class="form-label">Gender:</span>
                <span>${currentUser.gender || 'Not provided'}</span>
            </div>
            <div class="form-group">
                <span class="form-label">Member since:</span>
                <span>${new Date(currentUser.created_at).toLocaleDateString()}</span>
            </div>
        `;
    }
}

/**
 * Toggle edit mode
 */
function toggleEditMode() {
    const viewMode = document.getElementById('viewMode');
    const editMode = document.getElementById('editMode');

    if (viewMode && editMode) {
        viewMode.classList.toggle('hidden');
        editMode.classList.toggle('hidden');
    }
}

/**
 * Handle profile update
 */
async function handleProfileUpdate(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');

    // Get form data (only include non-empty fields)
    const formData = {};

    if (form.full_name.value.trim()) {
        formData.full_name = form.full_name.value.trim();
    }
    if (form.phone.value.trim()) {
        formData.phone = form.phone.value.trim();
    }
    if (form.age.value) {
        formData.age = parseInt(form.age.value);
    }
    if (form.gender.value) {
        formData.gender = form.gender.value;
    }

    // Make API request
    setButtonLoading(submitButton, true);

    try {
        const response = await API.profile.updateProfile(formData);
        currentUser = response;

        // Update stored user data
        localStorage.setItem('currentUser', JSON.stringify(response));

        showAlert('Profile updated successfully!', 'success');
        displayProfile();
        toggleEditMode();

    } catch (error) {
        showAlert(error.message || 'Failed to update profile', 'error');
    } finally {
        setButtonLoading(submitButton, false);
    }
}

/**
 * Show delete confirmation modal
 */
function showDeleteConfirmation() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

/**
 * Hide delete confirmation modal
 */
function hideDeleteConfirmation() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Handle account deletion
 */
async function handleAccountDeletion() {
    const deleteButton = document.querySelector('#deleteModal .btn-danger');
    setButtonLoading(deleteButton, true);

    try {
        await API.profile.deleteAccount();

        showAlert('Account deleted successfully. Redirecting...', 'success');

        // Clear auth data
        removeAuthToken();

        // Redirect to homepage
        setTimeout(() => {
            window.location.href = '/frontend/views/homepage.html';
        }, 2000);

    } catch (error) {
        showAlert(error.message || 'Failed to delete account', 'error');
        setButtonLoading(deleteButton, false);
        hideDeleteConfirmation();
    }
}

/**
 * Handle logout
 */
async function handleLogout() {
    try {
        await API.auth.logout();
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        removeAuthToken();
        window.location.href = '/frontend/views/login.html';
    }
}

/**
 * Initialize profile page
 */
document.addEventListener('DOMContentLoaded', () => {
    // Require authentication
    if (!requireAuth()) {
        return;
    }

    // Load profile
    loadProfile();

    // Setup edit form
    const editForm = document.getElementById('editProfileForm');
    if (editForm) {
        editForm.addEventListener('submit', handleProfileUpdate);
    }

    // Setup edit/cancel buttons
    const editButton = document.getElementById('editButton');
    if (editButton) {
        editButton.addEventListener('click', toggleEditMode);
    }

    const cancelButton = document.getElementById('cancelEdit');
    if (cancelButton) {
        cancelButton.addEventListener('click', toggleEditMode);
    }

    // Setup delete buttons
    const deleteButton = document.getElementById('deleteButton');
    if (deleteButton) {
        deleteButton.addEventListener('click', showDeleteConfirmation);
    }

    const cancelDeleteButton = document.getElementById('cancelDelete');
    if (cancelDeleteButton) {
        cancelDeleteButton.addEventListener('click', hideDeleteConfirmation);
    }

    const confirmDeleteButton = document.getElementById('confirmDelete');
    if (confirmDeleteButton) {
        confirmDeleteButton.addEventListener('click', handleAccountDeletion);
    }

    // Setup logout button
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
});
