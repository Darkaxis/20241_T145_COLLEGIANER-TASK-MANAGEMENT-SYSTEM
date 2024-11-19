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
        updateTaskCounts();
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
    console.log(taskData)


    // If status is Done, use the consolidated function
    if (newStatus === 'Done') {
        moveTaskToDone(taskCard);
    } else {
        updateTaskCard(taskCard);
    }
    
}