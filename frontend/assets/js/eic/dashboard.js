document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');

    if (!token) {
        alert('You are not logged in!');
        window.location.href = '/';
        return;
    }

  
        const response = await fetch('http://localhost:3000/eic/profile', { 
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (response.ok) {
            const profileName = document.getElementById('profileName');
            const profileImage = document.getElementById('profileImage');
            const dropdownProfileImage = document.getElementById('dropdownProfileImage');

            profileName.textContent = result.name;
            profileImage.src = result.profileImage || '/assets/images/customer02.jpg'; // Use default image if none provided
            dropdownProfileImage.src = result.profileImage || '/assets/images/customer02.jpg';

            // const userProfile = document.getElementById('userProfile');
            // userProfile.innerHTML = `
            //     <p>Name: ${result.name}</p>
            //     <p>Email: ${result.email}</p>
            // `;
        } else {
            alert(`Failed to load user profile: ${result.message}`);
        }

    // Logout functionality
    const logoutButton = document.getElementById('logoutButton');
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    });

    
});