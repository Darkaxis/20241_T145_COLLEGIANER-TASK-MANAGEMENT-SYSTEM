// Drag and Drop functionality
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

    if (draggedElement && ev.target.classList.contains('task-column')) {
        ev.target.appendChild(draggedElement);
        updateTaskStatus(draggedElement, ev.target.id);
        setTimeout(updateTaskCounts, 0);
    } else if (draggedElement && ev.target.closest('.task-column')) {
        // If dropped on a task card or somewhere inside the column
        const dropZone = ev.target.closest('.task-column');
        dropZone.appendChild(draggedElement);
        updateTaskStatus(draggedElement, dropZone.id);
        setTimeout(updateTaskCounts, 0);
    }
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
    const taskId = taskCard.dataset.taskId;

    const response = await fetch(`https://localhost:3000/api/v1/eic/tasks/edit/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData),
        credentials: 'include'
    });
    taskCard.dataset.version = parseInt(taskCard.dataset.version) + 1;
    console.log(taskCard.dataset.version)


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