// Import required modules
const express = require('express');
const https = require('https');
const fs = require('fs');

// Create an instance of the express application
const app = express();

// Get the server class name from the command line arguments
const serverClassName = process.argv[2];

// Serve static files from the "website-student" directory
app.use(express.static(__dirname + '/website-student/'));

// Enable JSON request parsing
app.use(express.json());

// Initialize an empty array to store attendance records
const registos = [];

// Define a route to handle HTTP GET requests to the root path
app.get('/', (req, res) => {
  // Serve the "index.html" file as the response
  res.sendFile(__dirname + '/website-student/index.html');
});

// Define a route to handle HTTP POST requests to the "/table/:tablenumber/:studentnumber/:phoneID" path
app.post('/table/:tablenumber/:studentnumber/:phoneID', (req, res) => {
  // Get the table number, student number and phone ID from the URL parameters
  const studentnumber = req.params.studentnumber;
  const tablenumber = req.params.tablenumber;
  const phoneID = req.params.phoneID;

  // Create a new attendance record with the current date, time, class name, student number, table number and phone ID
  const registo = {
    "date": getCurrentDate(),
    "time": getCurrentTime(),
    "class": serverClassName,
    "student-number": studentnumber,
    "table": tablenumber,
    "phone-id": phoneID
  };

  // Add the new attendance record to the array of records
  registos.push(registo);

  // Return the new attendance record as the response
  return res.status(200).json(registo);
});

// Define a route to handle HTTP GET requests to the "/table" path
app.get('/table', (req, res) => {
  // Return the array of attendance records as the response
  return res.status(200).json(registos);
});

// Define a function to get the current date in the format "DD-MM-YYYY"
function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${day}-${month}-${year}`;
}

// Define a function to get the current time in the format "HH:MM"
function getCurrentTime() {
  const now = new Date();
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
}

// Define the HTTPS options for the server
const options = {
  key: fs.readFileSync('/home/guilherme/Desktop/IoT_Attendance_Project/src/website-student/server.key'),
  cert: fs.readFileSync('/home/guilherme/Desktop/IoT_Attendance_Project/src/website-student/server.cert')
};

// Create an HTTPS server instance and start listening on port 3333
https.createServer(options, app).listen(3333, () => {  
  console.log('Student server is running on port 3333. Class name = ' + serverClassName);
});



