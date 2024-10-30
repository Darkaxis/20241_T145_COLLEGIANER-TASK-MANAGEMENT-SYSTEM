document.getElementById('addUserButton').addEventListener('click', async () => {
    const email = prompt("Enter Email:");
    const role = prompt("Enter Role:");

    if (email && role) {
        try {
            const response = await fetch('http://localhost:3000/eic/add/user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, role })
            });

            const result = await response.json();

            if (response.ok) {
                alert('OAuth URL generated. Check the console for the URL.');
                console.log(`OAuth URL for user with email ${email}: ${result.url}`);
            } else {
                alert(`Failed to generate OAuth URL: ${result.message}`);
            }
        } catch (error) {
            console.error('Error generating OAuth URL:', error);
            alert('An error occurred while generating the OAuth URL. Please try again.');
        }
    } else {
        alert('Email and role are required.');
    }
});