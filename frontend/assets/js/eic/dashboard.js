document.addEventListener('DOMContentLoaded', async () => {
    // Extract the token from the URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    

    // Get the token from local storage
    let storedToken = localStorage.getItem('token');
    
    if (!storedToken) {
        alert('You are not logged in!');
        window.location.href = '/';
        return;
    }

    console.log('Stored Token:', storedToken);
    // Use the token from local storage for fetching the user profile
    try {
        let response = await fetch('http://localhost:3000/eic/profile', { 
            headers: {
                'Authorization': `Bearer ${storedToken}`
            }
        });


        const result = await response.json();

        if (response.ok) {
            const profileName = document.getElementById('profileName');
            const profileImage = document.getElementById('profileImage');
            const dropdownProfileImage = document.getElementById('dropdownProfileImage');

            profileName.textContent = result.name;
            profileImage.src = result.profileImage || '/assets/images/customer02.jpg'; // change later
            dropdownProfileImage.src = result.profileImage || '/assets/images/customer02.jpg';

            // const userProfile = document.getElementById('userProfile');
            // userProfile.innerHTML = `
            //     <p>Name: ${result.name}</p>
            //     <p>Email: ${result.email}</p>
            // `;
        } else {
            alert(`Failed to load user profile: ${result.message}`);
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        alert('An error occurred while fetching the user profile. Please try again.');
    }

    // Logout functionality
    const logoutButton = document.getElementById('logoutButton');
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/';
    });
});