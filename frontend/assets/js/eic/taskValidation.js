// Validation related functions
function validateFormData(formData) {
    let hasErrors = false;

    // Required fields validation
    const requiredFields = {
        'taskTitleInput': 'title',
        'taskDescriptionInput': 'description',
        'taskStatusInput': 'status',
        'taskPrivacyInput': 'privacy',
        'taskAssignInput': 'assignTo',
        'taskDateInput': 'date',
        'taskLinkInput': 'link'
    };

    for (const [elementId, fieldName] of Object.entries(requiredFields)) {
        if (!formData[fieldName]) {
            showErrorMessage(elementId, `Please enter ${fieldName}`);
            hasErrors = true;
        }
    }

    if (formData.privacy === 'Private Except' && !formData.hideFrom) {
        showErrorMessage('hideUserInput', 'Please enter hide from');
        hasErrors = true;
    }

    return !hasErrors;
}

function showErrorMessage(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = 'red';
    errorDiv.style.fontSize = '12px';
    errorDiv.style.marginTop = '5px';
    errorDiv.textContent = message;

    const existingError = field.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    field.parentElement.appendChild(errorDiv);
    field.classList.add('is-invalid');
}

function clearErrorMessages() {
    document.querySelectorAll('.error-message').forEach(error => error.remove());
    document.querySelectorAll('.is-invalid').forEach(input => input.classList.remove('is-invalid'));
}