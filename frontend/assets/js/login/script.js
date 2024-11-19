document.addEventListener('DOMContentLoaded', () => {
    // Check if the token exists and redirect if valid
    checkTokenAndRedirect();

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

                if (userResponse.ok) {
                    const role = userResult.user.role;

                    // Redirect based on the role
                    if (role === 'Editor in Chief') {
                        window.location.href = 'https://localhost:4000/eic/dashboard';
                    } else if (role === 'Editorial Board') {
                        window.location.href = 'https://localhost:4000/eb/dashboard';
                    } else if (role === 'Staff') {
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

async function checkTokenAndRedirect() {
    try {
        const userResponse = await fetch('https://localhost:3000/api/v1/login/verify-token', {
            method: 'GET',
            credentials: 'include' // Include cookies in the request
        });
        const userResult = await userResponse.json();

        if (userResponse.ok) {
            const role = userResult.user.role;

            // Redirect based on the role
            if (role === 'Editor in Charge') { 
                window.location.href = 'https://localhost:4000/eic/dashboard';
            } else if (role === 'Editorial Board') {
                window.location.href = 'https://localhost:4000/eb/dashboard';
            } else if (role === 'Staff') {
                window.location.href = 'https://localhost:4000/staff/dashboard';
            }
        }
    } catch (error) {
        console.error('Error verifying token:', error);
        // No need to alert the user here, just log the error
    }
}