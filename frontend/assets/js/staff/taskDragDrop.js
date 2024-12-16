// Disable drag and drop functionality for staff
function allowDrop(ev) {
    ev.preventDefault();
    // Do nothing else for staff
}

function drag(ev) {
    // Prevent dragging for staff
    ev.preventDefault();
}

function drop(ev) {
    // Prevent dropping for staff
    ev.preventDefault();
}

// Optional: Add this to make task cards visually appear non-draggable
document.addEventListener('DOMContentLoaded', function() {
    const taskCards = document.querySelectorAll('.task-card');
    taskCards.forEach(card => {
        card.style.cursor = 'default'; // Change cursor to default instead of move
        card.setAttribute('draggable', 'false'); // Disable draggable attribute
    });
});

// If you're using a task card creation function, update it to not add drag attributes
function createTaskCard(taskData) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.id = `task-${taskData.id}`;
    // Remove draggable attribute and ondragstart
    // card.setAttribute('draggable', 'true');
    // card.setAttribute('ondragstart', 'drag(event)');

    // ... rest of your card creation code ...

    return card;
}

async function updateTaskStatus(taskCard, columnId) {
    const statusMap = {
        'todo-column': 'To Do',
        'in-progress-column': 'In Progress',
        'checking-column': 'Checking',
        'done-column': 'Done'
    };

    const newStatus = statusMap[columnId] || 'To Do';

    taskCard.dataset.status = newStatus;
    //send to backend
    const taskData = taskCard.dataset;
    taskData.status = newStatus;
    const taskId = taskCard.dataset.taskId
    console.log(taskData)


    // If status is Done, use the consolidated function
    if (newStatus === 'Done') {
        moveTaskToDone(taskCard);
    } else {
        updateTaskCard(taskCard);
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
    return statusMap[columnId];
}

// Helper function to update single column count
function updateColumnCount(columnId) {
    const column = document.getElementById(columnId);
    const countElement = document.querySelector(`#${columnId}-count`);
    if (column && countElement) {
        // Get all visible task cards (not filtered out by search)
        const visibleCards = column.querySelectorAll('.task-card:not([style*="display: none"])');
        countElement.textContent = visibleCards.length;
    }
}

// Add this new function to update all column counts
function updateAllColumnCounts() {
    const columns = ['todo-column', 'in-progress-column', 'checking-column', 'done-column'];
    columns.forEach(columnId => updateColumnCount(columnId));
}