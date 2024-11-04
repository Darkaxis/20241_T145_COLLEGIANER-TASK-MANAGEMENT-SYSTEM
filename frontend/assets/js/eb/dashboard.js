document.addEventListener('DOMContentLoaded', async () => {
    
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    localStorage.setItem('token', token);
    if (token) {
        
        localStorage.setItem('token', token);
        // Remove the token from the URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
            alert('You are not logged in!');
            window.location.href = '/';
            return;
        }
    }
    
    // Use the token from local storage for fetching the user profile
    const storedToken = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/eb/profile', {
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
            profileImage.src = result.profileImage || '/assets/images/customer02.jpg'; // Use default image if none provided
            dropdownProfileImage.src = result.profileImage || '/assets/images/customer02.jpg';

            
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