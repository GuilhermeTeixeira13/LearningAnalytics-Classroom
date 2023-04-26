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


// Define a route to handle HTTP POST requests to the "/table/:tablenumber/:studentnumber/:phoneID" path
app.get('/:roomID/:table', (req, res) => {
  // Get the table number, student number and phone ID from the URL parameters
  const roomID = req.params.studentnumber;
  const table = req.params.tablenumber;

  res.sendFile(__dirname + '/website-student/index.html');
});


// Define the HTTPS options for the server
const options = {
  key: fs.readFileSync('/home/guilherme/Desktop/IoT_Attendance_Project/src/website-student/server.key'),
  cert: fs.readFileSync('/home/guilherme/Desktop/IoT_Attendance_Project/src/website-student/server.cert')
};

// Create an HTTPS server instance and start listening on port 3333
https.createServer(options, app).listen(3333, () => {  
  console.log('Student server is running on port 3333. Class name = ' + serverClassName);
});



