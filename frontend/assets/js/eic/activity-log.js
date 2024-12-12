async function fetchLogs() {
    try {
        const response = await fetch('https://localhost:3000/api/v1/eic/logs', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch logs');
        }
        
        const logs = await response.json();
        const container = document.querySelector('.activity-log-container');
        
        // Clear existing logs
        container.innerHTML = '';
        
        // Map action types to icons
        const actionIcons = {
            'create': 'fa-plus',
            'update': 'fas fa-list-check',
            'delete': 'fas fa-trash',
        };
       
        logs.data.forEach(log => {
            
                        const formatDate = (timestamp) => {
              try {
                // Convert Firestore timestamp to Date
                const milliseconds = (timestamp._seconds * 1000) + (timestamp._nanoseconds / 1000000);
                const date = new Date(milliseconds);
                
                return date.toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  
                });
              } catch (err) {
                console.error('Date parsing error:', err);
                return 'Invalid date';
              }
            };
            
            const date = formatDate(log.timestamp);
         
            
            
        
            if (log.type == 'update') {
                log.type = 'edit';
            }
            const activityHTML = `
                <div class="activity-item">
                    <div class="activity-icon ${log.type}">
                        <i class="fas ${actionIcons[log.type] || 'fa-info'}"></i>
                    </div>
                    <div class="activity-details">
                        <span class="activity-text">${log.action}</span>
                    </div>
                    <div class="activity-user">
                        <div class="user-info">
                            <span class="user-name">${log.user}</span>
                            <span class="user-label">USER</span>
                        </div>
                    </div>
                    <div class="activity-timestamp">
                        <div class="timestamp-info">
                            <span>${date}</span>
                            <span class="timestamp-label">TIMESTAMP</span>
                        </div>
                    </div>
                </div>
            `;
            
            container.insertAdjacentHTML('beforeend', activityHTML);
        });
    } catch (error) {
        console.error('Error fetching logs:', error);
    }
}

// Call function on load
fetchLogs();

// Refresh every 30 seconds
setInterval(fetchLogs, 30000);