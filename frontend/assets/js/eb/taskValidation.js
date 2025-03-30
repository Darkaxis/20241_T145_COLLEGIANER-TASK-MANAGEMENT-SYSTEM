// Validation related functions
function validateFormData(formData) {
    let hasErrors = false;

    // Required fields validation
    const requiredFields = {
        'taskTitleInput': 'taskName',
        'taskDescriptionInput': 'description',
        'taskStatusInput': 'status',
        'taskPrivacyInput': 'privacy',
        'taskAssignInput': 'assignedTo',
        'taskDateInput': 'deadline',
        'taskCategoryInput': 'category',
        'taskLinkInput': 'link'
    };

    // Validate date (new validation)
    const dateInput = document.getElementById('taskDateInput');
    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for proper comparison

    if (selectedDate < today) {
        showErrorMessage('taskDateInput', 'Deadline cannot be set in the past');
        hasErrors = true;
    }

    // Comment out Private Except validation
    /*
    if (formData.privacy === 'Private Except' && !formData.hideFrom) {
        showErrorMessage('hideUserInput', 'Please enter hide from');
        hasErrors = true;
    }
    */

    for (const [elementId, fieldName] of Object.entries(requiredFields)) {
        if (!formData[fieldName]) {
            showErrorMessage(elementId, `Please enter ${fieldName}`);
            hasErrors = true;
        }
    }

    return !hasErrors;
}

function showErrorMessage(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message-container';

    // Create icon element
    const icon = document.createElement('i');
    icon.className = 'fas fa-exclamation-circle error-icon';

    // Create message element
    const messageSpan = document.createElement('span');
    messageSpan.className = 'error-text';
    messageSpan.textContent = message;

    // Combine icon and message
    errorDiv.appendChild(icon);
    errorDiv.appendChild(messageSpan);

    // Find the parent container
    const parentContainer = field.closest('.d-flex');

    // Remove any existing error messages
    //const existingError = parentContainer.parentElement.querySelector('.error-message-container');
    if (existingError) {
        existingError.remove();
    }

    // Add error message after the parent container
    parentContainer.parentElement.appendChild(errorDiv);

    // Add invalid class to the input/select element
    field.classList.add('is-invalid');

    // Add shake animation to the input field
    field.classList.add('shake-error');
    setTimeout(() => field.classList.remove('shake-error'), 500);
}

function clearErrorMessages() {
    document.querySelectorAll('.error-message-container').forEach(error => error.remove());
    document.querySelectorAll('.is-invalid').forEach(input => {
        input.classList.remove('is-invalid');
        input.classList.remove('shake-error');
    });
}