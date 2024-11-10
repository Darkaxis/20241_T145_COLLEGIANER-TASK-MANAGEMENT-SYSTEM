document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile script loaded');

    const viewProfile = document.getElementById('viewProfile');
    const profileCard = document.getElementById('profileCard');
    const closeProfile = document.getElementById('closeProfile');

    console.log('viewProfile:', viewProfile);
    console.log('profileCard:', profileCard);

    if (viewProfile) {
        viewProfile.addEventListener('click', function(e) {
            console.log('Profile clicked');
            e.preventDefault();
            e.stopPropagation();
            profileCard.classList.add('show');
            console.log('Added show class');
        });
    }

    if (closeProfile) {
        closeProfile.addEventListener('click', function() {
            console.log('Close clicked');
            profileCard.classList.remove('show');
        });
    }

    // Close profile card when pressing Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && profileCard.classList.contains('show')) {
            profileCard.classList.remove('show');
        }
    });
});