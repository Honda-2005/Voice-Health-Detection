// This file handles authentication-related functionality, such as login and registration processes.
// It includes functions for validating user input and managing authentication tokens.

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (validateEmail(email) && validatePassword(password)) {
        // Perform login logic (e.g., API call)
        console.log('Logging in with:', { email, password });
        // Add your API call here
    } else {
        alert('Invalid email or password.');
    }
}

function handleRegister(event) {
    event.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    if (validateEmail(email) && validatePassword(password)) {
        // Perform registration logic (e.g., API call)
        console.log('Registering with:', { email, password });
        // Add your API call here
    } else {
        alert('Invalid email or password.');
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

function validatePassword(password) {
    return password.length >= 6; // Example validation
}