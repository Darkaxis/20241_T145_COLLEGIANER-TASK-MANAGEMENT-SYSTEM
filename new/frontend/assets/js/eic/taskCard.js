let users = [];

document.addEventListener('DOMContentLoaded', async() => {
    try {
        const response = await fetch('https://localhost:3000/api/v1/eic/tasks/get/all', {
            method: 'GET',
            credentials: 'include' // Include cookies in the request
        });
        const tasks = await response.json();
        tasks.tasks.forEach(task => createTask(task));
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
    try {
        let usersResponse = await fetch('https://localhost:3000/api/v1/eic/users', {
            method: 'GET',
            credentials: 'include' // Include cookies in the request
        });
        let usersData = await usersResponse.json();
        users = usersData.data.map(user => user.name);

    } catch (error) {
        console.error('Error fetching users:', error);
    }

    const myTask = document.getElementById('myTask');
    myTask.addEventListener('click', async() => {
        try {
            const response = await fetch('https://localhost:3000/api/v1/eic/tasks/get/user', {
                method: 'GET',
                credentials: 'include' // Include cookies in the request
            });
            const tasks = await response.json();
            document.querySelectorAll('.task-card').forEach(card => card.remove());
            tasks.tasks.forEach(task => createTask(task));
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    });
    const allTask = document.getElementById('allTask');
    allTask.addEventListener('click', async() => {
        try {
            const response = await fetch('https://localhost:3000/api/v1/eic/tasks/get/all', {
                method: 'GET',
                credentials: 'include' // Include cookies in the request
            });
            const tasks = await response.json();
            document.querySelectorAll('.task-card').forEach(card => card.remove());
            tasks.tasks.forEach(task => createTask(task));
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    });
});

function createTask(task) {

    const taskCard = document.createElement('div');
    taskCard.dataset.taskId = task.id;
    taskCard.className = 'task-card';
    taskCard.draggable = true;
    taskCard.id = 'task-' + Date.now();

    // Set data attributes
    Object.entries(task).forEach(([key, value]) => {
        taskCard.dataset[key] = value;
    });
    // Make sure category is included in the dataset
    taskCard.dataset.category = task.category || '';

    // Add event listeners
    addTaskCardEventListeners(taskCard);

    // Update card content
    updateTaskCard(taskCard);

    // Add to appropriate column
    const columnId = getColumnIdFromStatus(task.status);
    const column = document.getElementById(columnId);
    if (column) {
        column.appendChild(taskCard);
        updateColumnCount(columnId);
    }
}

function addTaskCardEventListeners(taskCard) {
    taskCard.addEventListener('dragstart', handleDragStart);
    taskCard.addEventListener('dragenter', handleDragEnter);
    taskCard.addEventListener('dragover', handleDragOver);
    taskCard.addEventListener('dragleave', handleDragLeave);
    taskCard.addEventListener('drop', handleDrop);
    taskCard.addEventListener('dragend', handleDragEnd);

    // Add click event listener for showing task details
    taskCard.addEventListener('click', () => {
        console.log(users); // Access the users array here
    });
}

function addTaskCardEventListeners(taskCard) {
    taskCard.addEventListener('dragstart', handleDragStart);
    taskCard.addEventListener('dragenter', handleDragEnter);
    taskCard.addEventListener('dragover', handleDragOver);
    taskCard.addEventListener('dragleave', handleDragLeave);
    taskCard.addEventListener('drop', handleDrop);
    taskCard.addEventListener('dragend', handleDragEnd);

    // Add click event listener for showing task details
    taskCard.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        // Get the modal element
        const taskDetailModal = document.getElementById('taskDetailModal');

        // Fill in the modal with task data
        document.getElementById('taskTitle').value = taskCard.dataset.taskName || '';
        document.getElementById('taskDescription').value = taskCard.dataset.description || '';
        document.getElementById('taskStatus').value = taskCard.dataset.status || '';
        document.getElementById('taskPrivacy').value = taskCard.dataset.privacy || '';
        document.getElementById('taskDetailCategory').value = taskCard.dataset.category || '';

        // Update assignTo dropdown
        const assignToSelect = document.getElementById('taskAssignTo');
        assignToSelect.innerHTML = users.map(user =>
            `<option value="${user}" ${user === taskCard.dataset.assignedTo ? 'selected' : ''}>${user}</option>`
        ).join('');

        document.getElementById('taskDate').value = taskCard.dataset.deadline || '';
        document.getElementById('taskLink').value = taskCard.dataset.link || '';

        // Handle Private Except case
        const hideFromContainer = document.getElementById('hideFromUsersContainer');
        const hideFromInput = document.getElementById('hideFromUsers');
        if (taskCard.dataset.privacy === 'Private Except') {
            hideFromInput.value = taskCard.dataset.hideFrom || '';
            hideFromContainer.style.display = 'block';
        } else {
            hideFromInput.value = '';
            hideFromContainer.style.display = 'none';
        }

        // Setup edit button click handler
        const editButton = document.getElementById('editTaskButton');
        if (editButton) {
            editButton.onclick = () => enableEditMode();
        }

        // Setup save button click handler
        const saveButton = document.getElementById('saveEditButton');
        if (saveButton) {
            saveButton.onclick = () => saveTaskEdits(taskCard);
        }

        // Reset to view mode when modal opens
        disableEditMode();

        // Show the modal using Bootstrap
        const modal = new bootstrap.Modal(taskDetailModal);
        modal.show();
    });
}

function addToColumn(taskCard, status) {
    const columnMap = {
        'To Do': 'todo-column',
        'In Progress': 'in-progress-column',
        'Checking': 'checking-column',
        'Done': 'done-column'
    };

    const columnId = columnMap[status] || 'todo-column';
    const column = document.getElementById(columnId);
    if (column) {
        column.appendChild(taskCard);
        updateTaskCounts();
    }
}

function updateTaskCounts() {
    console.log('Updating task counts');
    const columns = ['todo-column', 'in-progress-column', 'checking-column', 'done-column'];

    columns.forEach(columnId => {
        const column = document.getElementById(columnId);
        const count = column ? column.children.length : 0;
        const countElement = document.querySelector(`#${columnId}`).previousElementSibling.querySelector('.task-count');
        if (countElement) {
            countElement.textContent = count;
            console.log(`${columnId} count updated to ${count}`);
        }
    });
}

function updateTaskCard(taskCard) {
    console.log('Updating task card:', taskCard.id);
    console.log('Current status:', taskCard.dataset.status);

    const privacyIcons = {
        'Public': 'fa-globe',
        'Private': 'fa-lock',
        'Private Except': 'fa-user-secret'
    };

    const privacyText = taskCard.dataset.privacy === 'Private Except' ?
        `Private Except: ${taskCard.dataset.hideFrom}` :
        taskCard.dataset.privacy;

    taskCard.innerHTML = `
        <div class="task-card-content">
            <div class="task-card-header">
                <h3 class="task-title">${taskCard.dataset.taskName}</h3>
                <div class="task-actions">
                    <button class="btn btn-link task-menu-toggle">
                        <i class="fas fa-ellipsis-h"></i>
                    </button>
                    <div class="task-menu">
                        <button class="task-menu-item mark-done-btn">
                            <i class="fas fa-check"></i> Mark as Done
                        </button>
                        <button class="task-menu-item archive-btn">
                            <i class="fas fa-archive"></i> Archive
                        </button>
                        <button class="task-menu-item delete-btn">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
            <div class="task-card-body">
                <p><i class="fa-regular fa-user"></i> ${taskCard.dataset.assignedTo}</p>
                <p><i class="fa-regular fa-calendar"></i> ${taskCard.dataset.deadline}</p>
                <p><i class="fas ${privacyIcons[taskCard.dataset.privacy]}"></i> ${privacyText}</p>
                  <p><i class="fas fa-tag"></i> ${taskCard.dataset.category || 'No Category'}</p> 
                ${taskCard.dataset.status === 'Done' ? '<p class="text-success completion-status"><i class="fas fa-check-circle"></i> Completed</p>' : ''}
            </div>
        </div>
    `;

    // Add event listeners for the menu
    const menuToggle = taskCard.querySelector('.task-menu-toggle');
    const taskMenu = taskCard.querySelector('.task-menu');
    const markDoneBtn = taskCard.querySelector('.mark-done-btn');
    const archiveBtn = taskCard.querySelector('.archive-btn');
    const deleteBtn = taskCard.querySelector('.delete-btn');

    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        taskMenu.classList.toggle('show');
    });

    markDoneBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveTaskToDone(taskCard);
        taskMenu.classList.remove('show');
    });

    archiveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        archiveTask(taskCard);
        taskMenu.classList.remove('show');
    });

    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this task?')) {
            fetch(`https://localhost:3000/api/v1/eic/tasks/delete/${taskCard.dataset.taskId}`, {
                method: 'DELETE',
                credentials: 'include'
            })

            taskCard.remove();
            updateTaskCounts();
        }
        taskMenu.classList.remove('show');
    });

    // Close menu when clicking outside
    document.addEventListener('click', () => {
        taskMenu.classList.remove('show');
    });
}

function archiveTask(taskCard) {
    // Add your archive functionality here
    console.log('Archiving task:', taskCard.id);
    // For example:
    taskCard.remove();
    // You might want to store it in an archive list or send to backend
}

function addTaskCardButtonListeners(taskCard) {
    // Submit to user handler
    taskCard.querySelectorAll('.submit-to-user').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const user = e.target.dataset.user;
            handleSubmitTo(taskCard, user);
        });
    });

    // Mark as done handler
    const markDoneBtn = taskCard.querySelector('.mark-done-btn');
    if (markDoneBtn) {
        markDoneBtn.addEventListener('click', () => handleMarkAsDone(taskCard));
    }
}

function handleSubmitTo(taskCard, user) {
    // Update the task's assignee
    taskCard.dataset.assignTo = user;

    // Log the activity
    activityLogger.logActivity(
        'assign',
        taskCard.dataset.taskName,
        `Submitted to ${user}`,
        'Current User' // Replace with actual logged-in user
    );

    // Update the card display
    updateTaskCard(taskCard);
}

function handleMarkAsDone(taskCard) {
    moveTaskToDone(taskCard);
}

// Add this new consolidated function for moving tasks to Done
async function moveTaskToDone(taskCard) {
    // Update the task's status
    taskCard.dataset.status = 'Done';




    console.log('Status updated to Done');

    // Move to Done column
    const doneColumn = document.getElementById('done-column');
    if (doneColumn) {
        doneColumn.appendChild(taskCard);
        console.log('Task moved to Done column');

        // Add completion animation
        taskCard.style.animation = 'completionPulse 1s';
        setTimeout(() => {
            taskCard.style.animation = '';
        }, 1000);

        updateTaskCounts();
    }

    // Update card display with completion indicator
    updateTaskCard(taskCard);

    // Close any open modals
    const taskDetailModal = document.getElementById('taskDetailModal');
    if (taskDetailModal) {
        const modal = bootstrap.Modal.getInstance(taskDetailModal);
        if (modal) {
            modal.hide();
        }
    }
}

// Add this new function to handle edit mode
function enableEditMode() {
    // Make inputs editable
    const inputs = document.querySelectorAll('#taskDetailModal input, #taskDetailModal textarea');
    inputs.forEach(input => {
        input.removeAttribute('readonly');
        input.classList.add('editable');
    });
    // Make category input editable
    const categoryInput = document.getElementById('taskDetailCategory');
    if (categoryInput) {
        categoryInput.removeAttribute('readonly');
        categoryInput.classList.add('editable');
    }
    // Create a status dropdown for editing
    const statusInput = document.getElementById('taskStatus');
    const currentStatus = statusInput.value;
    const statusSelect = document.createElement('select');
    statusSelect.className = 'form-control';
    statusSelect.id = 'taskStatus';

    const statusOptions = ['To Do', 'In Progress', 'Checking', 'Done'];
    statusOptions.forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.text = status;
        option.selected = status === currentStatus;
        statusSelect.appendChild(option);
    });

    statusInput.parentNode.replaceChild(statusSelect, statusInput);

    // Create a privacy dropdown for editing
    const privacyInput = document.getElementById('taskPrivacy');
    const currentPrivacy = privacyInput.value;
    const privacySelect = document.createElement('select');
    privacySelect.className = 'form-control';
    privacySelect.id = 'taskPrivacy';
    privacySelect.onchange = () => toggleHideFromUsersInModal();

    const privacyOptions = ['Public', 'Private', 'Private Except'];
    privacyOptions.forEach(privacy => {
        const option = document.createElement('option');
        option.value = privacy;
        option.text = privacy;
        option.selected = privacy === currentPrivacy;
        privacySelect.appendChild(option);
    });

    privacyInput.parentNode.replaceChild(privacySelect, privacyInput);

    // Show/hide the hideFromUsers field based on privacy
    toggleHideFromUsersInModal();

    // Show Save button, hide Edit button
    document.getElementById('editTaskButton').style.display = 'none';
    document.getElementById('saveEditButton').style.display = 'inline-block';
}

function toggleHideFromUsersInModal() {
    const privacySelect = document.getElementById('taskPrivacy');
    const hideFromContainer = document.getElementById('hideFromUsersContainer');
    const hideFromInput = document.getElementById('hideFromUsers');

    if (privacySelect.value === 'Private Except') {
        hideFromContainer.style.display = 'block';
        hideFromInput.removeAttribute('readonly');
    } else {
        hideFromContainer.style.display = 'none';
    }
}

// Add this function to save edits
async function saveTaskEdits(taskCard) {
    const dateInput = document.getElementById('taskDate');
    if (!validateTaskDate(dateInput)) {
        return false;
    }

    // Get updated values
    const updatedData = {
        taskName: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        status: document.getElementById('taskStatus').value,
        privacy: document.getElementById('taskPrivacy').value,
        assignedTo: document.getElementById('taskAssignTo').value,
        deadline: dateInput.value,
        link: document.getElementById('taskLink').value,
        category: document.getElementById('taskDetailCategory').value
    };

    // send to backend
    const taskId = taskCard.dataset.taskId;
    const response = await fetch(`https://localhost:3000/api/v1/eic/tasks/edit/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData),
        credentials: 'include'
    });



    // Add hideFrom if privacy is Private Except
    if (updatedData.privacy === 'Private Except') {
        updatedData.hideFrom = document.getElementById('hideFromUsers').value;
    }

    // Update task card dataset
    Object.entries(updatedData).forEach(([key, value]) => {
        taskCard.dataset[key] = value;
    });

    // Update the card display
    updateTaskCard(taskCard);



    // Move card to correct column if status changed
    const columnId = getColumnIdFromStatus(updatedData.status);
    const targetColumn = document.getElementById(columnId);
    if (targetColumn && taskCard.parentElement.id !== columnId) {
        targetColumn.appendChild(taskCard);
        updateTaskCounts();
    }

    // Reset modal to view mode
    disableEditMode();

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
    modal.hide();
}

// Add this function to disable edit mode
function disableEditMode() {
    // Convert all inputs back to readonly
    const inputs = document.querySelectorAll('#taskDetailModal input, #taskDetailModal textarea');
    inputs.forEach(input => {
        input.setAttribute('readonly', true);
        input.classList.remove('editable');
    });


    // Make category input readonly
    const categoryInput = document.getElementById('taskDetailCategory');
    if (categoryInput) {
        categoryInput.setAttribute('readonly', true);
        categoryInput.classList.remove('editable');
    }
    // Convert dropdowns back to readonly inputs
    const statusSelect = document.getElementById('taskStatus');
    const privacySelect = document.getElementById('taskPrivacy');

    if (statusSelect.tagName === 'SELECT') {
        const statusInput = document.createElement('input');
        statusInput.type = 'text';
        statusInput.className = 'form-control';
        statusInput.id = 'taskStatus';
        statusInput.value = statusSelect.value;
        statusInput.setAttribute('readonly', true);
        statusSelect.parentNode.replaceChild(statusInput, statusSelect);
    }

    if (privacySelect.tagName === 'SELECT') {
        const privacyInput = document.createElement('input');
        privacyInput.type = 'text';
        privacyInput.className = 'form-control';
        privacyInput.id = 'taskPrivacy';
        privacyInput.value = privacySelect.value;
        privacyInput.setAttribute('readonly', true);
        privacySelect.parentNode.replaceChild(privacyInput, privacySelect);
    }

    // Show Edit button, hide Save button
    document.getElementById('editTaskButton').style.display = 'inline-block';
    document.getElementById('saveEditButton').style.display = 'none';
}

function getColumnIdFromStatus(status) {
    const columnMap = {
        'To Do': 'todo-column',
        'In Progress': 'in-progress-column',
        'Checking': 'checking-column',
        'Done': 'done-column'
    };
    return columnMap[status] || 'todo-column';
}

// Drag and Drop handlers
function handleDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', e.target.id);
}

function handleDragOver(e) {
    e.preventDefault();
    const taskCard = e.target.closest('.task-card');
    if (taskCard && !taskCard.classList.contains('dragging')) {
        const draggingCard = document.querySelector('.dragging');
        const container = taskCard.parentElement;
        const rect = taskCard.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;

        if (e.clientY < midY) {
            container.insertBefore(draggingCard, taskCard);
        } else {
            container.insertBefore(draggingCard, taskCard.nextSibling);
        }
    }
}

function handleDragEnter(e) {
    e.preventDefault();
    const taskCard = e.target.closest('.task-card');
    if (taskCard && !taskCard.classList.contains('dragging')) {
        taskCard.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    const taskCard = e.target.closest('.task-card');
    if (taskCard) {
        taskCard.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const taskCard = e.target.closest('.task-card');
    if (taskCard) {
        taskCard.classList.remove('drag-over');
    }
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.task-card').forEach(card => {
        card.classList.remove('drag-over');
    });
    updateTaskCounts();
}

// Helper function to get column ID from status
function getColumnIdFromStatus(status) {
    const columnMap = {
        'To Do': 'todo-column',
        'In Progress': 'in-progress-column',
        'Checking': 'checking-column',
        'Done': 'done-column'
    };
    return columnMap[status];
}

// Add validateTaskDate function if not already present
function validateTaskDate(dateInput) {
    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
        alert('Cannot set deadline to a past date');
        dateInput.value = today.toISOString().split('T')[0];
        return false;
    }
    return true;
}