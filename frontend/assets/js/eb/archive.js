document.addEventListener('DOMContentLoaded', function() {
    // Dummy data for completed tasks
    const dummyCompletedTasks = [{
            id: 1,
            name: 'Website Redesign',
            assignedBy: 'Reynante Baldivino',
            assignedTo: 'Margaret Zoe Neri',
            deadline: '2024-03-15',
            description: 'Complete overhaul of the company website with modern design principles',
            category: 'Design',
            privacy: 'Team',
            link: 'https://github.com/website-redesign'
        },
        {
            id: 2,
            name: 'Database Migration',
            assignedBy: 'Margaret Zoe Neri',
            assignedTo: 'Yed Francois Cagang',
            deadline: '2024-03-10',
            description: 'Migration of legacy database to new cloud infrastructure',
            category: 'Backend',
            privacy: 'Private',
            link: 'https://gitlab.com/database-migration'
        },
        {
            id: 3,
            name: 'User Authentication System',
            assignedBy: 'Yed Francois Cagang',
            assignedTo: 'Aubie Bryne Hallazgo',
            deadline: '2024-03-08',
            description: 'Implement secure user authentication and authorization system',
            category: 'Security',
            privacy: 'Private',
            link: 'https://github.com/auth-system'
        },
        {
            id: 4,
            name: 'Mobile App UI Design',
            assignedBy: 'Aubie Bryne Hallazgo',
            assignedTo: 'Margaret Zoe Neri',
            deadline: '2024-03-12',
            description: 'Design user interface for mobile application',
            category: 'Design',
            privacy: 'Team',
            link: 'https://figma.com/mobile-ui'
        },
        {
            id: 5,
            name: 'API Documentation',
            assignedBy: 'Reynante Baldivino',
            assignedTo: 'Yed Francois Cagang',
            deadline: '2024-03-14',
            description: 'Create comprehensive API documentation for developers',
            category: 'Documentation',
            privacy: 'Public',
            link: 'https://docs.api-documentation.com'
        }
    ];

    // Initialize localStorage with dummy data if empty OR if there are no tasks
    if (!localStorage.getItem('completedTasks') || JSON.parse(localStorage.getItem('completedTasks')).length === 0) {
        localStorage.setItem('completedTasks', JSON.stringify(dummyCompletedTasks));
    }

    // Get completed tasks from localStorage
    const completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || [];

    function displayCompletedTasks() {
        const tableBody = document.querySelector('.table-body');
        tableBody.innerHTML = '';

        if (completedTasks.length === 0) {
            checkEmptyState();
            return;
        }

        completedTasks.forEach(task => {
            const archiveItem = document.createElement('div');
            archiveItem.className = 'archive-item';
            archiveItem.innerHTML = `
                <div class="col-task task-name-clickable">${task.name}</div>
                <div class="col-assigned">${task.assignedBy}</div>
                <div class="col-actions">
                    <button class="action-btn restore">
                        <i class="fas fa-undo"></i> Restore
                    </button>
                    <button class="action-btn delete">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
                <p class="text-success completion-status"><i class="fas fa-check-circle"></i> Completed</p>
            `;

            // Add click event for task name
            const taskNameElement = archiveItem.querySelector('.task-name-clickable');
            taskNameElement.style.cursor = 'pointer'; // Add pointer cursor
            taskNameElement.addEventListener('click', () => showTaskDetails(task));

            // Existing event listeners
            archiveItem.querySelector('.action-btn.restore').addEventListener('click', () => restoreItem(task, archiveItem));
            archiveItem.querySelector('.action-btn.delete').addEventListener('click', () => deleteItem(task, archiveItem));

            tableBody.appendChild(archiveItem);
        });
    }

    function restoreItem(task, element) {
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-icon">
                    <i class="fas fa-undo"></i>
                </div>
                <h3>Restore Task</h3>
                <p>Are you sure you want to restore "${task.name}"?</p>
                <div class="modal-buttons">
                    <button class="cancel-btn">Cancel</button>
                    <button class="confirm-btn">Restore</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.cancel-btn').onclick = () => {
            modal.remove();
        };

        modal.querySelector('.confirm-btn').onclick = () => {
            element.classList.add('fade-out');
            const index = completedTasks.findIndex(t => t.id === task.id);
            if (index > -1) {
                completedTasks.splice(index, 1);
                localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
            }

            setTimeout(() => {
                element.remove();
                checkEmptyState();
                showNotification('Task restored successfully');
                modal.remove();
            }, 300);
        };
    }

    function deleteItem(task, element) {
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.innerHTML = `
            <div class="modal-content delete">
                <div class="modal-icon">
                    <i class="fas fa-trash"></i>
                </div>
                <h3>Delete Task</h3>
                <p>Are you sure you want to permanently delete "${task.name}"?</p>
                <div class="modal-buttons">
                    <button class="cancel-btn">Cancel</button>
                    <button class="confirm-btn delete">Delete</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.cancel-btn').onclick = () => {
            modal.remove();
        };

        modal.querySelector('.confirm-btn').onclick = () => {
            element.classList.add('fade-out');
            const index = completedTasks.findIndex(t => t.id === task.id);
            if (index > -1) {
                completedTasks.splice(index, 1);
                localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
            }

            setTimeout(() => {
                element.remove();
                checkEmptyState();
                showNotification('Task deleted successfully');
                modal.remove();
            }, 300);
        };
    }

    function checkEmptyState() {
        const tableBody = document.querySelector('.table-body');
        if (completedTasks.length === 0) {
            tableBody.innerHTML = `
                <div class="empty-state">
                    <div class="empty-message">
                        <i class="fas fa-box-open"></i>
                        <p>No completed tasks found</p>
                    </div>
                </div>
            `;
        }
    }

    function showNotification(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Update the showTaskDetails function
    function showTaskDetails(task) {
        const modal = document.getElementById('taskDetailModal');

        // Update modal content
        document.getElementById('taskDetailTitle').textContent = task.name;
        document.getElementById('taskDetailAssignedBy').textContent = task.assignedBy;
        document.getElementById('taskDetailAssignedTo').textContent = task.assignedTo || 'Not specified';
        document.getElementById('taskDetailDeadline').textContent = task.deadline || 'No deadline set';
        document.getElementById('taskDetailDescription').textContent = task.description || 'No description provided';
        document.getElementById('taskDetailCategory').textContent = task.category || 'Uncategorized';
        document.getElementById('taskDetailPrivacy').textContent = task.privacy || 'Public';

        // Show modal with animation
        modal.style.display = 'flex';
        // Force reflow
        modal.offsetHeight;
        modal.classList.add('show');

        // Handle link display
        const linkContainer = document.getElementById('taskDetailLinkContainer');
        const linkElement = document.getElementById('taskDetailLink');
        if (task.link) {
            linkContainer.style.display = 'block';
            linkElement.innerHTML = `
                <div class="link-wrapper">
                    <a href="${task.link}" target="_blank" class="task-link">
                        <i class="fas fa-external-link-alt"></i>
                        <span>${task.link}</span>
                    </a>
                    <button class="copy-link-btn" onclick="copyToClipboard('${task.link}')">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            `;
        } else {
            linkContainer.style.display = 'block';
            linkElement.textContent = 'No link provided';
        }
    }

    function closeTaskDetail() {
        const modal = document.getElementById('taskDetailModal');
        modal.classList.add('hiding');

        // Wait for animation to complete before hiding
        setTimeout(() => {
            modal.classList.remove('show', 'hiding');
            modal.style.display = 'none';
        }, 300);
    }

    // Add this function for copying links
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Show a toast notification
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.innerHTML = `
                <i class="fas fa-check"></i>
                <span class="toast-message">Link copied to clipboard</span>
            `;
            document.body.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 100);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        });
    }

    // Initialize the display
    displayCompletedTasks();

    // Close button click handler
    const closeBtn = document.querySelector('.task-detail-modal .close-btn');
    if (closeBtn) {
        closeBtn.onclick = closeTaskDetail;
    }

    // Click outside to close
    const modal = document.getElementById('taskDetailModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeTaskDetail();
            }
        });
    }
});