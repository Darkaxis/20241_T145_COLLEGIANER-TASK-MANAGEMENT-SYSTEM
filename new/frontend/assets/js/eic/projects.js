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

    // Set minimum date for date inputs
    const today = new Date().toISOString().split('T')[0];
    const startDateInput = document.getElementById('projectStart');
    const endDateInput = document.getElementById('projectEnd');

    if (startDateInput && endDateInput) {
        startDateInput.setAttribute('min', today);
        endDateInput.setAttribute('min', today);

        // Add event listener to start date to update end date minimum
        startDateInput.addEventListener('change', function() {
            endDateInput.setAttribute('min', this.value);
            if (endDateInput.value && endDateInput.value < this.value) {
                endDateInput.value = this.value;
            }
        });
    }

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

    if (!projectName || !projectStart || !projectEnd) {
        alert('Please fill in all fields');
        return;
    }

    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(projectStart);
    const endDate = new Date(projectEnd);

    if (startDate < today) {
        alert('Start date cannot be in the past');
        return;
    }

    if (endDate <= startDate) {
        alert('End date must be after start date');
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
    if (confirm('Are you sure you want to delete this project?')) {
        // Remove from UI
        const projectElement = document.querySelector(`[data-project-id="${projectId}"]`);
        if (projectElement) {
            projectElement.remove();
        }

        // Remove from storage
        deleteProject(projectId);
    }
}

function handleEditProject(projectId) {
    const project = getProjectById(projectId);
    if (!project) return;

    // Set minimum dates for edit form
    const today = new Date().toISOString().split('T')[0];
    const startDateInput = document.getElementById('projectStart');
    const endDateInput = document.getElementById('projectEnd');

    startDateInput.setAttribute('min', today);
    endDateInput.setAttribute('min', today);

    // Populate form with project data
    document.getElementById('projectName').value = project.name;
    startDateInput.value = project.startDate;
    endDateInput.value = project.endDate;

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addProjectModal'));
    modal.show();

    // Update save button
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

        // Validation
        if (!name || !start || !end) {
            alert('Please fill in all fields');
            return;
        }

        // Validate dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (startDate < today) {
            alert('Start date cannot be in the past');
            return;
        }

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
}

// Add this new function to reset the modal form
function resetModalForm() {
    const form = document.getElementById('addProjectForm');
    form.reset();

    const saveBtn = document.getElementById('saveProjectBtn');
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

    newSaveBtn.textContent = 'Create Project';
    newSaveBtn.addEventListener('click', handleAddProject);
}