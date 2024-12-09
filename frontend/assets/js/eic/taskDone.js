// Mark as Done functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeMarkAsDone();
});

function initializeMarkAsDone() {
    // Add event listener for Mark as Done button in modal
    const markAsDoneBtn = document.getElementById('markAsDoneBtn');
    if (markAsDoneBtn) {
        markAsDoneBtn.addEventListener('click', function() {
            const taskDetailModal = document.getElementById('taskDetailModal');
            const taskId = taskDetailModal.dataset.currentTaskId;
            const taskCard = document.getElementById(taskId);
            if (taskCard) {
                moveTaskToDone(taskCard);
            }
        });
    }
}

async function moveTaskToDone(taskCard) {



    // Update the task's status
    taskCard.dataset.status = 'Done';
    const taskData = taskCard.dataset
    const taskId = taskCard.dataset.taskId;
    const response = await fetch(`https://localhost:3000/api/v1/eic/tasks/edit/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData),
        credentials: 'include'
    });
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
    } else {
        console.error('Done column not found');
    }

    // Update card display with completion indicator
    updateDoneTaskCard(taskCard);

    // Close any open modals
    const taskDetailModal = document.getElementById('taskDetailModal');
    if (taskDetailModal) {
        const modal = bootstrap.Modal.getInstance(taskDetailModal);
        if (modal) {
            modal.hide();
        }
    }
}

// Add completion animation styles
function addCompletionStyles() {
    if (!document.getElementById('completionAnimation')) {
        const style = document.createElement('style');
        style.id = 'completionAnimation';
        style.textContent = `
            @keyframes completionPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); background-color: rgba(40, 167, 69, 0.1); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Update task card display when marked as done
function updateDoneTaskCard(taskCard) {
    const existingContent = taskCard.querySelector('.task-card-body');
    if (existingContent) {
        // Remove existing completion status if any
        const existingStatus = existingContent.querySelector('.completion-status');
        if (existingStatus) {
            existingStatus.remove();
        }

        // Add completion indicator
        const completionStatus = document.createElement('p');
        completionStatus.className = 'text-success completion-status';
        completionStatus.innerHTML = '<i class="fas fa-check-circle"></i> Completed';
        existingContent.appendChild(completionStatus);
    }
}

// Toggle Mark as Done button visibility in modal
function toggleMarkAsDoneButton(taskCard) {
    const markAsDoneBtn = document.getElementById('markAsDoneBtn');
    if (markAsDoneBtn) {
        if (taskCard.dataset.status === 'Done') {
            markAsDoneBtn.style.display = 'none';
        } else {
            markAsDoneBtn.style.display = 'inline-block';
        }
    }
}

// Add this function if it's not defined elsewhere
function updateTaskCounts() {
    const columns = ['todo-column', 'in-progress-column', 'checking-column', 'done-column'];

    columns.forEach(columnId => {
        const column = document.getElementById(columnId);
        if (column) {
            const count = column.querySelectorAll('.task-card').length;
            const countElement = document.querySelector(`#${columnId}-count`);
            if (countElement) {
                countElement.textContent = count;
            }
        }
    });
}