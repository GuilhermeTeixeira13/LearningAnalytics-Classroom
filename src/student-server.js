// Import required modules
const express = require('express');
const https = require('https');
const fs = require('fs');
const mime = require('mime');

// Create an instance of the express application
const app = express();

// Enable JSON request parsing
app.use(express.json());

// Initialize an empty array to store attendance records
const registos = [];


// Define a route to handle HTTP POST requests to the "/table/:tablenumber/:studentnumber/:phoneID" path
app.get('/:roomID/:table', (req, res) => {
  // Get the table number, student number and phone ID from the URL parameters
  const roomID = req.params.roomID;
  const table = req.params.table;
  
  console.log(roomID);
  console.log(table);
  
  // Serve the index.html file
  res.sendFile(__dirname + '/website-student/index.html');
});

// Serve static files (excluding index.html) from the "website-student" directory for all other paths
app.use(express.static(__dirname + '/website-student/', {
  index: false,
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));


// Define the HTTPS options for the server
const options = {
  key: fs.readFileSync('/home/guilherme/Desktop/IoT_Attendance_Project/src/website-student/server.key'),
  cert: fs.readFileSync('/home/guilherme/Desktop/IoT_Attendance_Project/src/website-student/server.cert')
};

// Create an HTTPS server instance and start listening on port 3333
https.createServer(options, app).listen(3333, () => {  
  console.log('Student server is running on port 3333.');
});



