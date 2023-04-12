// Check the server state when the page loads
window.addEventListener('load', checkServerState);

function startStudentServer() {
    // Make an AJAX request to start the server
    fetch('/start-new-server')
        .then(response => {
            // Update the server state
            updateServerState('running');

            // Update the button styles
            const startBtn = document.getElementById('start-server');
            startBtn.style.display = 'none';
            const closeBtn = document.getElementById('close-server');
            closeBtn.style.display = 'block';
        })
        .catch(error => {
            console.error('Error starting server:', error);
        });
}

function stopStudentServer() {
    // Make an AJAX request to stop the server
    fetch('/stop-server')
        .then(response => {
            // Update the server state
            updateServerState('stopped');

            // Update the button styles
            const startBtn = document.getElementById('start-server');
            startBtn.style.display = 'block';
            const closeBtn = document.getElementById('close-server');
            closeBtn.style.display = 'none';
        })
        .catch(error => {
            console.error('Error stopping server:', error);
        });
}

function checkServerState() {
    fetch('/server-state')
        .then(response => response.text())
        .then(state => {
            if (state === 'running') {
                const startBtn = document.getElementById('start-server');
                startBtn.style.display = 'none';
                const closeBtn = document.getElementById('close-server');
                closeBtn.style.display = 'block';
            }
        });
}

function updateServerState(state) {
    fetch('/update-server-state', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state }),
    });
}

