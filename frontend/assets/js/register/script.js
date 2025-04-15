

document.addEventListener('DOMContentLoaded', async function() {
   

    const password = document.getElementById('password');
    password.addEventListener('input', validatePassword);
    const confirmPassword = document.getElementById('confirm-password');
    const form = document.getElementById('passwordForm');
    const urlParams = new URLSearchParams(window.location.search);
    const encodedData = urlParams.get('data');
    
    const name = urlParams.get('name');
    const nameElement = document.getElementById('name');
    nameElement.textContent = name;
    
    const checkifUserExists = await fetch('https://localhost:3000/api/v1/login/user', {
        method: 'POST',
        
        body: JSON.stringify({
            encodedData
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!checkifUserExists.ok) {
        alert('User already exists. Please login or reset your password.');
        console.log('checkifUserExists', checkifUserExists);
        window.location.href = '/login';
        return;
    }
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
            const response = await fetch('https://localhost:3000/api/v1/login/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    encodedData,
                    password: password.value
                })
            });
            
            if (response.ok) {
                alert('Registration successful');
                window.location.href = '/';
            }
            else {
                const errorData = await response.json();
                alert('Registration failed. error: ' + errorData.message);
            }
        } catch (error) {
            alert('Registration failed. error: ' + error.message);
            console.error('Error:', error);
            
        }
    
    });








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


