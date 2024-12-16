function openAddUserModal(isEdit = false, rowIndex = null) {
    const emailInput = document.getElementById('email');
    document.getElementById('addUserModalLabel').textContent = isEdit ? 'Edit User' : 'Add User';
    document.getElementById('editUserIndex').value = isEdit ? rowIndex : '';

    if (isEdit) {
        const row = document.getElementById('userTableBody').rows[rowIndex];
        emailInput.value = row.cells[1].textContent; // Get email from the table
        emailInput.readOnly = true; // Make email readonly for editing
        emailInput.classList.add('bg-light');
        document.getElementById('role').value = row.cells[2].textContent;
    } else {
        document.getElementById('addUserForm').reset();
        emailInput.readOnly = false;
        emailInput.classList.remove('bg-light');
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
    const role = document.getElementById('role').value;
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
    } else {
        // Add new user
        const userTableBody = document.getElementById('userTableBody');
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>${email}</td>
            <td>${role}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="openAddUserModal(true, this.parentNode.parentNode.rowIndex - 1)">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        userTableBody.appendChild(newRow);

        // Update counter for new role
        updateCounters(null, role);
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
            case 'Admin':
                oldCounterId = 'totalAdmins';
                break;
            case 'Editorial Board':
                oldCounterId = 'totalEditorials';
                break;
            case 'Staff':
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

// Add this function to show users by role
function showUsersByRole(role) {
    // Get all rows from the main table
    const allRows = document.getElementById('userTableBody').rows;
    const filteredUsers = [];

    // Filter users by role
    for (let i = 0; i < allRows.length; i++) {
        const userRole = allRows[i].cells[4].textContent;
        if (userRole === role) {
            filteredUsers.push({
                lastname: allRows[i].cells[0].textContent,
                firstname: allRows[i].cells[1].textContent,
                middlename: allRows[i].cells[2].textContent,
                email: allRows[i].cells[3].textContent,
                role: userRole
            });
        }
    }

    // Update modal title
    document.getElementById('usersByRoleTitle').textContent = `${role} Users (${filteredUsers.length})`;

    // Clear and populate the modal table
    const modalTableBody = document.getElementById('usersByRoleTableBody');
    modalTableBody.innerHTML = '';

    filteredUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.lastname}</td>
            <td>${user.firstname}</td>
            <td>${user.middlename}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
        `;
        modalTableBody.appendChild(row);
    });

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('usersByRoleModal'));
    modal.show();
}



document.addEventListener('DOMContentLoaded', async() => {
    const token = localStorage.getItem('token');

    if (!token) {
        alert('You are not logged in!');
        window.location.href = '/';
        return;
    }


    const response = await fetch('http://localhost:3000/eic/profile', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const result = await response.json();

    if (response.ok) {
        const profileName = document.getElementById('profileName');
        const profileImage = document.getElementById('profileImage');
        const dropdownProfileImage = document.getElementById('dropdownProfileImage');

        profileName.textContent = result.name;
        profileImage.src = result.profileImage || '/assets/images/customer02.jpg'; // Change Later
        dropdownProfileImage.src = result.profileImage || '/assets/images/customer02.jpg';

        const userProfile = document.getElementById('userProfile');
        userProfile.innerHTML = `
                <p>Name: ${result.name}</p>
                <p>Email: ${result.email}</p>
            `;
    } else {
        alert(`Failed to load user profile: ${result.message}`);
    }

    // Logout functionality
    const logoutButton = document.getElementById('logoutButton');
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    });


});