document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('https://localhost:3000/api/v1/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include' // Include cookies in the request
            });

            const result = await response.json();
            console.log(result);
            if (response.ok) {
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
    const googleLoginButton = document.getElementById('google');
    googleLoginButton.addEventListener('click', () => {
        window.location.href = 'https://localhost:3000/api/v1/google/oauth2/auth'; // Redirect 
    });
});