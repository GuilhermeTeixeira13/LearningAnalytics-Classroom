// Set up event listener for when window loads
window.addEventListener('load', checkServerState);

// Function to toggle server state
function toggleServer(state) {
  // Select necessary DOM elements
  const errorDiv = document.querySelector('#error-msg');
  const startBtn = document.getElementById('start-server');
  const closeBtn = document.getElementById('close-server');
  const classLabel = document.getElementById('class-label');
  const className = document.getElementById('class-name');

  // Update server state on server
  updateServerState(state);

  // Update visibility and read-only attributes of necessary elements
  startBtn.style.display = (state === 'running') ? 'none' : 'block';
  closeBtn.style.display = (state === 'running') ? 'block' : 'none';
  errorDiv.style.display = (state === 'running') ? 'none' : 'block';
  className.readOnly = (state === 'running') ? true : false;

  // Check server class name and update className input value and classLabel text
  checkServerClassName().then(serverClassName => {
    className.value = serverClassName;
  });
  classLabel.innerHTML = (state === 'running') ? 'Class currently running:' : 'Enter class name:';
}

// Function to start the student server
function startStudentServer() {
  const errorDiv = document.querySelector('#error-msg');

  // If the class name input is empty, display an error message
  if (emptyClassName()) {
    errorDiv.innerHTML = "The class name can't be empty!";
  } else {
    // Otherwise, update the server class name and start the server
    errorDiv.innerHTML = "";
    updateServerClassName(document.getElementById('class-name').value);
    fetch('/start-new-server')
      .then(response => toggleServer('running'))
      .catch(error => console.error('Error starting server:', error));
  }
}

// Function to stop the student server
function stopStudentServer() {
  // Make an AJAX request to stop the server
  updateServerClassName("");
  fetch('/stop-server')
    .then(response => toggleServer('stopped'))
    .catch(error => console.error('Error stopping server:', error));
}

// Function to check the current server state
function checkServerState() {
  fetch('/server-state')
    .then(response => response.text())
    .then(state => toggleServer(state));
}

// Function to check the current server class name
function checkServerClassName() {
  return fetch('/server-class')
    .then(response => response.text())
    .then(serverClassName => {
      return serverClassName;
    });
}

// Function to update the server state on the server
function updateServerState(state) {
  fetch('/update-server-state', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ state }),
  });
}

// Function to update the server class name on the server
function updateServerClassName(className) {
  fetch('/update-server-class-name', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ className }),
  });
}

// Function to check if the class name input is empty
function emptyClassName() {
  return document.getElementById("class-name").value.trim() === "";
}

