const express = require('express');
const http = require('http');
const { spawn } = require('child_process');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write('<button id="start-server">Start new server</button>');
  res.end(`
    <script>
      document.getElementById('start-server').addEventListener('click', () => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '/start-new-server');
        xhr.onload = function() {
          console.log(xhr.responseText);
        };
        xhr.send();
      });
    </script>
  `);
});

app.get('/start-new-server', (req, res) => {
  const childProcess = spawn('node', ['src/student.js']);
  childProcess.stdout.on('data', (data) => {
    console.log(data.toString());
  });
  childProcess.on('error', (err) => {
    console.error('Error spawning process:', err);
  });
});

const server = http.createServer(app);

server.listen(3334, () => {
  console.log('Teacher server running on port 3334');
});

