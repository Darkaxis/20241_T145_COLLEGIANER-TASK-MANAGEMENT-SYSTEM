// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Profile view button click handler
    const viewProfileBtn = document.getElementById('viewProfile');
    if (viewProfileBtn) {
        viewProfileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showProfile();
        });
    }

    // Close button click handler
    const closeProfileBtn = document.getElementById('closeProfile');
    if (closeProfileBtn) {
        closeProfileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const profileCard = document.getElementById('profileCard');
            profileCard.classList.remove('show');
        });
    }

    // Click outside to close
    const profileCard = document.getElementById('profileCard');
    if (profileCard) {
        profileCard.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    }
});

function showProfile() {
    const profileCard = document.getElementById('profileCard');
    if (profileCard) {
        profileCard.classList.add('show');
        console.log('Profile card shown'); // Debug log
    } else {
        console.error('Profile card element not found'); // Debug log
    }
}

document.addEventListener("DOMContentLoaded", async() => {
    try {
        const userResponse = await fetch(
            "https://localhost:3000/api/v1/login/verify-token", {
                method: "GET",
                credentials: "include", // Include cookies in the request
            }
        );

        if (!userResponse.ok) {
            // If the response is not OK, redirect to the login page
            window.location.href = 'https://localhost:4000/';
            return;
        }

        const userResult = await userResponse.json();

        // Use the token from local storage for fetching the user profile
        const profileinfo = userResult.user;
    
       

        const profileName = document.getElementById("profileName");
        const profileImage = document.getElementById("profileImage");
        const dropdownProfileImage = document.getElementById("dropdownProfileImage");
        const sidebarprofileName = document.getElementById("sidebarprofileName");
        const sidebarprofileImage = document.getElementById("sidebarprofileImage");
        const email = document.getElementById("sidebarEmail");
        const role = document.getElementById("sidebarRole");


        profileName.textContent = profileinfo.name;
        profileImage.src = profileinfo.profile || "/assets/images/customer02.jpg"; // change later
        dropdownProfileImage.src = profileinfo.profile || "/assets/images/customer02.jpg";
        sidebarprofileName.textContent = profileinfo.name;
        sidebarprofileImage.src = profileinfo.profile || "/assets/images/customer02.jpg";
        email.textContent = profileinfo.email;
        role.textContent = profileinfo.role;




    } catch (error) {
        console.error("Error fetching user profile:", error);
        //alert("An error occurred while fetching the user profile. Please try again.");
    }
    const googleLoginButton = document.getElementById('logout');
    googleLoginButton.addEventListener('click', () => {
        fetch(
            "https://localhost:3000/api/v1/login/logout", {
                method: "POST",
                credentials: "include", // Include cookies in the request
            })
        window.location.href = 'https://localhost:4000/'; // Redirect 
    });


});