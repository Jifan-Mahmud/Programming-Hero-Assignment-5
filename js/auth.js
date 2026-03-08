
document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect to main page
    if (localStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = 'index.html';
    }

    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const usernameInput = document.getElementById('username').value;
            const passwordInput = document.getElementById('password').value;

            // Admin credentials check
            if (usernameInput === 'admin' && passwordInput === 'admin123') {
                localStorage.setItem('isLoggedIn', 'true');
                window.location.href = 'index.html';
            } else {
                loginError.style.display = 'block';
            }
        });
    }
});