let users = [];

document.addEventListener('DOMContentLoaded', async() => {
    try {
        // Use Promise.all to fetch tasks and users in parallel
        const [tasksResponse, usersResponse] = await Promise.all([
            fetch('https://localhost:3000/api/v1/eb/tasks/all', {
                method: 'GET',
                credentials: 'include',
                headers: { 'Cache-Control': 'no-cache' } // Prevent caching
            }),
            fetch('https://localhost:3000/api/v1/eb/users', {
                method: 'GET',
                credentials: 'include',
                headers: { 'Cache-Control': 'no-cache' } // Prevent caching
            })
        ]);
        
        // Process responses in parallel
        const [tasksData, usersData] = await Promise.all([
            tasksResponse.json(),
            usersResponse.json()
        ]);
        
        // Update users array
        users = usersData.data.map(user => user.name);
        
        // Create tasks with a small delay between each to prevent UI freezing
        const tasks = tasksData.tasks;
        if (tasks && tasks.length > 0) {
            // For better performance, batch task creation
            const batchSize = 10;
            for (let i = 0; i < tasks.length; i += batchSize) {
                const batch = tasks.slice(i, i + batchSize);
                setTimeout(() => {
                    batch.forEach(task => createTask(task));
                }, 0);
            }
        }
    } catch (error) {
        console.error('Error initializing tasks and users:', error);
        showNotification('Error loading tasks', 'error');
    }
    
    // Set up event listeners for task filtering
    setupTaskFilterListeners();
    
    // Setup modal handlers
    setupTaskDetailModalHandlers();
});

function createTask(task) {
    // Create the task card element
    const taskCard = document.createElement('div');
    taskCard.dataset.taskId = task.id;
    taskCard.className = 'task-card';
    taskCard.draggable = true;
    taskCard.id = 'task-' + Date.now();

    // Use a more efficient way to set data attributes
    for (const [key, value] of Object.entries(task)) {
        if (key !== 'hideFrom' && value !== undefined) {
            taskCard.dataset[key] = value;
        }
    }
    
    // Make sure category is included in the dataset
    if (!taskCard.dataset.category) {
        taskCard.dataset.category = '';
    }

    // Add event listeners
    addTaskCardEventListeners(taskCard);

    // Update card content
    updateTaskCard(taskCard);

    // Add to appropriate column
    const columnId = getColumnIdFromStatus(task.status || 'To Do');
    const column = document.getElementById(columnId);
    if (column) {
        // Use prepend to show new tasks at the top
        column.prepend(taskCard);
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
    taskCard.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        // Get the modal element
        const taskDetailModal = document.getElementById('taskDetailModal');
        
        // IMPORTANT: Set the task ID on the modal itself
        taskDetailModal.dataset.taskId = taskCard.dataset.taskId;
        console.log('Setting modal task ID:', taskCard.dataset.taskId);

        // Fill in the modal with task data
        document.getElementById('taskTitle').value = taskCard.dataset.taskName || '';
        document.getElementById('taskDescription').value = taskCard.dataset.description || '';
        document.getElementById('taskStatus').value = taskCard.dataset.status || '';
        document.getElementById('taskPrivacy').value = taskCard.dataset.privacy || '';
        document.getElementById('taskDetailCategory').value = taskCard.dataset.category || '';

        // Format the date for the input field (YYYY-MM-DD format)
        const dateInput = document.getElementById('taskDate');
        if (taskCard.dataset.deadline) {
            const deadlineDate = new Date(taskCard.dataset.deadline);
            const formattedDate = deadlineDate.toISOString().split('T')[0];
            dateInput.value = formattedDate;
        } else {
            dateInput.value = new Date().toISOString().split('T')[0];
        }

        // Update assignTo dropdown
        const assignToSelect = document.getElementById('taskAssignTo');
        assignToSelect.innerHTML = users.map(user =>
            `<option value="${user}" ${user === taskCard.dataset.assignedTo ? 'selected' : ''}>${user}</option>`
        ).join('');

        document.getElementById('taskLink').value = taskCard.dataset.link || '';

        // Handle Private Except case
        /* const hideFromContainer = document.getElementById('hideFromUsersContainer');
        const hideFromInput = document.getElementById('hideFromUsers');
        if (taskCard.dataset.privacy === 'Private Except') {
            hideFromInput.value = taskCard.dataset.hideFrom || '';
            hideFromContainer.style.display = 'block';
        } else {
            hideFromInput.value = '';
            hideFromContainer.style.display = 'none';
        } */

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
        'Private': 'fa-lock'
            // Remove Private Except icon
    };

    // Simplify privacy text display
    const privacyText = taskCard.dataset.privacy;

    // Format the date properly
    let deadlineDisplay = 'No deadline set';
    if (taskCard.dataset.deadline) {
        const deadlineDate = new Date(taskCard.dataset.deadline);
        deadlineDisplay = deadlineDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

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
                <p><i class="fa-regular fa-calendar"></i> ${deadlineDisplay}</p>
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

    deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this task?')) {
            try {
                const response = await fetch(`https://localhost:3000/api/v1/eb/tasks/delete/${taskCard.dataset.taskId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                
                if (response.ok) {
                    taskCard.remove();
                    updateTaskCounts();
                    showNotification('Task deleted successfully');
                } else {
                    showNotification('Failed to delete task');
                }
            } catch (error) {
                console.error('Error deleting task:', error);
                showNotification('Error deleting task');
            }
        }
        taskMenu.classList.remove('show');
    });

    // Close menu when clicking outside
    document.addEventListener('click', () => {
        taskMenu.classList.remove('show');
    });
}

function archiveTask(taskCard) {
    console.log('Archiving task:', taskCard.id);
    
    // Convert to async function and properly await the response
    (async () => {
        try {
            const response = await fetch(`https://localhost:3000/api/v1/eb/tasks/archive/${taskCard.dataset.taskId}`, {
                method: 'PATCH',
                credentials: 'include'
            });
            
            if (response.ok) {
                taskCard.remove();
                updateTaskCounts();
                showNotification('Task archived successfully');
            } else {
                showNotification('Failed to archive task');
            }
        } catch (error) {
            console.error('Error archiving task:', error);
            showNotification('Error archiving task');
        }
    })();
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

// Update the moveTaskToDone function to properly update the server
function moveTaskToDone(taskCard) {
    console.log('Moving task to Done:', taskCard.id);
    
    // Update status in the UI
    taskCard.dataset.status = 'Done';
    
    // Move the card to the Done column
    const doneColumn = document.getElementById('done-column');
    if (doneColumn) {
        doneColumn.appendChild(taskCard);
        updateTaskCounts();
    }
    
    // Update the server
    updateTaskStatus(taskCard.dataset.taskId, 'Done');
}

// Add a function to move task to In Progress
function moveTaskToInProgress(taskCard) {
    console.log('Moving task to In Progress:', taskCard.id);
    
    // Update status in the UI
    taskCard.dataset.status = 'In Progress';
    
    // Move the card to the In Progress column
    const inProgressColumn = document.getElementById('in-progress-column');
    if (inProgressColumn) {
        inProgressColumn.appendChild(taskCard);
        updateTaskCounts();
    }
    
    // Update the server
    updateTaskStatus(taskCard.dataset.taskId, 'In Progress');
}

// Add a function to move task to Checking
function moveTaskToChecking(taskCard) {
    console.log('Moving task to Checking:', taskCard.id);
    
    // Update status in the UI
    taskCard.dataset.status = 'Checking';
    
    // Move the card to the Checking column
    const checkingColumn = document.getElementById('checking-column');
    if (checkingColumn) {
        checkingColumn.appendChild(taskCard);
        updateTaskCounts();
    }
    
    // Update the server
    updateTaskStatus(taskCard.dataset.taskId, 'Checking');
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

    const privacyOptions = ['Public', 'Private'];
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

    if (privacySelect.value === 'Private') {
        hideFromContainer.style.display = 'block';
        hideFromInput.removeAttribute('readonly');
    } else {
        hideFromContainer.style.display = 'none';
    }
}

// Add validation function if it doesn't exist
function validateTaskFields() {
    console.log('Validating task fields');
    
    // Get all required input fields
    const titleInput = document.getElementById('taskTitle');
    const descriptionInput = document.getElementById('taskDescription');
    const dateInput = document.getElementById('taskDate');
    const statusSelect = document.getElementById('taskStatus');
    
    // If any of these are missing, log an error
    if (!titleInput || !descriptionInput || !dateInput || !statusSelect) {
        console.error('Required field elements not found in DOM:', {
            titleInput: !!titleInput,
            descriptionInput: !!descriptionInput,
            dateInput: !!dateInput,
            statusSelect: !!statusSelect
        });
    }
    
    // Define required fields with user-friendly names
    const requiredFields = [
        { field: titleInput, name: 'Title' },
        { field: descriptionInput, name: 'Description' },
        { field: dateInput, name: 'Due Date' },
        { field: statusSelect, name: 'Status' }
    ];
    
    // Check for empty fields
    const emptyFields = requiredFields.filter(item => {
        if (!item.field) return false; // Skip if field doesn't exist (will be caught by earlier check)
        return !item.field.value || item.field.value.trim() === '';
    });
    
    // If there are empty fields, show an error
    if (emptyFields.length > 0) {
        const fieldNames = emptyFields.map(item => item.name).join(', ');
        alert(`Please fill in all required fields: ${fieldNames}`);
        return false;
    }
    
    return true;
}

// Fix the setupTaskDetailModalHandlers function
function setupTaskDetailModalHandlers() {
    console.log('Setting up task detail modal handlers');
    
    // Setup edit button click handler
    const editButton = document.getElementById('editTaskButton');
    if (editButton) {
        editButton.onclick = () => enableEditMode();
    }
    
    // Setup save button click handler - FIXED
    const saveButton = document.getElementById('saveEditButton');
    if (saveButton) {
        console.log('Adding click handler to save button');
        saveButton.onclick = function() {
            console.log('Save button clicked');
            
            const taskDetailModal = document.getElementById('taskDetailModal');
            // Fix: Use the correct data attribute name
            const taskId = taskDetailModal.dataset.taskId;
            console.log('Looking for task with ID:', taskId);
            
            // Try multiple ways to find the task card
            let taskCard = document.getElementById('task-' + taskId) || 
                          document.getElementById(taskId) || 
                          document.querySelector(`[data-task-id="${taskId}"]`);
            
            if (taskCard) {
                console.log('Found task card:', taskCard);
                saveTaskEdits(taskCard);
            } else {
                console.error('Could not find task card with ID:', taskId);
                showNotification('Error: Could not find task to save', 'error');
            }
        };
    } else {
        console.warn('Save button not found in DOM');
    }
    
    // Ensure task modal has event listeners when shown
    const taskDetailModal = document.getElementById('taskDetailModal');
    if (taskDetailModal) {
        taskDetailModal.addEventListener('shown.bs.modal', function() {
            console.log('Modal shown, reinforcing save button handler');
            // Re-attach save button handler when modal is shown
            const saveButton = document.getElementById('saveEditButton');
            if (saveButton) {
                saveButton.onclick = function() {
                    const taskId = taskDetailModal.dataset.taskId;
                    console.log('Save clicked, task ID:', taskId);
                    
                    let taskCard = document.getElementById('task-' + taskId) || 
                                  document.getElementById(taskId) || 
                                  document.querySelector(`[data-task-id="${taskId}"]`);
                    
                    if (taskCard) {
                        saveTaskEdits(taskCard);
                    } else {
                        console.error('Could not find task card with ID:', taskId);
                        showNotification('Error: Could not find task to save', 'error');
                    }
                };
            }
        });
    }
}

// Also ensure saveTaskEdits can handle the task data properly
async function saveTaskEdits(taskCard) {
    console.log('saveTaskEdits called with taskCard:', taskCard);
    
    // First validate all required fields
    if (!validateTaskFields()) {
        return false;
    }
    
    // Show a loading indicator
    const saveButton = document.querySelector('#saveEditButton');
    if (!saveButton) {
        console.error('Save button not found!');
        return false;
    }
    
    const originalButtonText = saveButton.textContent;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
    saveButton.disabled = true;
    
    // Get all the form fields
    const dateInput = document.getElementById('taskDate');
    const titleInput = document.getElementById('taskTitle');
    const descriptionInput = document.getElementById('taskDescription');
    const statusSelect = document.getElementById('taskStatus');
    
    // These fields might be optional depending on the role
    const prioritySelect = document.getElementById('taskPriority') || { value: 'Medium' };
    const assigneeSelect = document.getElementById('taskAssignee');
    
    // Log all field values for debugging
    console.log('Form field values:', {
        title: titleInput?.value,
        description: descriptionInput?.value,
        date: dateInput?.value,
        status: statusSelect?.value,
        priority: prioritySelect?.value,
        assignee: assigneeSelect?.value
    });
    
    try {
        // Format date properly
        const selectedDate = new Date(dateInput.value);
        selectedDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
        const isoDate = selectedDate.toISOString();
        
        // Prepare data for update
        const updatedData = {
            title: titleInput.value.trim(),
            description: descriptionInput.value.trim(),
            dueDate: isoDate,
            status: statusSelect.value,
            priority: prioritySelect.value,
            assignee: assigneeSelect.value
        };
        
        console.log('Update data prepared:', updatedData);
        
        // Send to backend
        const taskId = taskCard.dataset.taskId;
        console.log(`Sending update to server for task ID: ${taskId}`);
        
        const response = await fetch(`https://localhost:3000/api/v1/eb/tasks/update/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData),
            credentials: 'include'
        });
        
        // Reset button state
        saveButton.innerHTML = originalButtonText;
        saveButton.disabled = false;
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update task');
        }
        
        // Update task card with data
        Object.entries(updatedData).forEach(([key, value]) => {
            taskCard.dataset[key] = value;
        });
        
        // Update the card display
        updateTaskCard(taskCard);
        
        // Move card to correct column if status changed
        const columnId = getColumnIdFromStatus(updatedData.status);
        const targetColumn = document.getElementById(columnId);
        const originalColumn = taskCard.parentElement;
        if (targetColumn && originalColumn && originalColumn.id !== columnId) {
            targetColumn.appendChild(taskCard);
            updateTaskCounts();
        }
        
        // Reset modal to view mode
        if (typeof disableEditMode === 'function') {
            disableEditMode();
        }
        
        // Close the modal
        const modal = document.getElementById('taskDetailModal');
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        }
        
        showNotification('Task updated successfully', 'success');
        return true;
        
    } catch (error) {
        console.error('Error updating task:', error);
        
        // Reset button state
        saveButton.innerHTML = originalButtonText;
        saveButton.disabled = false;
        
        showNotification('Failed to update task: ' + error.message, 'error');
        return false;
    }
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
    
    // Get the dragged task and its new column
    const draggedTask = document.querySelector('.dragging');
    if (draggedTask) {
        const newColumn = e.target.closest('.task-column');
        if (newColumn) {
            const newStatus = getStatusFromColumnId(newColumn.id);
            const taskId = draggedTask.dataset.taskId;
            
            // Update the task's status attribute
            draggedTask.dataset.status = newStatus;
            
            // Update the server
            updateTaskStatus(taskId, newStatus);
        }
    }
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.task-card').forEach(card => {
        card.classList.remove('drag-over');
    });
    updateTaskCounts();
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

// Update the createNewTask function to validate fields
async function createNewTask() {
    // First validate all required fields
    if (!validateTaskFields()) {
        return false;
    }
    
    const titleInput = document.getElementById('taskTitle');
    const descriptionInput = document.getElementById('taskDescription');
    const dateInput = document.getElementById('taskDate');
    const statusSelect = document.getElementById('taskStatus');
    const prioritySelect = document.getElementById('taskPriority');
    const assigneeSelect = document.getElementById('taskAssignee');
    
    // Create task data object
    const taskData = {
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim(),
        dueDate: dateInput.value,
        status: statusSelect.value,
        priority: prioritySelect.value,
        assignee: assigneeSelect.value
    };
    
    // Generate a temporary ID for the task
    const tempId = `temp-${Date.now()}`;
    
    // Create a temporary task card
    const tempTask = {
        _id: tempId,
        ...taskData
    };
    
    // Add the temporary task to the UI
    createTask(tempTask);
    
    try {
        // Send the task data to the server
        const response = await fetch('https://localhost:3000/api/v1/eb/tasks/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(taskData)
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // Find the temporary task card and update it with the real ID
            const tempCard = document.querySelector(`[data-task-id="${tempId}"]`);
            if (tempCard) {
                tempCard.dataset.taskId = result.taskId;
                delete tempCard.dataset._isTemporary;
                
                // Update any visual indicators if needed
                updateTaskCard(tempCard);
            }
            
            showNotification('Task created successfully');
            return true;
        } else {
            // If the server request failed, remove the temporary task
            const tempCard = document.querySelector(`[data-task-id="${tempId}"]`);
            if (tempCard) {
                tempCard.remove();
                updateTaskCounts();
            }
            
            showNotification('Failed to create task');
            return false;
        }
    } catch (error) {
        console.error('Error creating task:', error);
        
        // If there was an error, remove the temporary task
        const tempCard = document.querySelector(`[data-task-id="temp-${Date.now()}"]`);
        if (tempCard) {
            tempCard.remove();
            updateTaskCounts();
        }
        
        showNotification('Error creating task');
        return false;
    }
}

// Add this function to update task status on the server
async function updateTaskStatus(taskId, newStatus) {
    try {
        const response = await fetch(`https://localhost:3000/api/v1/eb/tasks/update/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            showNotification(`Task moved to ${newStatus}`);
            return true;
        } else {
            showNotification('Failed to update task status');
            return false;
        }
    } catch (error) {
        console.error('Error updating task status:', error);
        showNotification('Error updating task status');
        return false;
    }
}

// Helper function to get status from column ID
function getStatusFromColumnId(columnId) {
    const statusMap = {
        'todo-column': 'To Do',
        'in-progress-column': 'In Progress',
        'checking-column': 'Checking',
        'done-column': 'Done'
    };
    return statusMap[columnId] || 'To Do';
}

// Extract task filter setup to a separate function for cleaner code
function setupTaskFilterListeners() {
    const myTask = document.getElementById('myTask');
    myTask.addEventListener('click', () => fetchAndDisplayTasks('user'));
    
    const allTask = document.getElementById('allTask');
    allTask.addEventListener('click', () => fetchAndDisplayTasks('all'));
}

// Consolidated function for fetching and displaying tasks
async function fetchAndDisplayTasks(type) {
    try {
        const endpoint = type === 'user' ? 
            'https://localhost:3000/api/v1/eb/tasks/get/user' : 
            'https://localhost:3000/api/v1/eb/tasks/all';
            
        showNotification('Loading tasks...', 'info');
        
        const response = await fetch(endpoint, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache' }
        });
        
        const tasks = await response.json();
        
        // Clear existing tasks
        document.querySelectorAll('.task-card').forEach(card => card.remove());
        
        // Add new tasks
        if (tasks.tasks && tasks.tasks.length > 0) {
            tasks.tasks.forEach(task => createTask(task));
            showNotification(`Loaded ${tasks.tasks.length} tasks`);
        } else {
            showNotification('No tasks found');
        }
    } catch (error) {
        console.error('Error fetching tasks:', error);
        showNotification('Error loading tasks', 'error');
    }
}

// Add this global function at the top of your file
window.saveTaskChanges = function() {
    console.log('saveTaskChanges called directly');
    
    // Get the modal and task ID
    const modal = document.getElementById('taskDetailModal');
    const taskId = modal.dataset.taskId;
    
    console.log('Task ID:', taskId);
    
    if (!taskId) {
        alert('Error: Could not identify task ID');
        return;
    }
    
    // Get form data
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const date = document.getElementById('taskDate').value;
    const status = document.getElementById('taskStatus').value;
    const privacy = document.getElementById('taskPrivacy').value;
    const category = document.getElementById('taskDetailCategory').value;
    const link = document.getElementById('taskLink').value || '';
    const assignTo = document.getElementById('taskAssignTo')?.value || '';
    
    // Validate required fields
    if (!title || !description || !date || !status) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Format date
    const selectedDate = new Date(date);
    selectedDate.setHours(12, 0, 0, 0);
    const isoDate = selectedDate.toISOString();
    
    // Create update data
    const updatedData = {
        taskName: title.trim(),
        description: description.trim(),
        deadline: isoDate,
        status: status,
        privacy: privacy,
        category: category,
        link: link,
        assignedTo: assignTo
    };
    
    console.log('Update data:', updatedData);
    
    // Show loading state
    const saveButton = document.getElementById('saveEditButton');
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';
    saveButton.disabled = true;
    
    // Send update to server
    fetch(`https://localhost:3000/api/v1/eb/tasks/update/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Server returned error ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log('Update successful:', data);
        
        // Close the modal
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
            bsModal.hide();
        } else {
            // Fallback
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
        }
        
        // Reload the page to ensure everything is updated
        alert('Task updated successfully! Page will reload.');
        window.location.reload();
    })
    .catch(error => {
        console.error('Error updating task:', error);
        saveButton.innerHTML = 'Save Changes';
        saveButton.disabled = false;
        alert('Error saving task: ' + error.message);
    });
};

// Add this to your DOMContentLoaded event
document.addEventListener('DOMContentLoaded', function() {
    // Add direct onclick attribute to save button when modal is shown
    const taskDetailModal = document.getElementById('taskDetailModal');
    if (taskDetailModal) {
        taskDetailModal.addEventListener('shown.bs.modal', function() {
            console.log('Modal shown, adding direct onclick to save button');
            const saveButton = document.getElementById('saveEditButton');
            if (saveButton) {
                saveButton.setAttribute('onclick', 'saveTaskChanges()');
                console.log('Added onclick attribute to save button');
            }
        });
    }
});