// Update the task card display function
function updateTaskCard(taskCard) {
    // Store the current status before updating the card
    const currentStatus = taskCard.dataset.status;

    let privacyIcon = taskCard.dataset.privacy === 'Public' ? 'fa-globe' : 'fa-lock';
    let privacyText = taskCard.dataset.privacy;

    if (taskCard.dataset.privacy === 'Private Except') {
        privacyIcon = 'fa-user-secret';
        privacyText = `Private Except: ${taskCard.dataset.hideFrom}`;
    }

    taskCard.innerHTML = `
        <div class="task-card-content">
            <h3>${taskCard.dataset.title}</h3>
            <p><i class="fa-regular fa-user"></i> ${taskCard.dataset.assign}</p>
            <p><i class="fa-regular fa-calendar"></i> ${taskCard.dataset.date}</p>
            <p><i class="fas ${privacyIcon}"></i> ${privacyText}</p>
        </div>
    `;

    // Don't automatically move the card - only update its content
    taskCard.dataset.status = currentStatus;
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
document.getElementById('taskDetailModal').addEventListener('hide.bs.modal', function() {
    if (currentTaskCard) {
        const title = document.getElementById('taskTitle').value;
        const description = document.getElementById('taskDescription').value;
        const status = document.getElementById('taskStatus').value;
        const privacy = document.getElementById('taskPrivacy').value;
        const hideFrom = document.getElementById('hideUserView').value;
        const assignTo = document.getElementById('taskAssign').value;
        const date = document.getElementById('taskDate').value;
        const link = document.getElementById('taskLink').value;

        // Update all task card data
        currentTaskCard.dataset.title = title;
        currentTaskCard.dataset.description = description;
        currentTaskCard.dataset.status = status;
        currentTaskCard.dataset.privacy = privacy;
        currentTaskCard.dataset.hideFrom = hideFrom;
        currentTaskCard.dataset.assign = assignTo;
        currentTaskCard.dataset.date = date;
        currentTaskCard.dataset.link = link;

        // Update the card display
        updateTaskCard(currentTaskCard);
    }
});

// Function to create task card
function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.id = task.id;
    card.draggable = true;

    // Set all data attributes
    card.dataset.title = task.title;
    card.dataset.description = task.description || '';
    card.dataset.status = task.status;
    card.dataset.privacy = task.privacy;
    card.dataset.assign = task.assignTo;
    card.dataset.date = task.deadline;
    card.dataset.category = task.category || '';
    card.dataset.link = task.link || '';
    card.dataset.hideFrom = task.hideFrom || '';

    // Add event listeners
    card.addEventListener('dragstart', drag);
    card.addEventListener('click', function() {
        openTaskDetails(this);
    });

    // Create card content
    let privacyIcon = task.privacy === 'Public' ? 'fa-globe' : 'fa-lock';
    let privacyText = task.privacy;
    if (task.privacy === 'Private Except') {
        privacyIcon = 'fa-user-secret';
        privacyText = `Private Except: ${task.hideFrom}`;
    }

    card.innerHTML = `
        <div class="task-card-content">
            <h3>${task.title}</h3>
            <p><i class="fa-regular fa-user"></i> ${task.assignTo || 'Unassigned'}</p>
            <p><i class="fa-regular fa-calendar"></i> ${task.deadline || 'No deadline'}</p>
            <p><i class="fas ${privacyIcon}"></i> ${privacyText}</p>
            ${task.category ? `<p><i class="fas fa-tag"></i> ${task.category}</p>` : ''}
        </div>
    `;

    return card;
}

// Function to open task details
function openTaskDetails(taskCard) {
    currentTaskCard = taskCard;

    // Populate modal fields
    document.getElementById('taskTitle').value = taskCard.dataset.title;
    document.getElementById('taskDescription').value = taskCard.dataset.description;
    document.getElementById('taskStatus').value = taskCard.dataset.status;
    document.getElementById('taskPrivacy').value = taskCard.dataset.privacy;
    document.getElementById('taskAssign').value = taskCard.dataset.assign;
    document.getElementById('taskDate').value = taskCard.dataset.date;
    document.getElementById('taskCategory').value = taskCard.dataset.category;
    document.getElementById('taskLink').value = taskCard.dataset.link;

    // Show/hide Mark as Done button based on current status
    const markAsDoneBtn = document.getElementById('markAsDoneBtn');
    if (taskCard.dataset.status === 'Done') {
        markAsDoneBtn.style.display = 'none';
    } else {
        markAsDoneBtn.style.display = 'block';
    }

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

// Save task button click handler
document.getElementById('saveTaskButton').addEventListener('click', function() {
    // Get all the input values
    const title = document.getElementById('taskTitleInput').value;
    const description = document.getElementById('taskDescriptionInput').value;
    const status = document.getElementById('taskStatusInput').value;
    const privacy = document.getElementById('taskPrivacyInput').value;
    const assignTo = document.getElementById('taskAssignInput').value;
    const deadline = document.getElementById('taskDateInput').value;
    const category = document.getElementById('taskCategoryInput').value;
    const link = document.getElementById('taskLinkInput').value;
    const hideFrom = document.getElementById('hideUserInput')?.value || '';

    // Validate required fields
    if (!title) {
        showError('taskTitleInput', 'Title is required');
        return;
    }

    // Create task card
    const taskCard = createTaskCard({
        id: 'task-' + Date.now(),
        title: title,
        description: description,
        status: status,
        privacy: privacy,
        assignTo: assignTo,
        deadline: deadline,
        category: category,
        link: link,
        hideFrom: hideFrom
    });

    // Add to appropriate column
    const columnId = status.toLowerCase().replace(' ', '-') + '-column';
    const column = document.getElementById(columnId);
    if (column) {
        column.appendChild(taskCard);
        updateTaskCounts();

        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
        modal.hide();
        document.getElementById('addTaskForm').reset();
        clearErrors();
    }
});

// Helper function to get column ID from status
function getColumnId(status) {
    switch(status.toLowerCase()) {
        case 'done':
            return 'done-column';
        case 'in progress':
            return 'in-progress-column';
        case 'checking':
            return 'checking-column';
        case 'to do':
        default:
            return 'todo-column';
    }
}

// Helper function to standardize status formatting
function formatStatus(status) {
    return status.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Add dragend event to remove visual feedback
document.addEventListener('dragend', function(ev) {
    // Remove visual feedback from all columns
    const columns = document.querySelectorAll('.task-column');
    columns.forEach(column => {
        column.style.backgroundColor = '';
    });
});