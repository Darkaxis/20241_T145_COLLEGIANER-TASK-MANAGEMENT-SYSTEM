



document.addEventListener('DOMContentLoaded', async function() {
    
    const password = document.getElementById('password');
    password.addEventListener('input', validatePassword);
    const confirmPassword = document.getElementById('confirm-password');
    const form = document.getElementById('newPasswordForm');
    const urlParams = new URLSearchParams(window.location.search);
    const encodedData = urlParams.get('token');
    
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
    
        const value = password.value;
        const isValid = value.length >= 8 &&
            /[A-Z]/.test(value) &&
            /[a-z]/.test(value) &&
            /[0-9]/.test(value) &&
            /[!@#$%^&*]/.test(value);
    
        if (!isValid) {
            alert('Please meet all password requirements');
            return;
        }
    
        if (password.value !== confirmPassword.value) {
            alert('Passwords do not match');
            return;
    
        }   
        
        try {
            const response = await fetch('https://localhost:3000/api/v1/login/reset-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                   
                    encodedData,
                    password: password.value
                })
            });
            
            if (response.ok) {
                alert('Password reset successful');
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Error:', error);
        }
    
    });
    function validatePassword() {
        const value = password.value;
    
        // Update requirements list
        document.getElementById('length').className = value.length >= 8 ? 'valid' : 'invalid';
        document.getElementById('uppercase').className = /[A-Z]/.test(value) ? 'valid' : 'invalid';
        document.getElementById('lowercase').className = /[a-z]/.test(value) ? 'valid' : 'invalid';
        document.getElementById('number').className = /[0-9]/.test(value) ? 'valid' : 'invalid';
        document.getElementById('special').className = /[!@#$%^&*]/.test(value) ? 'valid' : 'invalid';
    }
    
    function togglePassword(inputId) {
        const input = document.getElementById(inputId);
        const icon = input.nextElementSibling.querySelector('i');
    
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fa-regular fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fa-regular fa-eye';
        }
    }
    

});





