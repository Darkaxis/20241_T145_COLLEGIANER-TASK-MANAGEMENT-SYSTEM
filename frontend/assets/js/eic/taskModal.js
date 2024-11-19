document.addEventListener('DOMContentLoaded',  function() {
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

            // Get form values
            const formData = {
                title: document.getElementById('taskTitleInput').value.trim(),
                description: document.getElementById('taskDescriptionInput').value.trim(),
                status: document.getElementById('taskStatusInput').value,
                privacy: document.getElementById('taskPrivacyInput').value,
                hideFrom: document.getElementById('hideUserInput').value.trim(),
                assignTo: document.getElementById('taskAssignInput').value.trim(),
                date: document.getElementById('taskDateInput').value,
                link: document.getElementById('taskLinkInput').value.trim()
            };

            if (validateFormData(formData)) {
                //send to server
                formData.date = new Date(formData.date).toISOString();
                const response = await fetch('https://localhost:3000/api/v1/eic/tasks/create', {    
                    method: 'POST',
                    include: 'credentials',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                createTask(formData);
                closeAndResetModal();
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
    privacyInput.onchange = toggleHideFromUsersInModal;

    // Enable hideFromUsers if needed
    const hideFromInput = document.getElementById('hideFromUsers');
    if (privacyInput.value === 'Private Except') {
        hideFromInput.removeAttribute('readonly');
    }

    // Show Save button, hide Edit button
    document.getElementById('editTaskButton').style.display = 'none';
    document.getElementById('saveEditButton').style.display = 'inline-block';
}

// Update the disableEditMode function
function disableEditMode() {
    // Make all inputs readonly
    const inputs = document.querySelectorAll('#taskDetailModal input, #taskDetailModal textarea');
    inputs.forEach(input => {
        input.setAttribute('readonly', true);
        input.classList.remove('editable');
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

    // Disable hideFromUsers
    const hideFromInput = document.getElementById('hideFromUsers');
    hideFromInput.setAttribute('readonly', true);

    // Show Edit button, hide Save button
    document.getElementById('editTaskButton').style.display = 'inline-block';
    document.getElementById('saveEditButton').style.display = 'none';
}

// Update the showTaskDetails function to use the new module
function showTaskDetails(taskCard) {
    const taskDetailModal = document.getElementById('taskDetailModal');
    taskDetailModal.dataset.currentTaskId = taskCard.id;

    // Populate modal fields
    document.getElementById('taskTitle').value = taskCard.dataset.taskName || '';
    document.getElementById('taskDescription').value = taskCard.dataset.description || '';
    document.getElementById('taskStatus').value = taskCard.dataset.status || '';
    document.getElementById('taskPrivacy').value = taskCard.dataset.privacy || '';
    document.getElementById('taskAssignTo').value = taskCard.dataset.assignTo || '';
    document.getElementById('taskDate').value = taskCard.dataset.deadline || '';
    document.getElementById('taskLink').value = taskCard.dataset.link || '';

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