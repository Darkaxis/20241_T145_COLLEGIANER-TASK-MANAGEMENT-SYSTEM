document.addEventListener('DOMContentLoaded', () => {
    // Check if the token exists and redirect if valid
    checkTokenAndRedirect();

    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', async(event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Get the reCAPTCHA response token
        const recaptchaToken = grecaptcha.getResponse();

        if (!recaptchaToken) {
            alert('Please complete the reCAPTCHA verification');
            return;
        }

        try {
            const response = await fetch('https://localhost:3000/api/v1/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    recaptchaToken
                }),
                credentials: 'include'
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
                    if (role === 'Editor in Charge') {
                        window.location.href = 'https://localhost:4000/eic/dashboard';
                    } else if (role === 'Editorial Board') {
                        window.location.href = 'https://localhost:4000/eb/dashboard';
                    } else if (role === 'Staff') {
                        window.location.href = 'https://localhost:4000/staff/dashboard';
                    }
                    else if (role === "Adviser"){
                        window.location.href = 'https://localhost:4000/adviser/dashboard';
                    }
                } else {
                    console.error('Error verifying token:', userResult.message);
                    alert('Error verifying token. Please try again.');
                }
            } else {
                alert(`Login failed: ${result.message}`);
                resetRecaptcha();
            }
        } catch (error) {
            console.error('Error during login:', error);
            alert('An error occurred during login. Please try again.');
            resetRecaptcha();
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

window.onRecaptchaComplete = function() {
    console.log('reCAPTCHA completed');
};

function resetRecaptcha() {
    grecaptcha.reset();
}