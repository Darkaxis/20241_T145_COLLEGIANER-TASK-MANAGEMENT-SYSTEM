// Global variable to store current task card
let currentTaskCard = null;

// Initialize event listeners when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Event listener for saving new task
    document.getElementById('saveTaskButton').addEventListener('click', function() {
        const taskData = {
            title: document.getElementById('taskTitleInput').value,
            description: document.getElementById('taskDescriptionInput').value,
            status: document.getElementById('taskStatusInput').value,
            privacy: document.getElementById('taskPrivacyInput').value,
            date: document.getElementById('taskDateInput').value,
            assign: document.getElementById('taskAssignInput').value,
            assignee: document.getElementById('taskAssigneeInput').value,
            category: document.getElementById('taskCategoryInput').value,
            link: document.getElementById('taskLinkInput').value
        };

        // Create and add the task card
        const taskCard = createTaskCard(taskData);

        // Add the card to the appropriate column based on status
        let columnId;
        switch (taskData.status.toLowerCase()) {
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

        document.getElementById(columnId).appendChild(taskCard);

        // Close the modal
        const addTaskModal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
        addTaskModal.hide();

        // Reset the form
        document.getElementById('addTaskForm').reset();

        // Update task counts
        updateTaskCounts();
    });

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
    taskCard.id = 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    // Store all task data in dataset
    taskCard.dataset.title = taskData.title || '';
    taskCard.dataset.description = taskData.description || '';
    taskCard.dataset.status = taskData.status || 'To Do';
    taskCard.dataset.privacy = taskData.privacy || 'Private';
    taskCard.dataset.date = taskData.date || '';
    taskCard.dataset.assign = taskData.assign || '';
    taskCard.dataset.assignee = taskData.assignee || '';
    taskCard.dataset.category = taskData.category || '';
    taskCard.dataset.link = taskData.link || '';

    taskCard.addEventListener('dragstart', drag);
    taskCard.addEventListener('click', () => showTaskDetail(taskCard));

    taskCard.innerHTML = `
        <h3>${taskData.title}</h3>
        <i class="fa-regular fa-user"></i> - ${taskData.assign}<br>
        <i class="fa-regular fa-calendar"></i> - ${taskData.date}<br>
        <i class="fa-solid fa-user-shield"></i> - ${taskData.privacy}
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
    const hideInputContainer = document.getElementById('hideInputDetailContainer');
    if (hideInputContainer) {
        hideInputContainer.style.display = taskData.privacy === 'Private Except' ? 'block' : 'none';
        if (taskData.privacy === 'Private Except') {
            document.getElementById('taskHideInput').value = taskData.hideFrom || '';
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
        const newStatus = dropZone.id.replace('-column', '');
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