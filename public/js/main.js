// API21 Static Demo JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const responseDiv = document.getElementById('response');
    const healthBtn = document.getElementById('test-health');
    const usersBtn = document.getElementById('test-users');

    // Helper function to display API response
    function displayResponse(data, isError = false) {
        responseDiv.className = isError ? 'response error' : 'response';
        responseDiv.textContent = JSON.stringify(data, null, 2);
    }

    // Helper function to make API calls
    async function makeApiCall(endpoint) {
        try {
            displayResponse('Loading...', false);
            
            const response = await fetch(endpoint);
            const data = await response.json();
            
            if (!response.ok) {
                displayResponse(data, true);
                return;
            }
            
            displayResponse(data, false);
        } catch (error) {
            displayResponse({
                error: 'Network error',
                message: error.message,
                endpoint: endpoint
            }, true);
        }
    }

    // Health check endpoint test
    healthBtn.addEventListener('click', function() {
        makeApiCall('/api/health');
    });

    // Users endpoint test
    usersBtn.addEventListener('click', function() {
        makeApiCall('/api/users');
    });

    // Display welcome message on load
    displayResponse({
        message: 'Click the buttons above to test API endpoints',
        info: 'This page is served as a static file from the public/ directory'
    }, false);

    console.log('API21 Static Demo initialized');
    console.log('Available endpoints:', [
        '/api/health',
        '/api/users',
        '/api/users/:id'
    ]);
});