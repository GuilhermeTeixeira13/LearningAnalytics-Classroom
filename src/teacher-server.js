const express = require('express');
const http = require('http');
const { spawn } = require('child_process');

const app = express();

let childProcess;
let serverState = 'stopped';
let serverClassName = '';

// Serve static files from the "static" directory
app.use(express.static(__dirname + '/website-teacher/'));

app.use(express.json());

// Define routes
app.get('/', (req, res) => {
  // Serve the homepage
  res.sendFile(__dirname + '/website-teacher/index.html');
});

app.get('/start-new-server', (req, res) => {
  childProcess = spawn('node', ['src/student-server.js', serverClassName]);
  childProcess.stdout.on('data', (data) => {
    console.log(data.toString());
  });
  childProcess.on('error', (err) => {
    console.error('Error spawning process:', err);
  });
  
  res.status(200).send("Student server started successfully!");
});

app.get('/stop-server', (req, res) => {
  if (childProcess) {
    childProcess.kill();
    console.log('Student server closed.\n');
  } else {
    console.log('No server running.\n');
  }
  
  res.status(200).send("Student server closed successfully!");
});

app.get('/server-state', (req, res) => {
  res.send(serverState);
});

app.post('/update-server-state', (req, res) => {
  const { state } = req.body;
  serverState = state;
  res.send({ success: true });
});

app.post('/update-server-class-name', (req, res) => {
  const { className } = req.body;
  serverClassName = className;
  res.send({ success: true });
});

const server = http.createServer(app);

server.listen(3334, () => {
  console.log('Teacher server running on port 3334.\n');
});

