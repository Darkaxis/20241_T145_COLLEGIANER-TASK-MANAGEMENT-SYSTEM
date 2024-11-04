document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
    
        try {
            const response = await fetch('http://localhost:3000/eic/login', { // Use the full URL of the back-end server
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();
            console.log(result);
            if (response.ok) {
                // Store the token in local storage
                localStorage.setItem('token', result.token);
                alert('Login successful!');
                // Redirect to the dashboard page
                window.location.href = '/eic/dashboard';
            } else {
                alert(`Login failed: ${result.message}`);
            }
        } catch (error) {
            console.error('Error during login:', error);
            alert('An error occurred during login. Please try again.');
        }
    });

    // Google login button click handler
    const googleLoginButton = document.getElementById('googleLoginButton');
    googleLoginButton.addEventListener('click', () => {
        window.location.href = 'http://localhost:3000/google/oauth2/auth'; // Redirect to the OAuth URL
    });
});