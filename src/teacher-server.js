// Import required modules
const express = require('express');
const http = require('http');
const { spawn } = require('child_process');

// Initialize Express app
const app = express();

// Initialize variables
let childProcess;
let serverState = 'stopped';
let serverClassName = '';

// Serve static files from the "static" directory
app.use(express.static(__dirname + '/website-teacher/'));

// Enable JSON parsing middleware
app.use(express.json());

// Define homepage route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/website-teacher/index.html');
});

// Define route to start new student server
app.get('/start-new-server', (req, res) => {
  // Spawn a new child process to run the student server
  childProcess = spawn('node', ['src/student-server.js', serverClassName]);

  // Log output from the child process
  childProcess.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  // Log errors if the child process fails to spawn
  childProcess.on('error', (err) => {
    console.error('Error spawning process:', err);
  });
  
  // Respond with success message
  res.status(200).send("Student server started successfully!");
});

// Define route to stop the student server
app.get('/stop-server', (req, res) => {
  if (childProcess) {
    // Kill the child process if it exists
    childProcess.kill();
    console.log('Student server closed.\n');
  } else {
    console.log('No server running.\n');
  }
  
  // Respond with success message
  res.status(200).send("Student server closed successfully!");
});

// Define route to get the current server state
app.get('/server-state', (req, res) => {
  res.send(serverState);
});

// Define route to get the current server class name
app.get('/server-class', (req, res) => {
  res.send(serverClassName);
});

// Define route to update the server state
app.post('/update-server-state', (req, res) => {
  const { state } = req.body;
  serverState = state;
  res.send({ success: true });
});

// Define route to update the server class name
app.post('/update-server-class-name', (req, res) => {
  const { className } = req.body;
  serverClassName = className;
  res.send({ success: true });
});

// Create HTTP server and listen on port 3334
const server = http.createServer(app);

server.listen(3334, () => {
  console.log('Teacher server running on port 3334.\n');
});


