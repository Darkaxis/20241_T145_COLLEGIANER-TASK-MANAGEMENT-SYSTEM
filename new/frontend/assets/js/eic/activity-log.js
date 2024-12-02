class ActivityLogger {
    constructor() {
        this.activities = [];
    }

    logActivity(type, taskTitle, changes, username) {
        const activity = {
            type: type,
            taskTitle: taskTitle,
            changes: changes,
            username: username,
            timestamp: new Date(),
            id: Date.now()
        };

        this.activities.unshift(activity);
        this.renderActivity(activity);
    }

    renderActivity(activity) {
        const container = document.querySelector('.activity-log-container');
        const activityHTML = this.createActivityHTML(activity);

        // Insert at the beginning of the container
        container.insertAdjacentHTML('afterbegin', activityHTML);
    }

    createActivityHTML(activity) {
        const timeAgo = this.getTimeAgo(activity.timestamp);
        const iconClass = this.getIconClass(activity.type);
        const iconName = this.getIconName(activity.type);

        return `
            <div class="activity-item" data-id="${activity.id}">
                <div class="activity-icon ${iconClass}">
                    <i class="fas ${iconName}"></i>
                </div>
                <div class="activity-details">
                    <span class="activity-text">${this.getActivityText(activity)}</span>
                    <span class="activity-changes">${activity.changes}</span>
                </div>
                <div class="activity-user">
                    <span class="user-name">${activity.username}</span>
                    <span class="user-label">USER</span>
                </div>
                <div class="activity-timestamp">
                    <span>${timeAgo}</span>
                    <span class="timestamp-label">TIMESTAMP</span>
                </div>
                <div class="activity-view">
                    <i class="fas fa-eye"></i>
                </div>
            </div>
        `;
    }

    getIconClass(type) {
        const icons = {
            'create': 'create',
            'edit': 'edit',
            'assign': 'assign',
            'delete': 'delete'
        };
        return icons[type] || 'edit';
    }

    getIconName(type) {
        const icons = {
            'create': 'fa-clipboard-plus', // New task
            'edit': 'fa-tasks', // Task modification
            'assign': 'fa-user-check', // Task assignment
            'complete': 'fa-clipboard-check', // Task completion
            'delete': 'fa-trash-alt' // Task deletion
        };
        return icons[type] || 'fa-tasks';
    }

    getActivityText(activity) {
        const actions = {
            'create': '📋 Created task:',
            'edit': '✏️ Modified task:',
            'assign': '👤 Assigned task:',
            'delete': '🗑️ Deleted task:'
        };
        const action = actions[activity.type] || 'Modified task:';
        return `${action} <strong>"${activity.taskTitle}"</strong>`;
    }

    getTimeAgo(timestamp) {
        const seconds = Math.floor((new Date() - timestamp) / 1000);

        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
            }
        }

        return 'Just now';
    }
}

// Initialize the activity logger
const activityLogger = new ActivityLogger();

// Example usage:
// activityLogger.logActivity('create', 'New Task Title', 'Created in Project A', 'rmok61be');
// activityLogger.logActivity('edit', 'Existing Task', 'Changed status to Done', 'rmok61be');