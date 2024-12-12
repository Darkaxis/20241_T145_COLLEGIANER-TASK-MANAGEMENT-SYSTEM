document.addEventListener('DOMContentLoaded', async() => {
    const response = await fetch('https://localhost:3000/api/v1/eic/users', {
        method: 'GET',
        credentials: 'include'
    });

    const users = await response.json();
    const user = users.data;

    // Initialize counters
    let eicCount = 0;
    let ebCount = 0;
    let staffCount = 0;

    const table = document.getElementById('userTableBody');
    const totalAdmins = document.getElementById('totalAdmins');
    const totalEditorials = document.getElementById('totalEditorials');
    const totalStaff = document.getElementById('totalStaff');

    // Clear existing table content
    table.innerHTML = '';

    user.forEach(user => {
        // Update counters based on role
        switch (user.role) {
            case 'Editor in Charge':
                eicCount++;
                break;
            case 'Editorial Board':
                ebCount++;
                break;
            case 'Staff':
                staffCount++;
                break;
        }

        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${user.name}</td>
            <td id="userEmail">${user.email}</td>
            <td id="userRole">${user.role}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="openAddUserModal(true, this.parentNode.parentNode.rowIndex - 1)">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        table.appendChild(newRow);
    });

    // Update the counter displays
    totalAdmins.textContent = eicCount;
    totalEditorials.textContent = ebCount;
    totalStaff.textContent = staffCount;

    // Add window resize listener to handle zoom changes
    window.addEventListener('resize', () => {
        adjustLayoutForZoom();
    });

    // Call on page load
    adjustLayoutForZoom();
});

function openAddUserModal(isEdit = false, rowIndex = null) {
    const emailInput = document.getElementById('email');
    document.getElementById('addUserModalLabel').textContent = isEdit ? 'Edit User' : 'Add User';
    document.getElementById('editUserIndex').value = isEdit ? rowIndex : '';

    if (isEdit) {
        const row = document.getElementById('userTableBody').rows[rowIndex];
        emailInput.value = row.cells[1].textContent; // Get email from the correct column
        emailInput.readOnly = true; // Make email field readonly when editing
        emailInput.classList.add('bg-light'); // Optional: add visual indication that it's readonly
        document.getElementById('role').value = row.cells[2].textContent; // Get role from the correct column
    } else {
        document.getElementById('addUserForm').reset();
        emailInput.readOnly = false; // Make email field editable for new users
        emailInput.classList.remove('bg-light'); // Remove readonly visual indication
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

async function saveUser() {
    clearErrorMessages();

    const email = document.getElementById('email').value.trim();
    const userRole = document.getElementById('role').value;
    const editUserIndex = document.getElementById('editUserIndex').value;
    let hasErrors = false;

    // Only validate email for new users
    if (!editUserIndex) {
        if (!email) {
            showErrorMessage('email', 'Please enter email');
            hasErrors = true;
        } else if (!isValidEmail(email)) {
            showErrorMessage('email', 'Please enter valid email');
            hasErrors = true;
        }
    }

    if (!userRole) {
        showErrorMessage('role', 'Please select role');
        hasErrors = true;
    }

    if (hasErrors) {
        return;
    }

    try {
        const userData = {
            email,
            role: userRole
        };

        const url = editUserIndex ?
            `https://localhost:3000/api/v1/eic/edit` :
            'https://localhost:3000/api/v1/eic/add';
        const response = await fetch(url, {
            method: editUserIndex ? 'PATCH' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(userData)
        });

       if (response.status == 409){
        alert('User already exists');
       }
       else if (response.ok){
        alert('User added, awaiting user confirmation')
       }
        // Refresh the page to show updated data
        location.reload();

    } catch (error) {
        console.error('Error saving user:', error);
        alert('An error occurred while saving the user. Please try again.');
    }
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

    switch (newRole) {
        case 'Admin':
            newCounterId = 'totalAdmins';

            break;
        case 'Editorial Board':
            newCounterId = 'totalEditorials';

            break;
        case 'Staff':
            newCounterId = 'totalStaff';
            break;
    }

    const newCounter = document.getElementById(newCounterId);
    if (newCounter) {
        newCounter.textContent = parseInt(newCounter.textContent) + 1;
    }
}

function showUsersByRole(role) {
    const allRows = document.getElementById('userTableBody').rows;
    const filteredUsers = [];

    // Filter users by role
    for (let i = 0; i < allRows.length; i++) {
        const userRole = allRows[i].cells[2].textContent; // Updated index to match table structure
        if (userRole === role) {
            filteredUsers.push({
                name: allRows[i].cells[0].textContent,
                email: allRows[i].cells[1].textContent,
                role: userRole
            });
        }
    }

    // Clear and populate the modal content
    const modalBody = document.querySelector('#usersByRoleModal .modal-body');
    modalBody.innerHTML = `
        <div class="row g-3">
            ${filteredUsers.map(user => `
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-3">
                                <div class="avatar-circle me-3">
                                    <i class="fas fa-user"></i>
                                </div>
                                <div>
                                    <h6 class="card-title mb-0">${user.name}</h6>
                                    <small class="text-muted">${user.role}</small>
                                </div>
                            </div>
                            <div class="user-details">
                                <p class="mb-1">
                                    <i class="fas fa-envelope text-muted me-2"></i>
                                    ${user.email}
                                </p>
                               
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Update modal title
    document.getElementById('usersByRoleTitle').textContent = `${role} (${filteredUsers.length})`;

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('usersByRoleModal'));
    modal.show();
}

function adjustLayoutForZoom() {
    const zoomLevel = Math.round(window.devicePixelRatio * 100) / 100;
    const dashboard = document.querySelector('.dashboard');
    
    if (zoomLevel < 0.75) {
        dashboard.classList.add('zoomed-out');
    } else if (zoomLevel < 0.5) {
        dashboard.classList.add('zoomed-out-more');
    } else {
        dashboard.classList.remove('zoomed-out', 'zoomed-out-more');
    }
}