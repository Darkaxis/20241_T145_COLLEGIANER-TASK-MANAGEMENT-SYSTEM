// Global variable to store current task card
let currentTaskCard = null;

// Initialize event listeners when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Event listener for saving new task
    document.getElementById('saveTaskButton').addEventListener('click', function() {
        clearErrorMessages();

        // Get all form values
        const title = document.getElementById('taskTitleInput').value.trim();
        const description = document.getElementById('taskDescriptionInput').value.trim();
        const status = document.getElementById('taskStatusInput').value;
        const privacy = document.getElementById('taskPrivacyInput').value;
        const hideFrom = document.getElementById('hideUserInput').value.trim();
        const assignTo = document.getElementById('taskAssignInput').value.trim();
        const date = document.getElementById('taskDateInput').value;
        const category = document.getElementById('taskCategoryInput').value.trim();
        const link = document.getElementById('taskLinkInput').value.trim();

        // Validation
        let hasErrors = false;

        // Required fields validation with specific messages
        if (!title) {
            showErrorMessage('taskTitleInput', 'Please enter title');
            hasErrors = true;
        }
        if (!description) {
            showErrorMessage('taskDescriptionInput', 'Please enter description');
            hasErrors = true;
        }
        if (!status) {
            showErrorMessage('taskStatusInput', 'Please select status');
            hasErrors = true;
        }
        if (!privacy) {
            showErrorMessage('taskPrivacyInput', 'Please select privacy');
            hasErrors = true;
        }
        if (!assignTo) {
            showErrorMessage('taskAssignInput', 'Please enter assign to');
            hasErrors = true;
        }
        if (!date) {
            showErrorMessage('taskDateInput', 'Please select date');
            hasErrors = true;
        }
        if (!category) {
            showErrorMessage('taskCategoryInput', 'Please enter category');
            hasErrors = true;
        }
        if (!link) {
            showErrorMessage('taskLinkInput', 'Please enter link');
            hasErrors = true;
        }
        if (privacy === 'Private Except' && !hideFrom) {
            showErrorMessage('hideUserInput', 'Please enter hide from');
            hasErrors = true;
        }

        if (hasErrors) {
            return;
        }

        // Create task card
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        taskCard.draggable = true;
        taskCard.id = 'task-' + Date.now();

        // Set data attributes
        taskCard.dataset.title = title;
        taskCard.dataset.description = description;
        taskCard.dataset.status = status;
        taskCard.dataset.privacy = privacy;
        taskCard.dataset.hideFrom = hideFrom;
        taskCard.dataset.assign = assignTo;
        taskCard.dataset.date = date;
        taskCard.dataset.category = category;
        taskCard.dataset.link = link;

        // Create card content
        let privacyIcon = privacy === 'Public' ? 'fa-globe' : 'fa-lock';
        let privacyText = privacy;
        if (privacy === 'Private Except') {
            privacyIcon = 'fa-user-secret';
            privacyText = `Private Except: ${hideFrom}`;
        }

        taskCard.innerHTML = `
            <div class="task-card-content">
                <h3>${title}</h3>
                <p><i class="fa-regular fa-user"></i> ${assignTo}</p>
                <p><i class="fa-regular fa-calendar"></i> ${date}</p>
                <p><i class="fas ${privacyIcon}"></i> ${privacyText}</p>
            </div>
        `;

        // Add event listeners
        taskCard.addEventListener('dragstart', drag);
        taskCard.addEventListener('click', function() {
            openTaskDetails(this);
        });

        // Find the correct column
        let columnId;
        switch (status) {
            case 'To Do':
                columnId = 'todo-column';
                break;
            case 'In Progress':
                columnId = 'in-progress-column';
                break;
            case 'Checking':
                columnId = 'checking-column';
                break;
            case 'Done':
                columnId = 'done-column';
                break;
            default:
                columnId = 'todo-column';
        }

        // Add to appropriate column
        const column = document.getElementById(columnId);
        if (column) {
            column.appendChild(taskCard);
            updateTaskCounts();

            // Close modal and reset form
            const modal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
            modal.hide();
            clearAddTaskForm();
        }
    });

    // Initialize task counts
    updateTaskCounts();

    // Add event listener for saving task changes when modal closes
    const taskDetailModal = document.getElementById('taskDetailModal');
    taskDetailModal.addEventListener('hide.bs.modal', function() {
        saveTaskChanges();
    });

    // Add status change handler in the view task modal
    document.getElementById('taskStatus').addEventListener('change', function() {
        if (currentTaskCard) {
            currentTaskCard.dataset.status = this.value;

            // Move card to new column
            const columnId = this.value.toLowerCase().replace(' ', '-') + '-column';
            const newColumn = document.getElementById(columnId);
            if (newColumn) {
                newColumn.appendChild(currentTaskCard);
                updateTaskCounts();
            }
            updateTaskCard(currentTaskCard);
        }
    });

    // Privacy change handler
    document.getElementById('taskPrivacy').addEventListener('change', function() {
        if (currentTaskCard) {
            currentTaskCard.dataset.privacy = this.value;

            const hideContainer = document.getElementById('hideInputContainerView');
            if (this.value === 'Private Except') {
                hideContainer.style.display = 'block';
            } else {
                hideContainer.style.display = 'none';
                currentTaskCard.dataset.hideFrom = '';
            }
            updateTaskCard(currentTaskCard);
        }
    });

    // Hide from change handler
    document.getElementById('hideUserView').addEventListener('input', function() {
        if (currentTaskCard) {
            currentTaskCard.dataset.hideFrom = this.value;
            updateTaskCard(currentTaskCard);
        }
    });

    // Description change handler
    document.getElementById('taskDescription').addEventListener('input', function() {
        if (currentTaskCard) {
            currentTaskCard.dataset.description = this.value;
            updateTaskCard(currentTaskCard);
        }
    });

    // Assign to change handler
    document.getElementById('taskAssign').addEventListener('input', function() {
        if (currentTaskCard) {
            currentTaskCard.dataset.assign = this.value;
            updateTaskCard(currentTaskCard);
        }
    });

    // Date change handler
    document.getElementById('taskDate').addEventListener('change', function() {
        if (currentTaskCard) {
            currentTaskCard.dataset.date = this.value;
            updateTaskCard(currentTaskCard);
        }
    });

    // Category change handler
    document.getElementById('taskCategory').addEventListener('input', function() {
        if (currentTaskCard) {
            currentTaskCard.dataset.category = this.value;
            updateTaskCard(currentTaskCard);
        }
    });

    // Link change handler
    document.getElementById('taskLink').addEventListener('input', function() {
        if (currentTaskCard) {
            currentTaskCard.dataset.link = this.value;
            updateTaskCard(currentTaskCard);
        }
    });

    // Update the openTaskDetails function to handle status
    function openTaskDetails(taskCard) {
        currentTaskCard = taskCard;

        // Populate modal fields
        document.getElementById('taskTitle').value = taskCard.dataset.title;
        document.getElementById('taskDescription').value = taskCard.dataset.description;
        document.getElementById('taskStatus').value = taskCard.dataset.status; // This will show current status
        document.getElementById('taskPrivacy').value = taskCard.dataset.privacy;
        document.getElementById('taskAssign').value = taskCard.dataset.assign;
        document.getElementById('taskDate').value = taskCard.dataset.date;
        document.getElementById('taskCategory').value = taskCard.dataset.category;
        document.getElementById('taskLink').value = taskCard.dataset.link;

        // Handle hide from field for Private Except
        const hideContainer = document.getElementById('hideInputContainerView');
        if (taskCard.dataset.privacy === 'Private Except') {
            hideContainer.style.display = 'block';
            document.getElementById('hideUserView').value = taskCard.dataset.hideFrom;
        } else {
            hideContainer.style.display = 'none';
        }

        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('taskDetailModal'));
        modal.show();
    }

    // Add event listener for title changes
    document.getElementById('taskTitle').addEventListener('input', function() {
        if (currentTaskCard) {
            currentTaskCard.dataset.title = this.value;
            updateTaskCard(currentTaskCard);
        }
    });

    // Add privacy change handler for view task modal
    document.getElementById('taskPrivacy').addEventListener('change', function() {
        const hideContainer = document.getElementById('hideInputContainerView');
        const hideInput = document.getElementById('hideUserView');

        if (this.value === 'Private Except') {
            hideContainer.style.display = 'block';
            // If there's existing hide from data, show it
            if (currentTaskCard && currentTaskCard.dataset.hideFrom) {
                hideInput.value = currentTaskCard.dataset.hideFrom;
            }
        } else {
            hideContainer.style.display = 'none';
            hideInput.value = '';
        }

        // Update the task card data
        if (currentTaskCard) {
            currentTaskCard.dataset.privacy = this.value;
            if (this.value !== 'Private Except') {
                currentTaskCard.dataset.hideFrom = '';
            }
        }
    });

    // Add hide from input handler for view task modal
    document.getElementById('hideUserView').addEventListener('change', function() {
        if (currentTaskCard) {
            currentTaskCard.dataset.hideFrom = this.value;
        }
    });

    // Add event listeners for all fields in the view modal
    document.getElementById('taskTitle').addEventListener('input', function() {
        if (currentTaskCard) {
            currentTaskCard.dataset.title = this.value;
            updateTaskCard(currentTaskCard);
        }
    });

    // Description change
    document.getElementById('taskDescription').addEventListener('input', function() {
        if (currentTaskCard) {
            currentTaskCard.dataset.description = this.value;
        }
    });

    // Status change
    document.getElementById('taskStatus').addEventListener('change', function() {
        if (currentTaskCard) {
            currentTaskCard.dataset.status = this.value;
            // Move card to new column
            const columnId = this.value.toLowerCase().replace(' ', '-') + '-column';
            const newColumn = document.getElementById(columnId);
            if (newColumn) {
                newColumn.appendChild(currentTaskCard);
                updateTaskCounts();
            }
        }
    });

    // Privacy change
    document.getElementById('taskPrivacy').addEventListener('change', function() {
        if (currentTaskCard) {
            currentTaskCard.dataset.privacy = this.value;
            const hideContainer = document.getElementById('hideInputContainerView');
            if (this.value === 'Private Except') {
                hideContainer.style.display = 'block';
            } else {
                hideContainer.style.display = 'none';
                currentTaskCard.dataset.hideFrom = '';
            }
            updateTaskCard(currentTaskCard);
        }
    });

    // Hide from change
    document.getElementById('hideUserView').addEventListener('input', function() {
        if (currentTaskCard) {
            currentTaskCard.dataset.hideFrom = this.value;
            updateTaskCard(currentTaskCard);
        }
    });

    // Assign to change
    document.getElementById('taskAssign').addEventListener('input', function() {
        if (currentTaskCard) {
            currentTaskCard.dataset.assign = this.value;
            updateTaskCard(currentTaskCard);
        }
    });

    // Date change
    document.getElementById('taskDate').addEventListener('change', function() {
        if (currentTaskCard) {
            currentTaskCard.dataset.date = this.value;
            updateTaskCard(currentTaskCard);
        }
    });

    // Category change
    document.getElementById('taskCategory').addEventListener('input', function() {
        if (currentTaskCard) {
            currentTaskCard.dataset.category = this.value;
            updateTaskCard(currentTaskCard);
        }
    });

    // Link change
    document.getElementById('taskLink').addEventListener('input', function() {
        if (currentTaskCard) {
            currentTaskCard.dataset.link = this.value;
            updateTaskCard(currentTaskCard);
        }
    });
});