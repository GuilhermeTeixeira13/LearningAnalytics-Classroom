function startStudentServer() {
    // Make an AJAX request to start the server
    fetch('/start-new-server')
        .then(response => {
            // If the request is successful, set a cookie with a value of "running"
            document.cookie = "serverState=running";
            // Update the button styles
            const startBtn = document.getElementById("start-server");
            startBtn.style.display = "none";
            const closeBtn = document.getElementById("close-server");
            closeBtn.style.display = "block";
        })
        .catch(error => {
            console.error('Error starting server:', error);
        });
}

function closeStudentServer() {
    // Make an AJAX request to stop the server
    fetch('/stop-server')
        .then(response => {
            // If the request is successful, set a cookie with a value of "stopped"
            document.cookie = "serverState=stopped";
            // Update the button styles
            const startBtn = document.getElementById("start-server");
            startBtn.style.display = "block";
            const closeBtn = document.getElementById("close-server");
            closeBtn.style.display = "none";
        })
        .catch(error => {
            console.error('Error stopping server:', error);
        });
}

// Check the value of the "serverState" cookie when the page loads
window.addEventListener('load', () => {
    const serverState = getCookie('serverState');
    const startBtn = document.getElementById("start-server");
    const closeBtn = document.getElementById("close-server");
    if (serverState === 'running') {
        startBtn.style.display = "none";
        closeBtn.style.display = "flex";
    }
    else {
        startBtn.style.display = "block";
        closeBtn.style.display = "none";
    }
});

// Helper function to get the value of a cookie by name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
}
