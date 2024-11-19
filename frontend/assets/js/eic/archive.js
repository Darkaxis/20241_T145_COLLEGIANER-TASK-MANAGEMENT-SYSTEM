document.addEventListener('DOMContentLoaded', function() {
    // View Controls (List/Grid Toggle)
    const viewControls = document.querySelectorAll('.view-btn');
    const archiveItems = document.querySelector('.archive-items');

    viewControls.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            viewControls.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            // Toggle view class on archive-items
            const viewType = btn.getAttribute('data-view');
            archiveItems.className = `archive-items ${viewType}-view`;
        });
    });

    // Archive Item Actions
    const archiveList = document.querySelector('.archive-list-container');
    const emptyState = document.querySelector('.archive-empty-state');

    document.querySelectorAll('.archive-item').forEach(item => {
        // View Details Button
        item.querySelector('.action-btn.view').addEventListener('click', function() {
            // Implement view details functionality
            showDetails(item);
        });

        // Restore Button
        item.querySelector('.action-btn.restore').addEventListener('click', function() {
            // Implement restore functionality
            restoreItem(item);
        });

        // Delete Button
        item.querySelector('.action-btn.delete').addEventListener('click', function() {
            // Implement delete functionality
            deleteItem(item);
        });
    });

    // Pagination
    const pageButtons = document.querySelectorAll('.page-btn');
    const prevButton = document.querySelector('.page-btn.prev');
    const nextButton = document.querySelector('.page-btn.next');

    pageButtons.forEach(button => {
        if (!button.classList.contains('prev') && !button.classList.contains('next')) {
            button.addEventListener('click', () => {
                pageButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                loadPage(parseInt(button.textContent));
            });
        }
    });

    prevButton.addEventListener('click', () => {
        const currentPage = getCurrentPage();
        if (currentPage > 1) {
            loadPage(currentPage - 1);
        }
    });

    nextButton.addEventListener('click', () => {
        const currentPage = getCurrentPage();
        const maxPage = getMaxPage();
        if (currentPage < maxPage) {
            loadPage(currentPage + 1);
        }
    });

    // Helper Functions
    function showDetails(item) {
        // Example implementation
        const title = item.querySelector('h4').textContent;
        alert(`Viewing details for: ${title}`);
        // You could show a modal here with full details
    }

    function restoreItem(item) {
        // Example implementation
        if (confirm('Are you sure you want to restore this item?')) {
            item.classList.add('restoring');
            // Simulate API call
            setTimeout(() => {
                item.remove();
                checkEmptyState();
                showToast('Item restored successfully!');
            }, 500);
        }
    }

    function deleteItem(item) {
        // Example implementation
        if (confirm('Are you sure you want to delete this item permanently?')) {
            item.classList.add('deleting');
            // Simulate API call
            setTimeout(() => {
                item.remove();
                checkEmptyState();
                showToast('Item deleted successfully!');
            }, 500);
        }
    }

    function checkEmptyState() {
        const hasItems = document.querySelectorAll('.archive-item').length > 0;
        archiveList.style.display = hasItems ? 'block' : 'none';
        emptyState.style.display = hasItems ? 'none' : 'block';
    }

    function getCurrentPage() {
        const activePage = document.querySelector('.page-numbers .page-btn.active');
        return parseInt(activePage.textContent);
    }

    function getMaxPage() {
        const pageNumbers = document.querySelectorAll('.page-numbers .page-btn');
        return pageNumbers.length;
    }

    function loadPage(pageNumber) {
        // Update active state
        document.querySelectorAll('.page-numbers .page-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.textContent) === pageNumber);
        });

        // Update prev/next button states
        prevButton.disabled = pageNumber === 1;
        nextButton.disabled = pageNumber === getMaxPage();

        // Simulate loading new data
        simulatePageLoad(pageNumber);
    }

    function simulatePageLoad(pageNumber) {
        const archiveItems = document.querySelector('.archive-items');
        archiveItems.style.opacity = '0.5';

        // Simulate API call
        setTimeout(() => {
            archiveItems.style.opacity = '1';
            // Here you would normally update the content based on the page number
            showToast(`Loaded page ${pageNumber}`);
        }, 500);
    }

    function showToast(message) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);

        // Remove toast after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Initial check for empty state
    checkEmptyState();
});