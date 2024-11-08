// Global variable to track current task card
let currentTaskCard = null;

// Initialize event listeners when document is ready
document.addEventListener('DOMContentLoaded', function() {
            // Add event listener for mark as done button
            document.getElementById('markAsDoneBtn').addEventListener('click', function() {
                if (currentTaskCard) {
                    // Update task status to Done
                    currentTaskCard.dataset.status = 'Done';

                    // Move card to Done column
                    const doneColumn = document.querySelector('#done-column');
                    if (doneColumn) {
                        doneColumn.appendChild(currentTaskCard);
                    }

                    // Update the card's visual appearance
                    updateTaskCard(currentTaskCard);

                    // Update task counts
                    updateTaskCounts();

                    // Close the modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
                    modal.hide();

                    // Show success message
                    showSuccessToast('Task marked as done');
                }
            });

            // Event listener for saving new task
            document.getElementById('saveTaskButton').addEventListener('click', function(e) {
                        e.preventDefault(); // Prevent default form submission

                        // Clear previous error messages
                        clearErrorMessages();

                        // Get fresh values and validate each field
                        const formFields = [{
                                value: document.getElementById('taskTitleInput').value.trim(),
                                id: 'taskTitleInput',
                                message: 'Please enter title'
                            },
                            {
                                value: document.getElementById('taskDescriptionInput').value.trim(),
                                id: 'taskDescriptionInput',
                                message: 'Please enter description'
                            },
                            {
                                value: document.getElementById('taskStatusInput').value,
                                id: 'taskStatusInput',
                                message: 'Please select status'
                            },
                            {
                                value: document.getElementById('taskPrivacyInput').value,
                                id: 'taskPrivacyInput',
                                message: 'Please select privacy'
                            },
                            {
                                value: document.getElementById('taskDateInput').value,
                                id: 'taskDateInput',
                                message: 'Please select date'
                            },
                            {
                                value: document.getElementById('taskAssignInput').value.trim(),
                                id: 'taskAssignInput',
                                message: 'Please enter assign to'
                            },
                            {
                                value: document.getElementById('taskAssigneeInput').value.trim(),
                                id: 'taskAssigneeInput',
                                message: 'Please enter assignee'
                            },
                            {
                                value: document.getElementById('taskCategoryInput').value.trim(),
                                id: 'taskCategoryInput',
                                message: 'Please select category'
                            },
                            {
                                value: document.getElementById('taskLinkInput').value.trim(),
                                id: 'taskLinkInput',
                                message: 'Please enter link'
                            }
                        ];

                        let hasErrors = false;

                        // Validate each field and show error messages
                        formFields.forEach(field => {
                            if (!field.value) {
                                showErrorMessage(field.id, field.message);
                                hasErrors = true;
                            }
                        });

                        // Special validation for hideFrom field when Privacy is "Private Except"
                        const privacyValue = document.getElementById('taskPrivacyInput').value;
                        const hideFromValue = document.getElementById('hideUserInput').value.trim();
                        if (privacyValue === 'Private Except' && !hideFromValue) {
                            showErrorMessage('hideUserInput', 'Please enter hide from');
                            hasErrors = true;
                        }

                        // If there are any errors, stop form submission
                        if (hasErrors) {
                            return;
                        }

                        // Get fresh values directly from the form inputs
                        const titleInput = document.getElementById('taskTitleInput');
                        const descriptionInput = document.getElementById('taskDescriptionInput');
                        const statusInput = document.getElementById('taskStatusInput');
                        const privacyInput = document.getElementById('taskPrivacyInput');
                        const hideFromInput = document.getElementById('hideUserInput');
                        const dateInput = document.getElementById('taskDateInput');
                        const assignInput = document.getElementById('taskAssignInput');
                        const assigneeInput = document.getElementById('taskAssigneeInput');
                        const categoryInput = document.getElementById('taskCategoryInput');
                        const linkInput = document.getElementById('taskLinkInput');

                        // Get values and trim them
                        const title = titleInput ? titleInput.value.trim() : '';
                        const description = descriptionInput ? descriptionInput.value.trim() : '';
                        const status = statusInput ? statusInput.value : '';
                        const privacy = privacyInput ? privacyInput.value : '';
                        const hideFrom = hideFromInput ? hideFromInput.value.trim() : '';
                        const date = dateInput ? dateInput.value : '';
                        const assign = assignInput ? assignInput.value.trim() : '';
                        const assignee = assigneeInput ? assigneeInput.value.trim() : '';
                        const category = categoryInput ? categoryInput.value.trim() : '';
                        const link = linkInput ? linkInput.value.trim() : '';

                        // Debug log
                        console.log('Form Values:', {
                            title,
                            description,
                            status,
                            privacy,
                            hideFrom,
                            date,
                            assign,
                            assignee,
                            category,
                            link
                        });

                        // Store the values before validation
                        const formData = {
                            title,
                            description,
                            status,
                            privacy,
                            hideFrom,
                            date,
                            assign,
                            assignee,
                            category,
                            link
                        };

                        // Create task card with the stored values
                        const taskCard = document.createElement('div');
                        taskCard.className = 'task-card';
                        taskCard.draggable = true;
                        taskCard.id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

                        // Store the data in the card's dataset using stored values
                        taskCard.dataset.title = formData.title;
                        taskCard.dataset.description = formData.description;
                        taskCard.dataset.status = formData.status;
                        taskCard.dataset.privacy = formData.privacy;
                        taskCard.dataset.hideFrom = formData.hideFrom;
                        taskCard.dataset.date = formData.date;
                        taskCard.dataset.assign = formData.assign;
                        taskCard.dataset.assignee = formData.assignee;
                        taskCard.dataset.category = formData.category;
                        taskCard.dataset.link = formData.link;

                        // Add event listeners
                        taskCard.addEventListener('dragstart', drag);
                        taskCard.addEventListener('click', () => showTaskDetail(taskCard));

                        // Create card content with validated data
                        taskCard.innerHTML = `
            <h3>${formData.title}</h3>
            <i class="fa-regular fa-user"></i> - ${formData.assign || 'Unassigned'}<br>
            <i class="fa-regular fa-calendar"></i> - ${formData.date || 'No date'}<br>
            <i class="fa-solid fa-user-shield"></i> - ${formData.privacy}
            ${formData.privacy === 'Private Except' ? 
                `<br><i class="fa-solid fa-eye-slash"></i> - Hidden from: ${formData.hideFrom || ''}` : ''}
        `;

        // Add the card to the appropriate column based on status
        let columnId;
        switch (formData.status.toLowerCase()) {
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

        const targetColumn = document.getElementById(columnId);
        if (targetColumn) {
            targetColumn.appendChild(taskCard);
        }

        // Clear the form BEFORE hiding the modal
        clearAddTaskForm();

        // Close the modal
        const addTaskModal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
        if (addTaskModal) {
            addTaskModal.hide();
        }

        // Update task counts
        updateTaskCounts();
    });

    // Make sure modal always clears form when opened and closed
    const addTaskModal = document.getElementById('addTaskModal');
    if (addTaskModal) {
        addTaskModal.addEventListener('show.bs.modal', function() {
            clearAddTaskForm(); // Clear form when modal opens
        });

        addTaskModal.addEventListener('hidden.bs.modal', function() {
            clearAddTaskForm(); // Clear form when modal closes
            clearErrorMessages();
        });
    }

    // Initialize task counts
    updateTaskCounts();

    // Add event listener for saving task changes when modal closes
    const taskDetailModal = document.getElementById('taskDetailModal');
    taskDetailModal.addEventListener('hide.bs.modal', function() {
        saveTaskChanges();
    });
});

// Rest of your functions remain the same...