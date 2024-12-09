document.addEventListener('DOMContentLoaded', function() {
    // Clear any existing projects when the page loads
    sessionStorage.clear();

    // Initialize project functionality
    initializeProjects();
});

function initializeProjects() {
    // Add event listeners
    const addProjectForm = document.getElementById('addProjectForm');
    const saveProjectBtn = document.getElementById('saveProjectBtn');
    const searchInput = document.querySelector('.search-box input');

    // Initialize search functionality
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Initialize add project functionality
    if (saveProjectBtn) {
        saveProjectBtn.addEventListener('click', handleAddProject);
    }

    // Load existing projects
    loadProjects();

    // Initialize delete and edit handlers
    initializeProjectActions();

    // Add modal close event handler
    const addProjectModal = document.getElementById('addProjectModal');
    if (addProjectModal) {
        addProjectModal.addEventListener('hidden.bs.modal', resetModalForm);
    }
}

function handleAddProject() {
    const projectName = document.getElementById('projectName').value;
    const projectStart = document.getElementById('projectStart').value;
    const projectEnd = document.getElementById('projectEnd').value;
    let hasErrors = false;

    // Clear previous errors
    clearAllErrors();

    // Validate project name
    if (!projectName) {
        showInputError('projectName', 'Please input project name');
        hasErrors = true;
    }

    // Validate start date
    if (!projectStart) {
        showInputError('projectStart', 'Please input start date');
        hasErrors = true;
    }

    // Validate end date
    if (!projectEnd) {
        showInputError('projectEnd', 'Please input end date');
        hasErrors = true;
    }

    if (hasErrors) {
        return;
    }

    // Date validation
    const startDate = new Date(projectStart);
    const endDate = new Date(projectEnd);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if start date is in the past
    if (startDate < today) {
        showDateError('projectStart', 'Project start date cannot be in the past');
        return;
    }

    // Check if end date is before start date
    if (endDate <= startDate) {
        showDateError('projectEnd', 'End date must be after start date');
        return;
    }

    const projectData = {
        id: Date.now(),
        name: projectName,
        startDate: projectStart,
        endDate: projectEnd,
        progress: 0
    };

    // Add project to storage
    saveProject(projectData);

    // Add project to UI
    addProjectToUI(projectData);

    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('addProjectModal'));
    modal.hide();
    document.getElementById('addProjectForm').reset();
}

function addProjectToUI(project) {
    const projectsContainer = document.querySelector('.row.g-4');
    const projectElement = createProjectElement(project);
    projectsContainer.insertBefore(projectElement, projectsContainer.firstChild);
}

function createProjectElement(project) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    col.dataset.projectId = project.id;

    const startDate = new Date(project.startDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    const endDate = new Date(project.endDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    col.innerHTML = `
        <div class="project-card">
            <div class="project-card-header">
                <i class="fas fa-folder-open project-icon"></i>
                <div class="project-options">
                    <button class="btn btn-link edit-project" title="Edit" data-project-id="${project.id}">
                        <i class="fas fa-edit text-primary"></i>
                    </button>
                    <button class="btn btn-link delete-project" title="Delete" data-project-id="${project.id}">
                        <i class="fas fa-trash text-danger"></i>
                    </button>
                </div>
            </div>
            <div class="project-card-body">
                <h5 class="project-title">${project.name}</h5>
                <div class="project-dates">
                    <div class="date-item">
                        <i class="fas fa-calendar-alt text-primary"></i>
                        <span>Start: ${startDate}</span>
                    </div>
                    <div class="date-item">
                        <i class="fas fa-calendar-check text-success"></i>
                        <span>End: ${endDate}</span>
                    </div>
                </div>
                <div class="project-progress">
                    <div class="progress">
                        <div class="progress-bar" role="progressbar" style="width: ${project.progress}%"></div>
                    </div>
                  
                </div>
            </div>
        </div>
    `;

    return col;
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const projects = document.querySelectorAll('.col-md-6.col-lg-4');

    projects.forEach(project => {
        const title = project.querySelector('.project-title').textContent.toLowerCase();
        if (title.includes(searchTerm)) {
            project.style.display = '';
        } else {
            project.style.display = 'none';
        }
    });
}

function initializeProjectActions() {
    document.addEventListener('click', function(e) {
        // Handle delete
        if (e.target.closest('.delete-project')) {
            const projectId = e.target.closest('.delete-project').dataset.projectId;
            handleDeleteProject(projectId);
        }

        // Handle edit
        if (e.target.closest('.edit-project')) {
            const projectId = e.target.closest('.edit-project').dataset.projectId;
            handleEditProject(projectId);
        }
    });
}

function handleDeleteProject(projectId) {
    // Create and show the custom modal
    const modal = document.createElement('div');
    modal.className = 'delete-confirmation-modal';
    modal.innerHTML = `
        <div class="delete-modal-content">
            <div class="delete-modal-icon">
                <i class="fas fa-trash-alt"></i>
            </div>
            <h3>Delete Project</h3>
            <p>Are you sure you want to delete this project? This action cannot be undone.</p>
            <div class="delete-modal-buttons">
                <button class="delete-cancel-btn">Cancel</button>
                <button class="delete-confirm-btn">Delete</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Handle cancel button
    modal.querySelector('.delete-cancel-btn').onclick = () => {
        modal.remove();
    };

    // Handle delete button
    modal.querySelector('.delete-confirm-btn').onclick = () => {
        // Remove from UI with fade out animation
        const projectElement = document.querySelector(`[data-project-id="${projectId}"]`);
        if (projectElement) {
            projectElement.classList.add('fade-out');
            setTimeout(() => {
                projectElement.remove();
                // Remove from storage
                deleteProject(projectId);
                // Show success notification
                showDeleteNotification('Project deleted successfully');
            }, 300);
        }
        modal.remove();
    };
}

function handleEditProject(projectId) {
    const project = getProjectById(projectId);
    if (!project) return;

    // Update modal title for edit mode
    const modalTitle = document.querySelector('#addProjectModal .modal-title');
    modalTitle.textContent = 'Edit Project';

    // Populate form with project data
    document.getElementById('projectName').value = project.name;
    document.getElementById('projectStart').value = project.startDate;
    document.getElementById('projectEnd').value = project.endDate;

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addProjectModal'));
    modal.show();

    // Update save button text
    const saveBtn = document.getElementById('saveProjectBtn');
    saveBtn.textContent = 'Update Project';

    // Clear existing event listeners
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

    // Add new update handler
    newSaveBtn.addEventListener('click', function updateProject(e) {
        e.preventDefault();

        const name = document.getElementById('projectName').value;
        const start = document.getElementById('projectStart').value;
        const end = document.getElementById('projectEnd').value;

        // Validation for required fields
        if (!name || !start || !end) {
            alert('Please fill in all fields');
            return;
        }

        // Date validation
        const startDate = new Date(start);
        const endDate = new Date(end);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if start date is in the past
        if (startDate < today) {
            alert('Project start date cannot be in the past');
            return;
        }

        // Check if end date is before start date
        if (endDate <= startDate) {
            alert('End date must be after start date');
            return;
        }

        // Update project in storage
        const projects = getProjects();
        const index = projects.findIndex(p => p.id == projectId);

        if (index !== -1) {
            projects[index] = {
                ...projects[index],
                name: name,
                startDate: start,
                endDate: end
            };

            sessionStorage.setItem('projects', JSON.stringify(projects));

            // Update UI
            const projectElement = document.querySelector(`[data-project-id="${projectId}"]`);
            if (projectElement) {
                const formattedStart = new Date(start).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                });

                const formattedEnd = new Date(end).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                });

                projectElement.querySelector('.project-title').textContent = name;
                projectElement.querySelector('.date-item:first-child span').textContent = `Start: ${formattedStart}`;
                projectElement.querySelector('.date-item:last-child span').textContent = `End: ${formattedEnd}`;
            }

            // Close modal and reset
            modal.hide();
            resetModalForm();

            // Show success notification
            showUpdateNotification('Project updated successfully');
        }
    });
}

// Storage functions
function saveProject(project) {
    let projects = getProjects();
    projects.push(project);
    sessionStorage.setItem('projects', JSON.stringify(projects));
}

function getProjects() {
    const projects = sessionStorage.getItem('projects');
    return projects ? JSON.parse(projects) : [];
}

function deleteProject(projectId) {
    let projects = getProjects();
    projects = projects.filter(p => p.id != projectId);
    sessionStorage.setItem('projects', JSON.stringify(projects));
}

function getProjectById(projectId) {
    const projects = getProjects();
    return projects.find(p => p.id == projectId);
}

function loadProjects() {
    const projects = getProjects();
    const projectsContainer = document.querySelector('.row.g-4');

    // Clear existing template
    projectsContainer.innerHTML = '';

    // Add all projects
    projects.forEach(project => {
        addProjectToUI(project);
    });

    // Adjust layout for current zoom level
    adjustLayoutForZoom();
}

// Add this new function to reset the modal form
function resetModalForm() {
    const form = document.getElementById('addProjectForm');
    form.reset();
    clearAllErrors();

    // Reset modal title back to Add New Project
    const modalTitle = document.querySelector('#addProjectModal .modal-title');
    modalTitle.textContent = 'Add New Project';

    const saveBtn = document.getElementById('saveProjectBtn');
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

    newSaveBtn.textContent = 'Create Project';
    newSaveBtn.addEventListener('click', handleAddProject);
}

// Set minimum date to today for both date inputs
const today = new Date().toISOString().split('T')[0];
document.getElementById('projectStart').min = today;
document.getElementById('projectEnd').min = today;

// Renamed notification function
function showDeleteNotification(message) {
    const toast = document.createElement('div');
    toast.className = 'delete-toast';
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span class="delete-toast-message">${message}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add new notification function for updates
function showUpdateNotification(message) {
    const toast = document.createElement('div');
    toast.className = 'update-toast';
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span class="update-toast-message">${message}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showDateError(inputId, message) {
    const field = document.getElementById(inputId);
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
    const parentContainer = field.closest('.input-group');

    // Remove any existing error messages
    const existingError = parentContainer.parentElement.querySelector('.error-message-container');
    if (existingError) {
        existingError.remove();
    }

    // Add error message after the parent container
    parentContainer.parentElement.appendChild(errorDiv);

    // Add invalid class and error styling
    field.classList.add('is-invalid');
    parentContainer.classList.add('has-error');

    // Add shake animation
    field.classList.add('shake-error');
    setTimeout(() => field.classList.remove('shake-error'), 500);
}

function clearDateErrors() {
    const dateInputs = ['projectStart', 'projectEnd'];
    dateInputs.forEach(id => {
        const input = document.getElementById(id);
        const inputGroup = input.closest('.input-group');
        const errorDiv = input.parentElement.nextElementSibling;

        inputGroup.classList.remove('has-error');
        errorDiv.textContent = '';
        errorDiv.classList.remove('show');
    });
}

function showInputError(inputId, message) {
    const field = document.getElementById(inputId);
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
    const parentContainer = field.closest('.input-group');

    // Remove any existing error messages
    const existingError = parentContainer.parentElement.querySelector('.error-message-container');
    if (existingError) {
        existingError.remove();
    }

    // Add error message after the parent container
    parentContainer.parentElement.appendChild(errorDiv);

    // Add invalid class and error styling
    field.classList.add('is-invalid');
    parentContainer.classList.add('has-error');

    // Add shake animation
    field.classList.add('shake-error');
    setTimeout(() => field.classList.remove('shake-error'), 500);
}

function clearAllErrors() {
    document.querySelectorAll('.error-message-container').forEach(error => error.remove());
    document.querySelectorAll('.is-invalid').forEach(input => {
        input.classList.remove('is-invalid');
        input.classList.remove('shake-error');
    });
    document.querySelectorAll('.has-error').forEach(group => {
        group.classList.remove('has-error');
    });
}

// Add resize event listener to handle zoom changes
window.addEventListener('resize', function() {
    adjustLayoutForZoom();
});

function adjustLayoutForZoom() {
    const container = document.querySelector('.projects-container');
    const cards = document.querySelectorAll('.project-card');

    // Get the current zoom level
    const zoomLevel = Math.round(window.devicePixelRatio * 100);

    // Adjust container padding based on zoom
    container.style.padding = `${20 * (100 / zoomLevel)}px`;

    // Adjust card sizes if needed
    cards.forEach(card => {
        if (zoomLevel > 125) {
            card.style.fontSize = '0.9em';
        } else if (zoomLevel < 75) {
            card.style.fontSize = '1.1em';
        } else {
            card.style.fontSize = '1em';
        }
    });
}