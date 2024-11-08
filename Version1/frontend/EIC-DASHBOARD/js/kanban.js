// Global variable to store current task card
let currentTaskCard = null;

// Initialize event listeners when document is ready
document.addEventListener('DOMContentLoaded', function() {
            // Event listener for saving new task
            document.getElementById('saveTaskButton').addEventListener('click', function(e) {
                        e.preventDefault(); // Prevent default form submission

                        // Clear previous error messages
                        clearErrorMessages();

                        // Get fresh values and validate each field
                        const formFields = [{
                                value: document.getElementById('taskTitleInput').value.trim(),
                                id: 'taskTitleInput',
                                message: 'Please enter title'
                            },
                            {
                                value: document.getElementById('taskDescriptionInput').value.trim(),
                                id: 'taskDescriptionInput',
                                message: 'Please enter description'
                            },
                            {
                                value: document.getElementById('taskStatusInput').value,
                                id: 'taskStatusInput',
                                message: 'Please select status'
                            },
                            {
                                value: document.getElementById('taskPrivacyInput').value,
                                id: 'taskPrivacyInput',
                                message: 'Please select privacy'
                            },
                            {
                                value: document.getElementById('taskDateInput').value,
                                id: 'taskDateInput',
                                message: 'Please select date'
                            },
                            {
                                value: document.getElementById('taskAssignInput').value.trim(),
                                id: 'taskAssignInput',
                                message: 'Please enter assign to'
                            },
                            {
                                value: document.getElementById('taskAssigneeInput').value.trim(),
                                id: 'taskAssigneeInput',
                                message: 'Please enter assignee'
                            },
                            {
                                value: document.getElementById('taskCategoryInput').value.trim(),
                                id: 'taskCategoryInput',
                                message: 'Please select category'
                            },
                            {
                                value: document.getElementById('taskLinkInput').value.trim(),
                                id: 'taskLinkInput',
                                message: 'Please enter link'
                            }
                        ];

                        let hasErrors = false;

                        // Validate each field and show error messages
                        formFields.forEach(field => {
                            if (!field.value) {
                                showErrorMessage(field.id, field.message);
                                hasErrors = true;
                            }
                        });

                        // Special validation for hideFrom field when Privacy is "Private Except"
                        const privacyValue = document.getElementById('taskPrivacyInput').value;
                        const hideFromValue = document.getElementById('hideUserInput').value.trim();
                        if (privacyValue === 'Private Except' && !hideFromValue) {
                            showErrorMessage('hideUserInput', 'Please enter hide from');
                            hasErrors = true;
                        }

                        // If there are any errors, stop form submission
                        if (hasErrors) {
                            return;
                        }

                        // Get fresh values directly from the form inputs
                        const titleInput = document.getElementById('taskTitleInput');
                        const descriptionInput = document.getElementById('taskDescriptionInput');
                        const statusInput = document.getElementById('taskStatusInput');
                        const privacyInput = document.getElementById('taskPrivacyInput');
                        const hideFromInput = document.getElementById('hideUserInput');
                        const dateInput = document.getElementById('taskDateInput');
                        const assignInput = document.getElementById('taskAssignInput');
                        const assigneeInput = document.getElementById('taskAssigneeInput');
                        const categoryInput = document.getElementById('taskCategoryInput');
                        const linkInput = document.getElementById('taskLinkInput');

                        // Get values and trim them
                        const title = titleInput ? titleInput.value.trim() : '';
                        const description = descriptionInput ? descriptionInput.value.trim() : '';
                        const status = statusInput ? statusInput.value : '';
                        const privacy = privacyInput ? privacyInput.value : '';
                        const hideFrom = hideFromInput ? hideFromInput.value.trim() : '';
                        const date = dateInput ? dateInput.value : '';
                        const assign = assignInput ? assignInput.value.trim() : '';
                        const assignee = assigneeInput ? assigneeInput.value.trim() : '';
                        const category = categoryInput ? categoryInput.value.trim() : '';
                        const link = linkInput ? linkInput.value.trim() : '';

                        // Debug log
                        console.log('Form Values:', {
                            title,
                            description,
                            status,
                            privacy,
                            hideFrom,
                            date,
                            assign,
                            assignee,
                            category,
                            link
                        });

                        // Store the values before validation
                        const formData = {
                            title,
                            description,
                            status,
                            privacy,
                            hideFrom,
                            date,
                            assign,
                            assignee,
                            category,
                            link
                        };

                        // Create task card with the stored values
                        const taskCard = document.createElement('div');
                        taskCard.className = 'task-card';
                        taskCard.draggable = true;
                        taskCard.id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

                        // Store the data in the card's dataset using stored values
                        taskCard.dataset.title = formData.title;
                        taskCard.dataset.description = formData.description;
                        taskCard.dataset.status = formData.status;
                        taskCard.dataset.privacy = formData.privacy;
                        taskCard.dataset.hideFrom = formData.hideFrom;
                        taskCard.dataset.date = formData.date;
                        taskCard.dataset.assign = formData.assign;
                        taskCard.dataset.assignee = formData.assignee;
                        taskCard.dataset.category = formData.category;
                        taskCard.dataset.link = formData.link;

                        // Add event listeners
                        taskCard.addEventListener('dragstart', drag);
                        taskCard.addEventListener('click', () => showTaskDetail(taskCard));

                        // Create card content with validated data
                        taskCard.innerHTML = `
            <h3>${formData.title}</h3>
            <i class="fa-regular fa-user"></i> - ${formData.assign || 'Unassigned'}<br>
            <i class="fa-regular fa-calendar"></i> - ${formData.date || 'No date'}<br>
            <i class="fa-solid fa-user-shield"></i> - ${formData.privacy}
            ${formData.privacy === 'Private Except' ? 
                `<br><i class="fa-solid fa-eye-slash"></i> - Hidden from: ${formData.hideFrom || ''}` : ''}
        `;

        // Add the card to the appropriate column based on status
        let columnId;
        switch (formData.status.toLowerCase()) {
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

        const targetColumn = document.getElementById(columnId);
        if (targetColumn) {
            targetColumn.appendChild(taskCard);
        }

        // Clear the form BEFORE hiding the modal
        clearAddTaskForm();

        // Close the modal
        const addTaskModal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
        if (addTaskModal) {
            addTaskModal.hide();
        }

        // Update task counts
        updateTaskCounts();
    });

    // Make sure modal always clears form when opened and closed
    const addTaskModal = document.getElementById('addTaskModal');
    if (addTaskModal) {
        addTaskModal.addEventListener('show.bs.modal', function() {
            clearAddTaskForm(); // Clear form when modal opens
        });

        addTaskModal.addEventListener('hidden.bs.modal', function() {
            clearAddTaskForm(); // Clear form when modal closes
            clearErrorMessages();
        });
    }

    // Initialize task counts
    updateTaskCounts();

    // Add event listener for saving task changes when modal closes
    const taskDetailModal = document.getElementById('taskDetailModal');
    taskDetailModal.addEventListener('hide.bs.modal', function() {
        saveTaskChanges();
    });
});

function createTaskCard(taskData) {
    const taskCard = document.createElement('div');
    taskCard.className = 'task-card';
    taskCard.draggable = true;
    taskCard.id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Store the data in the card's dataset
    Object.keys(taskData).forEach(key => {
        taskCard.dataset[key] = taskData[key] || '';
    });

    // Add event listeners
    taskCard.addEventListener('dragstart', drag);
    taskCard.addEventListener('click', () => showTaskDetail(taskCard));

    // Create card content
    taskCard.innerHTML = `
        <h3>${taskData.title}</h3>
        <i class="fa-regular fa-user"></i> - ${taskData.assign || 'Unassigned'}<br>
        <i class="fa-regular fa-calendar"></i> - ${taskData.date || 'No date'}<br>
        <i class="fa-solid fa-user-shield"></i> - ${taskData.privacy}
        ${taskData.privacy === 'Private Except' ? 
            `<br><i class="fa-solid fa-eye-slash"></i> - Hidden from: ${taskData.hideFrom || ''}` : ''}
    `;

    return taskCard;
}

function showTaskDetail(taskCard) {
    // Get data from the taskCard's dataset
    const taskData = taskCard.dataset;

    // Update modal with task data - make title editable
    document.getElementById('taskTitle').innerHTML = `
        <input type="text" id="taskTitleInput" class="form-control" value="${taskData.title || ''}">
    `;
    document.getElementById('taskDescription').value = taskData.description || '';
    document.getElementById('taskStatus').value = taskData.status || 'To Do';

    // Update privacy select and hide input container
    const privacySelect = document.getElementById('taskPrivacy');
    privacySelect.value = taskData.privacy || 'Private';

    // Add hideInputContainer check and update
    const hideInputContainer = document.getElementById('hideInputContainerView');
    if (hideInputContainer) {
        hideInputContainer.style.display = taskData.privacy === 'Private Except' ? 'block' : 'none';
        if (taskData.privacy === 'Private Except') {
            document.getElementById('hideUserView').value = taskData.hideFrom || '';
        }
    }

    document.getElementById('taskDate').value = taskData.date || '';
    document.getElementById('taskAssign').value = taskData.assign || '';
    document.getElementById('taskAssignee').value = taskData.assignee || '';
    document.getElementById('taskCategory').value = taskData.category || '';
    document.getElementById('taskLink').value = taskData.link || '';

    // Store current task card reference for potential updates
    currentTaskCard = taskCard;

    const taskDetailModal = new bootstrap.Modal(document.getElementById('taskDetailModal'));
    taskDetailModal.show();
}

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
        let newStatus;
        switch(dropZone.id) {
            case 'in-progress-column':
                newStatus = 'In Progress';
                break;
            case 'checking-column':
                newStatus = 'Checking';
                break;
            case 'done-column':
                newStatus = 'Done';
                break;
            default:
                newStatus = 'To Do';
        }
        
        // Update the task's dataset with new status
        draggedElement.dataset.status = newStatus;
        updateTaskCounts();
    }
}

function updateTaskCounts() {
    const columns = ['todo', 'in-progress', 'checking', 'done'];
    columns.forEach(column => {
        const columnElement = document.getElementById(`${column}-column`);
        const count = columnElement ? columnElement.children.length : 0;
        const countElement = columnElement.closest('.task-header').querySelector('.task-count');
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
        // Get the current column of the task
        const currentColumn = currentTaskCard.parentElement.id;
        
        // Update the dataset with new values including title and hide input
        currentTaskCard.dataset.title = document.getElementById('taskTitleInput').value;
        currentTaskCard.dataset.description = document.getElementById('taskDescription').value;
        currentTaskCard.dataset.status = document.getElementById('taskStatus').value;
        currentTaskCard.dataset.privacy = document.getElementById('taskPrivacy').value;
        
        if (currentTaskCard.dataset.privacy === 'Private Except') {
            currentTaskCard.dataset.hideFrom = document.getElementById('hideUserView').value;
        }

        currentTaskCard.dataset.date = document.getElementById('taskDate').value;
        currentTaskCard.dataset.assign = document.getElementById('taskAssign').value;
        currentTaskCard.dataset.assignee = document.getElementById('taskAssignee').value;
        currentTaskCard.dataset.category = document.getElementById('taskCategory').value;
        currentTaskCard.dataset.link = document.getElementById('taskLink').value;

        // Update the visible card content
        currentTaskCard.innerHTML = `
            <h3>${currentTaskCard.dataset.title}</h3>
            <i class="fa-regular fa-user"></i> - ${currentTaskCard.dataset.assign || 'Unassigned'}<br>
            <i class="fa-regular fa-calendar"></i> - ${currentTaskCard.dataset.date || 'No date'}<br>
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
        
        // Only move if the status has actually changed
        const targetColumn = document.getElementById(columnId);
        if (targetColumn && currentColumn !== columnId) {
            targetColumn.appendChild(currentTaskCard);
            updateTaskCounts();
        }
    }
}

function toggleHideDetailInput() {
    const privacySelect = document.getElementById('taskPrivacy');
    const hideInputContainer = document.getElementById('hideInputDetailContainer');
    hideInputContainer.style.display = privacySelect.value === 'Private Except' ? 'block' : 'none';
}

// Add new function to toggle hide input visibility in view mode
function toggleHideInputView() {
    const privacySelect = document.getElementById('taskPrivacy');
    const hideInputContainer = document.getElementById('hideInputContainerView');
    if (hideInputContainer) {
        hideInputContainer.style.display = privacySelect.value === 'Private Except' ? 'block' : 'none';
    }
}

// Add these functions right before any event listeners or initialization code
function clearAddTaskForm() {
    // Get all form inputs
    const inputs = {
        'taskTitleInput': '',
        'taskDescriptionInput': '',
        'taskStatusInput': 'To Do',
        'taskPrivacyInput': 'Private',
        'hideUserInput': '',
        'taskDateInput': '',
        'taskAssignInput': '',
        'taskAssigneeInput': '',
        'taskCategoryInput': '',
        'taskLinkInput': ''
    };

    // Clear each input
    Object.entries(inputs).forEach(([id, defaultValue]) => {
        const element = document.getElementById(id);
        if (element) {
            element.value = defaultValue;
        }
    });

    // Hide the hideInputContainer
    const hideInputContainer = document.getElementById('hideInputContainer');
    if (hideInputContainer) {
        hideInputContainer.style.display = 'none';
    }

    // Reset any stored task data
    currentTaskCard = null;
}

function saveTask() {
    // Get values from form
    const title = document.getElementById('taskTitleInput').value;
    const description = document.getElementById('taskDescriptionInput').value;
    const status = document.getElementById('taskStatusInput').value;
    const privacy = document.getElementById('taskPrivacyInput').value;
    const hideFrom = document.getElementById('hideUserInput').value;
    const assign = document.getElementById('taskAssignInput').value;
    const assignee = document.getElementById('taskAssigneeInput').value;
    const date = document.getElementById('taskDateInput').value;
    const category = document.getElementById('taskCategoryInput').value;
    const link = document.getElementById('taskLinkInput').value;

    // Create new task card
    const taskCard = document.createElement('div');
    taskCard.className = 'task-card';
    taskCard.draggable = true;
    taskCard.id = 'task-' + Date.now(); // Unique ID

    // Set dataset values
    taskCard.dataset.title = title;
    taskCard.dataset.description = description;
    taskCard.dataset.status = status;
    taskCard.dataset.privacy = privacy;
    taskCard.dataset.hideFrom = hideFrom;
    taskCard.dataset.assign = assign;
    taskCard.dataset.assignee = assignee;
    taskCard.dataset.date = date;
    taskCard.dataset.category = category;
    taskCard.dataset.link = link;

    // Create card content
    taskCard.innerHTML = `
        <h3>${title}</h3>
        <i class="fa-regular fa-user"></i> - ${assign}<br>
        <i class="fa-regular fa-calendar"></i> - ${date}<br>
        <i class="fa-solid fa-user-shield"></i> - ${privacy}
        ${privacy === 'Private Except' ? `<br><i class="fa-solid fa-eye-slash"></i> - Hidden from: ${hideFrom}` : ''}
    `;

    // Add to appropriate column
    const column = document.querySelector(`.kanban-column[data-status="${status}"]`);
    if (column) {
        column.querySelector('.task-list').appendChild(taskCard);
    }

    // Clear form and close modal
    clearAddTaskForm();
    $('#addTaskModal').modal('hide');
}

// Function to show error message below a field
function showErrorMessage(fieldId, message) {
    const field = document.getElementById(fieldId);
    
    // Find the error message div that's a sibling of the input's parent div
    const errorDiv = field.parentElement.nextElementSibling;
    if (errorDiv && errorDiv.classList.contains('error-message')) {
        errorDiv.textContent = message;
    }

    // Add invalid class to the input
    field.classList.add('is-invalid');
}

// Function to clear all error messages
function clearErrorMessages() {
    // Clear all error messages
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(error => {
        error.textContent = '';
    });
    
    // Remove invalid class from all inputs
    const invalidInputs = document.querySelectorAll('.is-invalid');
    invalidInputs.forEach(input => {
        input.classList.remove('is-invalid');
    });
}