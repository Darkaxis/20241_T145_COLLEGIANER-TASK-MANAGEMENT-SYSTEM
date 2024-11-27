document.addEventListener('DOMContentLoaded', function() {
    initializeSearch();
});

function initializeSearch() {
    const searchInput = document.getElementById('taskSearch');
    if (searchInput) {
        searchInput.addEventListener('input', handleTaskSearch);
    }
}

function handleTaskSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    const taskColumns = document.querySelectorAll('.task-column');

    if (searchTerm === '') {
        showAllTasks();
        return;
    }

    taskColumns.forEach(column => {
        const tasks = column.querySelectorAll('.task-card');
        tasks.forEach(task => {
            const title = task.dataset.taskName.toLowerCase();
            const status = task.dataset.status;

            if (title.includes(searchTerm)) {
                task.classList.add('search-match');
                task.classList.remove('search-no-match');
                task.classList.add(`search-match-${status.toLowerCase().replace(' ', '-')}`);
            } else {
                task.classList.remove('search-match');
                task.classList.add('search-no-match');
                task.classList.remove(
                    'search-match-to-do',
                    'search-match-in-progress',
                    'search-match-checking',
                    'search-match-done'
                );
            }
        });
    });
}

function showAllTasks() {
    const taskCards = document.querySelectorAll('.task-card');
    taskCards.forEach(task => {
        task.classList.remove(
            'search-match',
            'search-no-match',
            'search-match-to-do',
            'search-match-in-progress',
            'search-match-checking',
            'search-match-done'
        );
    });
}