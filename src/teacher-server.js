const express = require('express');
const http = require('http');
const { spawn } = require('child_process');

const app = express();

let childProcess;

// Serve static files from the "static" directory
app.use(express.static(__dirname + '/website-teacher/'));

app.use(express.json());

// Define routes
app.get('/', (req, res) => {
  // Serve the homepage
  res.sendFile(__dirname + '/website-teacher/index.html');
});

app.get('/start-new-server', (req, res) => {
  childProcess = spawn('node', ['src/student-server.js']);
  childProcess.stdout.on('data', (data) => {
    console.log(data.toString());
  });
  childProcess.on('error', (err) => {
    console.error('Error spawning process:', err);
  });
});

app.get('/stop-server', (req, res) => {
    if(childProcess){
      childProcess.kill();
      console.log('Student server closed.');
    } else {
      console.log('No server running.');
    }
});

const server = http.createServer(app);

server.listen(3334, () => {
  console.log('Teacher server running on port 3334');
});

