document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile script loaded');

    const viewProfileBtn = document.getElementById('viewProfile');
    const profileCard = document.getElementById('profileCard');
    const closeProfileBtn = document.getElementById('closeProfile');

    console.log('Profile button:', viewProfileBtn);
    console.log('Profile card:', profileCard);
    console.log('Close button:', closeProfileBtn);

    if (viewProfileBtn) {
        viewProfileBtn.addEventListener('click', function(e) {
            console.log('Profile clicked');
            e.preventDefault();
            e.stopPropagation();
            profileCard.classList.add('show');
            console.log('Show class added');
            console.log('Profile card classes:', profileCard.classList);
        });
    }

    if (closeProfileBtn) {
        closeProfileBtn.addEventListener('click', function(e) {
            console.log('Close clicked');
            e.preventDefault();
            profileCard.classList.remove('show');
        });
    }

    // Close when clicking outside the profile card
    document.addEventListener('click', function(e) {
        if (profileCard.classList.contains('show') &&
            !profileCard.querySelector('.profile-card-content').contains(e.target) &&
            e.target !== viewProfileBtn) {
            profileCard.classList.remove('show');
        }
    });

    // Close profile card when pressing Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && profileCard.classList.contains('show')) {
            profileCard.classList.remove('show');
        }
    });

    // Prevent clicks inside the profile card from closing it
    profileCard.querySelector('.profile-card-content').addEventListener('click', function(e) {
        e.stopPropagation();
    });
});