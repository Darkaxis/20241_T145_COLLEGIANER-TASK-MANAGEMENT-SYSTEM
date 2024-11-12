// Function to clear the form
function clearAddTaskForm() {
    document.getElementById('taskTitleInput').value = '';
    document.getElementById('taskDescriptionInput').value = '';
    document.getElementById('taskStatusInput').value = 'To Do';
    document.getElementById('taskPrivacyInput').value = 'Private';
    document.getElementById('hideUserInput').value = '';
    document.getElementById('taskAssignInput').value = '';
    document.getElementById('taskAssigneeInput').value = '';
    document.getElementById('taskDateInput').value = '';
    document.getElementById('taskCategoryInput').value = '';
    document.getElementById('taskLinkInput').value = '';

    // Hide the hideInputContainer
    document.getElementById('hideInputContainer').style.display = 'none';
}

// Modify your existing save task function
function saveTask() {
    // Your existing save task code...

    // Clear the form after saving
    clearAddTaskForm();

    // Close the modal
    $('#addTaskModal').modal('hide');
}

// Add this event listener to clear form when modal is closed
document.getElementById('addTaskModal').addEventListener('hidden.bs.modal', function() {
    clearAddTaskForm();
});