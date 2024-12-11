document.addEventListener('DOMContentLoaded',  async function() {
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
        console.log(logs.data)
            
            // Clear existing logs
            const container = document.querySelector('.activity-log-container');
           container.innerHTML = 
            
    }
    catch  {
        console.error('Error fetching logs:', error);
    }
});

