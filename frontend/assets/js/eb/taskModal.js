document.addEventListener('DOMContentLoaded', async function() {
    // Initialize Mark as Done button handler
    const markAsDoneBtn = document.getElementById('markAsDoneBtn');
    if (markAsDoneBtn) {
        markAsDoneBtn.addEventListener('click', function() {
            const taskId = document.getElementById('taskDetailModal').dataset.currentTaskId;
            const taskCard = document.getElementById(taskId);
            if (taskCard) {
                moveTaskToDone(taskCard);
            }
        });


    }

    //fetch all user names
    const response = await fetch('https://localhost:3000/api/v1/eb/users', {
        method: 'GET',
        credentials: 'include'
    })
    const data = await response.json();

    console.log(data);
    const users = data.data;
    const assignInput = document.getElementById('taskAssignInput');
    if (assignInput) {
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.name;
            option.text = user.name;
            assignInput.appendChild(option);
        });
    }

    // Add Task button click handler
    const addTaskBtn = document.querySelector('.add-task-btn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', function() {
            const addTaskModal = new bootstrap.Modal(document.getElementById('addTaskModal'));
            addTaskModal.show();
        });
    }

    // Save Task Button Handler
    const saveTaskButton = document.getElementById('saveTaskButton');
    if (saveTaskButton) {
        saveTaskButton.addEventListener('click', async function() {
            clearErrorMessages();

            // Get form values with consistent property name
            const formData = {
                taskName: document.getElementById('taskTitleInput').value.trim(),
                description: document.getElementById('taskDescriptionInput').value.trim(),
                status: document.getElementById('taskStatusInput').value,
                privacy: document.getElementById('taskPrivacyInput').value,
                assignedTo: document.getElementById('taskAssignInput').value.trim(),
                deadline: document.getElementById('taskDateInput').value,
                link: document.getElementById('taskLinkInput').value.trim(),
                category: document.getElementById('taskCategoryInput').value.trim()
            };
    
            if (validateFormData(formData)) {
                saveTaskButton.disabled = true;
                saveTaskButton.innerHTML = 'Creating...';
                saveTaskButton.classList.add('disabled');
                saveTaskButton.classList.remove('btn-primary');
                saveTaskButton.classList.add('btn-secondary');
                //send to server
                const response = await fetch('https://localhost:3000/api/v1/eb/tasks/create', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                saveTaskButton.disabled = false;
                saveTaskButton.innerHTML = 'Create Task';
                saveTaskButton.classList.remove('disabled');
                saveTaskButton.classList.remove('btn-secondary');
                saveTaskButton.classList.add('btn-primary');

                
                createTask(formData);
                closeAndResetModal();
            }
            else{
                alert('Please fill in all required fields');
        }   
        });
    }

    // Helper functions
    function closeAndResetModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
        if (modal) {
            modal.hide();
            clearAddTaskForm();
        }
    }

    function clearAddTaskForm() {
        const form = document.getElementById('addTaskForm');
        if (form) {
            form.reset();
            clearErrorMessages();
            const hideInputContainer = document.getElementById('hideInputContainer');
            if (hideInputContainer) {
                hideInputContainer.style.display = 'none';
            }
        }
    }

    // Modal event listeners
    const addTaskModal = document.getElementById('addTaskModal');
    if (addTaskModal) {
        addTaskModal.addEventListener('hidden.bs.modal', clearAddTaskForm);
        addTaskModal.addEventListener('show.bs.modal', clearAddTaskForm);
    }

    // Add handlers for Submit To and Mark as Done in modal
    const taskDetailModal = document.getElementById('taskDetailModal');
    if (taskDetailModal) {
        // Handle Submit To clicks
        taskDetailModal.querySelectorAll('.submit-to-user').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const user = e.target.dataset.user;
                const taskId = taskDetailModal.dataset.currentTaskId;
                const taskCard = document.getElementById(taskId);
                if (taskCard) {
                    handleSubmitTo(taskCard, user);
                }
            });
        });

        // Handle Mark as Done click
        const markDoneButton = document.getElementById('markDoneButton');
        if (markDoneButton) {
            markDoneButton.addEventListener('click', function() {
                const taskId = taskDetailModal.dataset.currentTaskId;
                const taskCard = document.getElementById(taskId);
                if (taskCard) {
                    handleMarkAsDone(taskCard);
                }
            });
        }
    }

    // Set minimum date for date inputs
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const today = new Date().toISOString().split('T')[0];

    dateInputs.forEach(input => {
        input.setAttribute('min', today);
    });
});

// Toggle hide input function
function toggleHideInput() {
    const privacySelect = document.getElementById('taskPrivacyInput');
    const hideInputContainer = document.getElementById('hideInputContainer');

    if (privacySelect && hideInputContainer) {
        if (privacySelect.value === 'Private Except') {
            hideInputContainer.style.display = 'block';
        } else {
            hideInputContainer.style.display = 'none';
        }
    }
}

// Update the enableEditMode function
function enableEditMode() {
    // Make inputs editable
    const inputs = document.querySelectorAll('#taskDetailModal input, #taskDetailModal textarea');
    inputs.forEach(input => {
        input.removeAttribute('readonly');
        input.classList.add('editable');
    });

    // Enable specific select elements
    const editableSelects = ['taskStatus', 'taskPrivacy', 'taskAssignTo', 'taskSubmitTo'];
    editableSelects.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.disabled = false;
            select.classList.add('editable');
        }
    });

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

    // Handle privacy dropdown
    const privacyInput = document.getElementById('taskPrivacy');
    privacyInput.disabled = false;

    // Show Save button, hide Edit button
    document.getElementById('editTaskButton').style.display = 'none';
    document.getElementById('saveEditButton').style.display = 'inline-block';

    // Add date validation for edit mode
    const dateInput = document.getElementById('taskDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
        dateInput.addEventListener('change', function() {
            validateTaskDate(this);
        });
    }
}

// Update the disableEditMode function
function disableEditMode() {
    // Make all inputs readonly
    const inputs = document.querySelectorAll('#taskDetailModal input, #taskDetailModal textarea');
    inputs.forEach(input => {
        input.setAttribute('readonly', true);
        input.classList.remove('editable');
    });

    // Disable all select elements
    const selects = document.querySelectorAll('#taskDetailModal select');
    selects.forEach(select => {
        select.disabled = true;
        select.classList.remove('editable');
    });

    // Convert dropdowns back to readonly inputs
    const statusSelect = document.getElementById('taskStatus');
    if (statusSelect.tagName === 'SELECT') {
        const statusInput = document.createElement('input');
        statusInput.type = 'text';
        statusInput.className = 'form-control';
        statusInput.id = 'taskStatus';
        statusInput.value = statusSelect.value;
        statusInput.setAttribute('readonly', true);
        statusSelect.parentNode.replaceChild(statusInput, statusSelect);
    }

    // Disable privacy dropdown
    const privacyDropdown = document.getElementById('taskPrivacy');
    privacyDropdown.disabled = true;

    // Show Edit button, hide Save button
    document.getElementById('editTaskButton').style.display = 'inline-block';
    document.getElementById('saveEditButton').style.display = 'none';
}

// Add this function to handle date validation in the task detail modal
function validateTaskDate(dateInput) {
    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
        showErrorMessage(dateInput.id, 'Deadline cannot be set in the past');
        dateInput.value = today.toISOString().split('T')[0];
        return false;
    }
    return true;
}

// Update the showTaskDetails function
function showTaskDetails(taskCard) {
    const taskDetailModal = document.getElementById('taskDetailModal');
    taskDetailModal.dataset.currentTaskId = taskCard.id;

    // Populate modal fields
    document.getElementById('taskTitle').value = taskCard.dataset.taskName || '';
    document.getElementById('taskDescription').value = taskCard.dataset.description || '';
    document.getElementById('taskStatus').value = taskCard.dataset.status || '';
    document.getElementById('taskPrivacy').value = taskCard.dataset.privacy || '';
    document.getElementById('taskAssignTo').value = taskCard.dataset.assignedTo || '';

    // Format the date for display
    const taskDateInput = document.getElementById('taskDate');
    const today = new Date().toISOString().split('T')[0];
    taskDateInput.setAttribute('min', today);

    // Convert ISO date to YYYY-MM-DD format for input
    if (taskCard.dataset.deadline) {
        const deadlineDate = new Date(taskCard.dataset.deadline);
        const formattedDate = deadlineDate.toISOString().split('T')[0];
        taskDateInput.value = formattedDate;
    } else {
        taskDateInput.value = today;
    }

    // Validate and set the date
    validateTaskDate(taskDateInput);

    document.getElementById('taskLink').value = taskCard.dataset.link || '';

    // Add event listener for date changes
    taskDateInput.addEventListener('change', function() {
        validateTaskDate(this);
    });

    // Toggle Mark as Done button visibility
    toggleMarkAsDoneButton(taskCard);

    // Update privacy handling
    const privacySelect = document.getElementById('taskPrivacy');
    privacySelect.value = taskCard.dataset.privacy || 'Private';

    // Handle hideFromUsers field
    const hideFromContainer = document.getElementById('hideFromUsersContainer');
    const hideFromInput = document.getElementById('hideFromUsers');

    if (taskCard.dataset.privacy === 'Private Except') {
        hideFromContainer.style.display = 'block';
        hideFromInput.value = taskCard.dataset.hideFrom || '';
    } else {
        hideFromContainer.style.display = 'none';
        hideFromInput.value = '';
    }

    // Ensure all fields are readonly initially
    disableEditMode();
}

// Add this function to handle hide from users toggle in modal
function toggleHideFromUsersInModal() {
    const privacySelect = document.getElementById('taskPrivacy');
    const hideFromContainer = document.getElementById('hideFromUsersContainer');
    const hideFromInput = document.getElementById('hideFromUsers');

    if (privacySelect.value === 'Private Except') {
        hideFromContainer.style.display = 'block';
        hideFromInput.removeAttribute('readonly');
    } else {
        hideFromContainer.style.display = 'none';
        hideFromInput.value = '';
    }
}

// Update the validateTaskFields function to correctly identify the assignee field
function validateTaskFields() {
    const titleInput = document.getElementById('taskTitle');
    const descriptionInput = document.getElementById('taskDescription');
    const dateInput = document.getElementById('taskDate');
    
    // Try different possible IDs for the assignee field
    let assigneeSelect = document.getElementById('taskAssignee');
    if (!assigneeSelect) {
        assigneeSelect = document.querySelector('select[name="assignee"]');
    }
    if (!assigneeSelect) {
        assigneeSelect = document.querySelector('.assignee-select');
    }
    
    console.log('Found assignee element:', assigneeSelect);
    
    // Create an array of required fields with their display names
    const requiredFields = [
        { field: titleInput, name: 'Title' },
        { field: descriptionInput, name: 'Description' },
        { field: dateInput, name: 'Due Date' }
    ];
    
    // Only add assignee to required fields if we found the element
    if (assigneeSelect) {
        requiredFields.push({ field: assigneeSelect, name: 'Assignee' });
    }
    
    // Debug logging to check field values
    console.log('Validating fields:');
    requiredFields.forEach(item => {
        console.log(`${item.name}: `, item.field ? item.field.value : 'field not found');
    });
    
    // Check each field and collect any that are empty
    const emptyFields = requiredFields.filter(item => {
        // Make sure the field exists before checking its value
        if (!item.field) {
            console.error(`Field ${item.name} not found in the DOM`);
            return true; // Consider missing fields as empty
        }
        return !item.field.value || item.field.value.trim() === '';
    });
    
    // If there are empty fields, show an error and return false
    if (emptyFields.length > 0) {
        const fieldNames = emptyFields.map(item => item.name).join(', ');
        alert(`Please fill in all required fields: ${fieldNames}`);
        return false;
    }
    
    return true;
}

// Update the saveTaskEdits function to use validation
async function saveTaskEdits(taskCard) {

    if (!validateTaskFields()) {
        return false;
    }
    const dateInput = document.getElementById('taskDate');
    if (!validateTaskDate(dateInput)) {
        return false;
    }

    // Ensure date is properly formatted as ISO string
    const selectedDate = new Date(dateInput.value);
    selectedDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    const isoDate = selectedDate.toISOString();

    // Get updated values
    const updatedData = {
        id: taskCard.dataset.taskId,
        taskName: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        status: document.getElementById('taskStatus').value,
        privacy: document.getElementById('taskPrivacy').value,
        assignedTo: document.getElementById('taskAssignTo').value,
        deadline: isoDate,
        link: document.getElementById('taskLink').value,
        category: document.getElementById('taskDetailCategory').value
    };

    /* Comment out hideFrom handling
    if (updatedData.privacy === 'Private Except') {
        updatedData.hideFrom = document.getElementById('hideFromUsers').value;
    }
    */

    console.log('Sending update with data:', updatedData);

    try {
        // Send to backend
        const taskId = taskCard.dataset.taskId;
        console.log(taskId);
        const response = await fetch(`https://localhost:3000/api/v1/eb/tasks/edit/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(updatedData),
            credentials: 'include'
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server error:', errorData);
            throw new Error(`Failed to update task: ${errorData.message || 'Unknown error'}`);
        }

        const responseData = await response.json();
        console.log('Update successful:', responseData);

        // Update task card dataset with the response data
        Object.entries(updatedData).forEach(([key, value]) => {
            taskCard.dataset[key] = value;
        });

        // Update the card display
        updateTaskCard(taskCard);

        // Move card to correct column if status changed
        const columnId = getColumnIdFromStatus(updatedData.status);
        const targetColumn = document.getElementById(columnId);
        if (targetColumn && taskCard.id !== columnId) {
            targetColumn.appendChild(taskCard);
            updateTaskCounts();
        }

        // Reset modal to view mode
        disableEditMode();

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
        modal.hide();

    } catch (error) {
        console.error('Error updating task:', error);
        alert(`Failed to update task: ${error.message}`);
    }
}