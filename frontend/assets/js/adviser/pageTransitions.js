document.addEventListener('DOMContentLoaded', function() {
    // Add fade-in effect when page loads
    document.body.classList.add('fade-in');

    // Handle all navigation links
    document.querySelectorAll('.sidebar-section a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');

            // Add fade-out effect
            document.body.classList.add('fade-out');
            document.body.classList.remove('fade-in');

            // Navigate to new page after transition
            setTimeout(() => {
                window.location.href = href;
            }, 300); // Match this with CSS transition duration
        });
    });
});