const express = require('express');
const https = require('https');
const fs = require('fs');
const mime = require('mime');
const path = require('path');

const app = express();
app.use(express.json());

let phoneIds = []; 
let classActive, classLast, roomID, roomTable;

app.get('/:roomID/:table', (req, res) => {
  roomID = req.params.roomID;
  roomTable = req.params.table;
  
  console.log("Room: " + roomID);
  console.log("Table: " + roomTable);
  
  // Verify if roomID exists
  const roomIDexists = true; // Function that returns true if roomID exists.

  if (roomIDexists === true) {
    // Verify what class of that room is currently active
    classActive = 3; // Function that returns the classID, if null there isn't any class running.
    
    // Reset phoneId array whenever the class changes
    if ( classActive != classLast) {
        phoneIds = [];
        classLast = classActive;
    }
    
    if (classActive === null) {
      res.sendFile(__dirname + '/website-student/no-class.html');
    } else {
      res.sendFile(__dirname + '/website-student/index.html');
    }
  } else {
    res.sendFile(__dirname + '/website-student/no-room.html');
  }

});

app.post('/verify-phoneID', (req, res) => {
  const { phoneID } = req.body;
  
  console.log(`Verification -> Received phoneID: ${phoneID}`);
  
  if (phoneIds.includes(phoneID)) {
    // The student already marked his or someone's attendance with that device.
    console.log(`Verification - The student already marked his or someone's attendance with that device.`);
    res.sendFile(path.join(__dirname, '/website-student/already-registred.html'));
  } 
});

app.post('/register-studentNumber', (req, res) => {
  const { studentNumber, phoneID } = req.body;
  
  console.log(`Register - Received studentNumber: ${studentNumber}, phoneID: ${phoneID}`);
  
  // Verify if the studentNumber is registred in the class.
  const studentID = 3; // Function that returns studentID. If null there isn't any student with that studentNumber registred in the class.
  
  if ( studentID === null ) { 
      console.log(`There isn't any student ${studentNumber} registred in the class.`);
      res.sendFile(path.join(__dirname, '/website-student/not-in-the-class.html'));
  } else {
    phoneIds.push(phoneID);
    
    // LEFT ---> VERIFY IF TABLE IS ALREADY OCCUPIED
    
    
    // IF NOT
    console.log(`Successful registration! -> phoneIds: ` + phoneIds);
    // DB: Change tableStatus to active - roomID, roomTablE
    // DB: Add to presence table - studentID, classID
    res.sendFile(path.join(__dirname, '/website-student/successful-registration.html'));
    
    
    // IF YES
  }
});

app.use(express.static(__dirname + '/website-student/', {
  index: false,
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

const options = {
  key: fs.readFileSync('/home/guilherme/Desktop/IoT_Attendance_Project/src/website-student/server.key'),
  cert: fs.readFileSync('/home/guilherme/Desktop/IoT_Attendance_Project/src/website-student/server.cert')
};


https.createServer(options, app).listen(3333, () => {  
  console.log('Student server is running on port 3333.');
});



