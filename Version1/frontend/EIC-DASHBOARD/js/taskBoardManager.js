 // Update the modal close handler
 document.getElementById('taskDetailModal').addEventListener('hide.bs.modal', function() {
     if (currentTaskCard) {
         // Get all current values from the modal
         const title = document.getElementById('taskTitle').value;
         const description = document.getElementById('taskDescription').value;
         // IMPORTANT: Use the current status from the card if not changed in modal
         const status = document.getElementById('taskStatus').value || currentTaskCard.dataset.status;
         const privacy = document.getElementById('taskPrivacy').value;
         const hideFrom = document.getElementById('hideUserView').value;
         const assignTo = document.getElementById('taskAssign').value;
         const date = document.getElementById('taskDate').value;
         const category = document.getElementById('taskCategory').value;
         const link = document.getElementById('taskLink').value;

         // Update all task card data
         currentTaskCard.dataset.title = title;
         currentTaskCard.dataset.description = description;
         currentTaskCard.dataset.status = status; // This preserves the Done status
         currentTaskCard.dataset.privacy = privacy;
         currentTaskCard.dataset.hideFrom = hideFrom;
         currentTaskCard.dataset.assign = assignTo;
         currentTaskCard.dataset.date = date;
         currentTaskCard.dataset.category = category;
         currentTaskCard.dataset.link = link;

         // Only move to a new column if the status actually changed
         const currentColumn = currentTaskCard.parentElement.id;
         const targetColumnId = status.toLowerCase().replace(' ', '-') + '-column';

         if (currentColumn !== targetColumnId) {
             const newColumn = document.getElementById(targetColumnId);
             if (newColumn) {
                 newColumn.appendChild(currentTaskCard);
                 updateTaskCounts();
             }
         }

         // Update the card display
         updateTaskCard(currentTaskCard);
     }
 });

 document.getElementById('markAsDoneBtn').addEventListener('click', function() {
     if (!currentTaskCard) return;

     // Update task status to "Done"
     currentTaskCard.dataset.status = 'Done';

     // Move task to Done column
     const doneColumn = document.getElementById('done-column');
     if (doneColumn) {
         doneColumn.appendChild(currentTaskCard);

         // Update the status in the modal dropdown
         const statusDropdown = document.getElementById('taskStatus');
         if (statusDropdown) {
             statusDropdown.value = 'Done';
         }

         // Update the counts and card display
         updateTaskCounts();
         updateTaskCard(currentTaskCard);

         // Close the modal
         const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
         if (modal) {
             modal.hide();
         }
     }
 });

 // Add this to ensure the dropdown resets after modal closes
 document.getElementById('taskDetailModal').addEventListener('hidden.bs.modal', function() {
     const actionDropdown = document.getElementById('taskActionDropdown');
     if (actionDropdown) {
         actionDropdown.value = '';
     }
 });


 // Drag and Drop functions
 function allowDrop(ev) {
     ev.preventDefault();
     // Add visual feedback for drop target (optional)
     const dropZone = ev.target.closest('.task-column');
     if (dropZone) {
         dropZone.style.backgroundColor = '#f0f0f0';
     }
 }

 function drag(ev) {
     ev.dataTransfer.setData("text", ev.target.id);
 }

 function drop(ev) {
     ev.preventDefault();
     const data = ev.dataTransfer.getData("text");
     const draggedElement = document.getElementById(data);

     // Find the nearest task-column parent
     let dropZone = ev.target;
     while (dropZone && !dropZone.classList.contains('task-column')) {
         dropZone = dropZone.parentElement;
     }

     if (dropZone && draggedElement) {
         // Get the new status from the column ID
         const newStatus = dropZone.id.split('-')[0].charAt(0).toUpperCase() +
             dropZone.id.split('-')[0].slice(1);

         // Update the task's status
         draggedElement.dataset.status = newStatus;

         // Move the card to the new column
         dropZone.appendChild(draggedElement);

         // Update the task card display and counts
         updateTaskCard(draggedElement);
         updateTaskCounts();
     }
 }

 function updateTaskCounts() {
     const columns = document.querySelectorAll('.task-column');
     columns.forEach(column => {
         const count = column.querySelectorAll('.task-card').length;
         const countElement = column.closest('.task-header').querySelector('.task-count');
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

// Function to clear the add task form completely
function clearAddTaskForm() {
const form = document.getElementById('addTaskForm');
if (form) {
    form.reset();
}
clearErrorMessages();
}

// Add this to handle modal close/dismiss
document.getElementById('addTaskModal').addEventListener('hidden.bs.modal', function () {
clearAddTaskForm();
});

// Also add this to handle when the modal opens
document.getElementById('addTaskModal').addEventListener('show.bs.modal', function () {
clearAddTaskForm();
});

// Update the createTask function
function createTask(title, description, status, privacy, hideFrom, assignTo, assignedBy, date, category, link) {
const taskCard = document.createElement('div');
taskCard.className = 'task-card';
taskCard.draggable = true;
taskCard.id = 'task-' + Date.now();

// Set data attributes
taskCard.dataset.title = title;
taskCard.dataset.description = description;
taskCard.dataset.status = status;
taskCard.dataset.privacy = privacy;
taskCard.dataset.hideFrom = hideFrom;
taskCard.dataset.assign = assignTo;
taskCard.dataset.assignee = assignedBy;
taskCard.dataset.date = date;
taskCard.dataset.category = category;
taskCard.dataset.link = link;

// Create card content with privacy info
let privacyIcon = privacy === 'Public' ? 'fa-globe' : 'fa-lock';
let privacyText = privacy;
if (privacy === 'Private Except') {
    privacyIcon = 'fa-user-secret';
    privacyText = `Private Except: ${hideFrom}`;
}

taskCard.innerHTML = `
    <div class="task-card-content">
        <h3>${title}</h3>
        <p><i class="fa-regular fa-user"></i> ${assignTo}</p>
        <p><i class="fa-regular fa-calendar"></i> ${date}</p>
        <p><i class="fas ${privacyIcon}"></i> ${privacyText}</p>
    </div>
`;

// Add event listeners
taskCard.addEventListener('dragstart', drag);
taskCard.addEventListener('click', function() {
    openTaskDetails(this);
});

// Add to appropriate column
const columnId = status.toLowerCase().replace(' ', '-') + '-column';
const column = document.getElementById(columnId);
if (column) {
    column.appendChild(taskCard);
    updateTaskCounts();
}
}