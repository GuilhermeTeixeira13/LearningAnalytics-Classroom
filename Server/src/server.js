// Import required packages
const express = require('express');
const https = require('https');
const fs = require('fs');

// Initialize the Express application
const app = express();

// Serve static files from the "static" directory
app.use(express.static('static'));

// Parse JSON data in the request body
app.use(express.json());

// Create an array to store registration data
const registos = [];

// Define routes
app.get('/', (req, res) => {
  // Serve the homepage
  res.sendFile(__dirname + '/website/index.html');
});

app.post('/table/:tablenumber/:studentnumber/:machineId', (req, res) => {
  // Extract data from request parameters
  const studentnumber = req.params.studentnumber;
  const tablenumber = req.params.tablenumber;
  const machineId = req.params.machineId;

  // Create a new registration object
  const registo = {
    "data": "27-03-2023",
    "hora": "11:14",
    "aula": "Redes de Computadores",
    "num": studentnumber,
    "table": tablenumber,
    "idMaquina": machineId
  };

  // Add the registration object to the array
  registos.push(registo);

  // Return the registration object in the response
  return res.status(200).json(registo);
});

app.get('/table', (req, res) => {
  // Return all registration objects in the response
  return res.status(200).json(registos);
});

// Configure HTTPS options
const options = {
  key: fs.readFileSync('/home/guilherme/Desktop/IoT_Attendance_Project/Server/src/server.key'),
  cert: fs.readFileSync('/home/guilherme/Desktop/IoT_Attendance_Project/Server/src/server.cert')
};

// Start the server using HTTPS
https.createServer(options, app).listen(3333, () => {
  console.log('Server is running on port 3333');
});
