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
        const assignedBy = document.getElementById('taskAssigneeInput').value.trim();
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
        if (!assignedBy) {
            showErrorMessage('taskAssigneeInput', 'Please enter assigned by');
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
        taskCard.dataset.assignee = assignedBy;
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

    // Assigned by change handler
    document.getElementById('taskAssignee').addEventListener('input', function() {
        if (currentTaskCard) {
            currentTaskCard.dataset.assignee = this.value;
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
        document.getElementById('taskAssignee').value = taskCard.dataset.assignee;
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

    // Assigned by change
    document.getElementById('taskAssignee').addEventListener('input', function() {
        if (currentTaskCard) {
            currentTaskCard.dataset.assignee = this.value;
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

    // Update the modal close handler
    document.getElementById('taskDetailModal').addEventListener('hide.bs.modal', function() {
        if (currentTaskCard) {
            // Save all changes before closing
            const title = document.getElementById('taskTitle').value;
            const description = document.getElementById('taskDescription').value;
            const status = document.getElementById('taskStatus').value;
            const privacy = document.getElementById('taskPrivacy').value;
            const hideFrom = document.getElementById('hideUserView').value;
            const assignTo = document.getElementById('taskAssign').value;
            const assignedBy = document.getElementById('taskAssignee').value;
            const date = document.getElementById('taskDate').value;
            const category = document.getElementById('taskCategory').value;
            const link = document.getElementById('taskLink').value;

            // Update all task card data
            currentTaskCard.dataset.title = title;
            currentTaskCard.dataset.description = description;
            currentTaskCard.dataset.status = status;
            currentTaskCard.dataset.privacy = privacy;
            currentTaskCard.dataset.hideFrom = hideFrom;
            currentTaskCard.dataset.assign = assignTo;
            currentTaskCard.dataset.assignee = assignedBy;
            currentTaskCard.dataset.date = date;
            currentTaskCard.dataset.category = category;
            currentTaskCard.dataset.link = link;

            // Update the card display
            updateTaskCard(currentTaskCard);
        }
    });
});

// Drag and Drop functions
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const draggedElement = document.getElementById(data);
    const dropZone = ev.target.closest('.task-column');

    if (dropZone && draggedElement) {
        dropZone.appendChild(draggedElement);
        // Update task status based on column
        const newStatus = dropZone.id.replace('-column', '');
        draggedElement.dataset.status = newStatus;
        updateTaskCounts();
    }
}

function updateTaskCounts() {
    const columns = document.querySelectorAll('.task-column');
    columns.forEach(column => {
        const count = column.querySelectorAll('.task-card').length;
        const countElement = column.closest('.task-header').querySelector('.task-count');
        if (countElement) {
            countElement.textContent = count;
        }
    });
}

// Event listener for the plus icon to open add task modal
document.querySelector('.plus-icon').addEventListener('click', function() {
    const addTaskModal = new bootstrap.Modal(document.getElementById('addTaskModal'));
    addTaskModal.show();
});

// Function to toggle hide input visibility
function toggleHideInput() {
    const privacySelect = document.getElementById('taskPrivacyInput');
    const hideInputContainer = document.getElementById('hideInputContainer');
    hideInputContainer.style.display = privacySelect.value === 'Private Except' ? 'block' : 'none';
}

// Add this new function to save changes
function saveTaskChanges() {
    if (currentTaskCard) {
        // Update the dataset with new values including title and hide input
        currentTaskCard.dataset.title = document.getElementById('taskTitleInput').value;
        currentTaskCard.dataset.description = document.getElementById('taskDescription').value;
        currentTaskCard.dataset.status = document.getElementById('taskStatus').value;
        currentTaskCard.dataset.privacy = document.getElementById('taskPrivacy').value;

        // Save hide input value if privacy is "Private Except"
        if (currentTaskCard.dataset.privacy === 'Private Except') {
            currentTaskCard.dataset.hideFrom = document.getElementById('taskHideInput').value;
        }

        currentTaskCard.dataset.date = document.getElementById('taskDate').value;
        currentTaskCard.dataset.assign = document.getElementById('taskAssign').value;
        currentTaskCard.dataset.assignee = document.getElementById('taskAssignee').value;
        currentTaskCard.dataset.category = document.getElementById('taskCategory').value;
        currentTaskCard.dataset.link = document.getElementById('taskLink').value;

        // Update the visible card content
        currentTaskCard.innerHTML = `
            <h3>${currentTaskCard.dataset.title}</h3>
            <i class="fa-regular fa-user"></i> - ${currentTaskCard.dataset.assign}<br>
            <i class="fa-regular fa-calendar"></i> - ${currentTaskCard.dataset.date}<br>
            <i class="fa-solid fa-user-shield"></i> - ${currentTaskCard.dataset.privacy}
            ${currentTaskCard.dataset.privacy === 'Private Except' ? 
                `<br><i class="fa-solid fa-eye-slash"></i> - Hidden from: ${currentTaskCard.dataset.hideFrom}` : ''}
        `;

        // Move card to correct column if status changed
        const newStatus = currentTaskCard.dataset.status.toLowerCase();
        let columnId;
        switch(newStatus) {
            case 'in progress':
                columnId = 'in-progress-column';
                break;
            case 'checking':
                columnId = 'checking-column';
                break;
            case 'done':
                columnId = 'done-column';
                break;
            default:
                columnId = 'todo-column';
        }
        
        const newColumn = document.getElementById(columnId);
        if (newColumn && currentTaskCard.parentElement.id !== columnId) {
            newColumn.appendChild(currentTaskCard);
            updateTaskCounts();
        }
    }
}

function toggleHideDetailInput() {
    const privacySelect = document.getElementById('taskPrivacy');
    const hideInputContainer = document.getElementById('hideInputDetailContainer');
    hideInputContainer.style.display = privacySelect.value === 'Private Except' ? 'block' : 'none';
}

// Function to clear the add task form completely
function clearAddTaskForm() {
    const form = document.getElementById('addTaskForm');
    if (form) {
        form.reset();
    }
    clearErrorMessages();
}

// Add this to handle modal close/dismiss
document.getElementById('addTaskModal').addEventListener('hidden.bs.modal', function () {
    clearAddTaskForm();
});

// Also add this to handle when the modal opens
document.getElementById('addTaskModal').addEventListener('show.bs.modal', function () {
    clearAddTaskForm();
});

// Update the createTask function
function createTask(title, description, status, privacy, hideFrom, assignTo, assignedBy, date, category, link) {
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
    taskCard.dataset.assignee = assignedBy;
    taskCard.dataset.date = date;
    taskCard.dataset.category = category;
    taskCard.dataset.link = link;

    // Create card content with privacy info
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

    // Add to appropriate column
    const columnId = status.toLowerCase().replace(' ', '-') + '-column';
    const column = document.getElementById(columnId);
    if (column) {
        column.appendChild(taskCard);
        updateTaskCounts();
    }
}

// Update the updateTaskCard function
function updateTaskCard(taskCard) {
    const title = taskCard.dataset.title;
    const assignTo = taskCard.dataset.assign;
    const date = taskCard.dataset.date;
    const privacy = taskCard.dataset.privacy;
    const hideFrom = taskCard.dataset.hideFrom;

    let privacyIcon = privacy === 'Public' ? 'fa-globe' : 'fa-lock';
    let privacyText = privacy;
    if (privacy === 'Private Except') {
        privacyIcon = 'fa-user-secret';
        privacyText = `Private Except: ${hideFrom}`;
    }

    let cardContent = `
        <div class="task-card-content">
            <h3>${title}</h3>
            <p><i class="fa-regular fa-user"></i> ${assignTo}</p>
            <p><i class="fa-regular fa-calendar"></i> ${date}</p>
            <p><i class="fas ${privacyIcon}"></i> ${privacyText}</p>
        </div>
    `;
    
    taskCard.innerHTML = cardContent;
}

// Add this event listener to update the card when privacy changes
document.getElementById('taskPrivacy').addEventListener('change', function() {
    if (currentTaskCard) {
        const newPrivacy = this.value;
        const hideFrom = document.getElementById('hideUserView').value;
        
        currentTaskCard.dataset.privacy = newPrivacy;
        currentTaskCard.dataset.hideFrom = newPrivacy === 'Private Except' ? hideFrom : '';
        
        updateTaskCard(currentTaskCard);
    }
});

// Add this event listener to update the card when hide from changes
document.getElementById('hideUserView').addEventListener('change', function() {
    if (currentTaskCard && currentTaskCard.dataset.privacy === 'Private Except') {
        currentTaskCard.dataset.hideFrom = this.value;
        updateTaskCard(currentTaskCard);
    }
});

// Helper function to show error message
function showErrorMessage(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = 'red';
    errorDiv.style.fontSize = '12px';
    errorDiv.style.marginTop = '5px';
    errorDiv.textContent = message;
    
    // Remove any existing error message
    const existingError = field.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add the new error message
    field.parentElement.appendChild(errorDiv);
    field.classList.add('is-invalid');
}

// Helper function to clear error messages
function clearErrorMessages() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(error => error.remove());
    
    const invalidInputs = document.querySelectorAll('.is-invalid');
    invalidInputs.forEach(input => input.classList.remove('is-invalid'));
}

// Add modal close handler to save changes
document.getElementById('taskDetailModal').addEventListener('hide.bs.modal', function () {
    if (currentTaskCard) {
        const title = document.getElementById('taskTitle').value;
        const description = document.getElementById('taskDescription').value;
        const status = document.getElementById('taskStatus').value;
        const privacy = document.getElementById('taskPrivacy').value;
        const hideFrom = document.getElementById('hideUserView').value;
        const assignTo = document.getElementById('taskAssign').value;
        const assignedBy = document.getElementById('taskAssignee').value;
        const date = document.getElementById('taskDate').value;
        const category = document.getElementById('taskCategory').value;
        const link = document.getElementById('taskLink').value;

        // Update all task card data
        currentTaskCard.dataset.title = title;
        currentTaskCard.dataset.description = description;
        currentTaskCard.dataset.status = status;
        currentTaskCard.dataset.privacy = privacy;
        currentTaskCard.dataset.hideFrom = hideFrom;
        currentTaskCard.dataset.assign = assignTo;
        currentTaskCard.dataset.assignee = assignedBy;
        currentTaskCard.dataset.date = date;
        currentTaskCard.dataset.category = category;
        currentTaskCard.dataset.link = link;

        // Update the card display
        updateTaskCard(currentTaskCard);
    }
});