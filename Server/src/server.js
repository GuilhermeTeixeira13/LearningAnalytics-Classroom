// Import required packages
const express = require('express');
const https = require('https');
const fs = require('fs');
const { networkInterfaces } = require('os');

// Initialize the Express application
const app = express();

// Serve static files from the "static" directory
app.use(express.static(__dirname + '/website/'));

// Parse JSON data in the request body
app.use(express.json());

// Create an array to store registration data
const registos = [];

// Define routes
app.get('/', (req, res) => {
  // Serve the homepage
  res.sendFile(__dirname + '/website/index.html');
});

app.post('/table/:tablenumber/:studentnumber', (req, res) => {
  // Extract data from request parameters
  const studentnumber = req.params.studentnumber;
  const tablenumber = req.params.tablenumber;

  // Get the IP address of the client that made the request
  const ipAddress = req.connection.remoteAddress;

  // Create a new registration object
  const registo = {
    "date": getCurrentDate(),
    "time": getCurrentTime(),
    "class": "Redes de Computadores",
    "student-number": studentnumber,
    "table": tablenumber,
    "ipAddress": ipAddress
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

function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${day}-${month}-${year}`;
}

function getCurrentTime() {
  const now = new Date();
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
}

// Configure HTTPS options
const options = {
  key: fs.readFileSync('/home/guilherme/Desktop/IoT_Attendance_Project/Server/src/server.key'),
  cert: fs.readFileSync('/home/guilherme/Desktop/IoT_Attendance_Project/Server/src/server.cert')
};

// Get wlan0 IP adress
const nets = networkInterfaces();
const ipAddress = nets['wlan0'][0].address;
global.serverIpAddress = ipAddress;

// Start the server using HTTPS
https.createServer(options, app).listen(3333, global.serverIpAddress, () => {
  console.log('Server is running on port 3333');
});
