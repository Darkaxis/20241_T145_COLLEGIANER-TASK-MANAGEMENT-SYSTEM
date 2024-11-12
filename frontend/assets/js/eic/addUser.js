

function openAddUserModal(isEdit = false, rowIndex = null) {
    document.getElementById('addUserModalLabel').textContent = isEdit ? 'Edit User' : 'Add User';
    document.getElementById('editUserIndex').value = isEdit ? rowIndex : '';

    if (isEdit) {
        const row = document.getElementById('userTableBody').rows[rowIndex];
        document.getElementById('email').value = row.cells[3].textContent;
        document.getElementById('role').value = row.cells[4].textContent;
    } else {
        document.getElementById('addUserForm').reset();
    }

    const addUserModal = new bootstrap.Modal(document.getElementById('addUserModal'));
    addUserModal.show();
}

function showErrorMessage(fieldId, message) {
    const field = document.getElementById(fieldId);

    // Remove any existing error message
    const existingError = field.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // Add error class to the input
    field.classList.add('is-invalid');

    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;

    // Add the error message after the input
    field.parentElement.appendChild(errorDiv);
}

function clearErrorMessages() {
    // Remove error messages
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(error => error.remove());

    // Remove invalid class from inputs
    const invalidInputs = document.querySelectorAll('.is-invalid');
    invalidInputs.forEach(input => input.classList.remove('is-invalid'));
}

function saveUser() {
    // Clear previous error messages
    clearErrorMessages();

    // Get form values
    const email = document.getElementById('email').value.trim();
    const userRole = document.getElementById('role').value;
    let role;
    if (userRole === 'Editorial Board'){

        role = 'eb';
    }
    const editUserIndex = document.getElementById('editUserIndex').value;
    
    // Validate inputs
    let hasErrors = false;

    if (!email) {
        showErrorMessage('email', 'Please enter email');
        hasErrors = true;
    } else if (!isValidEmail(email)) {
        showErrorMessage('email', 'Please enter valid email');
        hasErrors = true;
    }

    if (!role) {
        showErrorMessage('role', 'Please select role');
        hasErrors = true;
    }
    //send to backend
    const userData = { email, role };
    console.log(userData)
    fetch('https://localhost:3000/api/v1/eic/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .catch(error => {
        console.error('Error adding user:', error);
        alert('An error occurred while adding the user. Please try again.');
    });




    if (hasErrors) {
        return;
    }

    if (editUserIndex) {
        // Update existing user
        const row = document.getElementById('userTableBody').rows[editUserIndex];
        const oldRole = row.cells[4].textContent;

        // Update the row
        row.cells[3].textContent = email;
        row.cells[4].textContent = role;

        // Update counters
        updateCounters(oldRole, role);
    }

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
    modal.hide();

    // Clear form
    document.getElementById('addUserForm').reset();
}

// Helper function to validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Helper function to update counters
function updateCounters(oldRole, newRole) {
    if (oldRole) {
        // Decrease old role counter
        let oldCounterId;
        switch (oldRole) {
            case 'eic':
                oldCounterId = 'totalAdmins';
                break;
            case 'eb':
                oldCounterId = 'totalEditorials';
                break;
            case 'staff':
                oldCounterId = 'totalStaff';
                break;
        }

        const oldCounter = document.getElementById(oldCounterId);
        if (oldCounter) {
            oldCounter.textContent = Math.max(0, parseInt(oldCounter.textContent) - 1);
        }
    }

    // Increase new role counter
    let newCounterId;
    let role;
    switch (newRole) {
        case 'Admin':
            newCounterId = 'totalAdmins';
            role = 'eic';
            break;
        case 'Editorial Board':
            newCounterId = 'totalEditorials';
            role = 'eb';
            break;
        case 'Staff':
            role = 'staff';
            newCounterId = 'totalStaff';
            break;
    }

    const newCounter = document.getElementById(newCounterId);
    if (newCounter) {
        newCounter.textContent = parseInt(newCounter.textContent) + 1;
    }
}




document.addEventListener('DOMContentLoaded', async () => {    
    const userTableBody = document.getElementById('userTableBody');
        const token = localStorage.getItem('token');
        const response = await fetch('https://localhost:3000/api/v1/eic/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const users = await response.json();
        users.data.forEach(user => {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="openAddUserModal(true, this.parentNode.parentNode.rowIndex - 1)">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;
            userTableBody.appendChild(newRow);
        });
        //updateCounters(oldRole, role);
    
    
    
    
    });
