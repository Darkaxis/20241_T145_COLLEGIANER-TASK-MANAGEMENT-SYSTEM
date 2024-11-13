document.addEventListener("DOMContentLoaded", async () => {
  try {
    const userResponse = await fetch(
      "https://localhost:3000/api/v1/login/verify-token",
      {
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

    profileName.textContent = profileinfo.name;
    profileImage.src = profileinfo.profile || "/assets/images/customer02.jpg"; // change later
    dropdownProfileImage.src = profileinfo.profile || "/assets/images/customer02.jpg";
  } catch (error) {
    console.error("Error fetching user profile:", error);
    alert("An error occurred while fetching the user profile. Please try again.");
  }
  const googleLoginButton = document.getElementById('logout');
  googleLoginButton.addEventListener('click', () => {
     fetch(
        "https://localhost:3000/api/v1/login/logout",
        {
          method: "POST",
          credentials: "include", // Include cookies in the request
        })
      window.location.href = 'https://localhost:4000/'; // Redirect 
  });

  
});