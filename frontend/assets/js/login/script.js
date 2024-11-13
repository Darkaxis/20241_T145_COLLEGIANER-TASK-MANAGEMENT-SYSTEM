document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('https://localhost:3000/api/v1/login/', {
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
                // Fetch user information
                const userResponse = await fetch('https://localhost:3000/api/v1/login/verify-token', {
                    method: 'GET',
                    credentials: 'include' // Include cookies in the request
                });
                const userResult = await userResponse.json();
                console.log('User:', userResult);

                if (userResponse.ok) {
                    const role = userResult.user.role;

                    // Redirect based on the role
                    if (role === 'eic') {
                        window.location.href = 'https://localhost:4000/eic/dashboard';
                    } else if (role === 'eb') {
                        window.location.href = 'https://localhost:4000/staff/dashboard';
                    } else if (role === 'staff') {
                        window.location.href = 'https://localhost:4000/staff/dashboard';
                    }
                } else {
                    console.error('Error verifying token:', userResult.message);
                    alert('Error verifying token. Please try again.');
                }
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