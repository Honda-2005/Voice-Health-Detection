// Main JavaScript file for the Voice Health Detection application

// Import necessary modules
import { initializeHeader } from '../components/header.js';
import { initializeModal } from '../components/modal.js';
import { setupEventListeners } from './ui.js';
import { checkAuthentication } from './auth.js';

// Initialize the application
function initApp() {
    // Set up the header component
    initializeHeader();

    // Set up the modal component
    initializeModal();

    // Check user authentication status
    checkAuthentication();

    // Set up event listeners for UI interactions
    setupEventListeners();
}

// Run the application
document.addEventListener('DOMContentLoaded', initApp);