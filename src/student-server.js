const express = require('express');
const http = require('http');
const fs = require('fs');
const mime = require('mime');
const path = require('path');
const mysql = require('mysql');

const app = express();
app.use(express.json());

const connection = mysql.createConnection({
    host: 'attendancedb.carkfyqrpaoi.eu-north-1.rds.amazonaws.com',
    user: 'admin',
    password: 'adminattendancepw',
    database: 'attendancedb'
});

let phoneIds = [];
let studentNumbers = []; 
let classActive, classLast, roomID, roomTable, roomName, classID, classUC;

app.get('/:roomID/:table', (req, res) => {
  roomName = req.params.roomID;
  roomTable = req.params.table;
  
  console.log("------------------------");
  console.log("Room: " + roomName);
  console.log("Table: " + roomTable);

  
  doesRoomNameExist(roomName, function(error, roomIDquery) {
    if (error) {
      console.log("Database error!");
      console.error(error);
      res.sendFile(path.join(__dirname, '/website-student/db-error.html'));
      return;
    } else {
      roomID = roomIDquery;
      
      if (roomID) {
        
        console.log("roomID: " + roomID);
    
        getActiveClassAndUCID(roomName, function(error, classID, UCID) {
          if (error) {
            console.log("Database error!");
            console.error(error);
            res.sendFile(path.join(__dirname, '/website-student/db-error.html'));
            return;
          }
          
          classActive = classID;
          
          classUC = UCID;
          console.log("UCID: " + UCID);
      
          if ( classActive != classLast) {
              console.log("Class changed!");
              phoneIds = [];
              studentNumbers = [];
              classLast = classActive;
          }
          
          if (classActive) {
            
            console.log("classActive: " + classActive );
                
            isTableOccupied(roomID, roomTable, function(error, tableOccupied) {
              if (error) {
                console.log("Database error!");
                console.error(error);
                res.sendFile(path.join(__dirname, '/website-student/db-error.html'));
                return;
              }
              
              console.log("Is table" + roomTable + " occupied in room " + roomID + "? : " + tableOccupied);
              
              if ( tableOccupied ) {
                res.sendFile(path.join(__dirname, '/website-student/table-occupied.html'));
              } else {
                res.sendFile(path.join(__dirname, '/website-student/index.html'));
              }
            });
          } else {
            console.log("No class active in room " +  roomName);
            res.sendFile(path.join(__dirname, '/website-student/no-class.html'));
          }
        });
      } else {
        console.log("No roomID for roomName " + roomName);
        res.sendFile(path.join(__dirname, '/website-student/no-room.html'));
      }
    }
  });
});

app.post('/verify-phoneID', (req, res) => {
  const { phoneID } = req.body;
  
  console.log("Verification -> Received phoneID: ${phoneID}");
  
  if (phoneIds.includes(phoneID)) {
    console.log("Verification - The student already marked his or someone's attendance with that device.");
    res.sendFile(path.join(__dirname, '/website-student/already-registred.html'));
  } 
});

app.post('/register-studentNumber', (req, res) => {
  const { studentNumber, phoneID } = req.body;
  
  console.log("Register - Received studentNumber: ${studentNumber}, phoneID: ${phoneID}");
  
  if (studentNumbers.includes(studentNumber)) {
    res.sendFile(path.join(__dirname, '/website-student/already-registred.html'));
  } else {
    
    findStudentIDinUC(classUC, studentNumber, function(error, studentID) {
      if (error) {
        console.log("Database error!");
        console.error(error);
        res.sendFile(path.join(__dirname, '/website-student/db-error.html'));
        return;
      }
      
      if (studentID) {
        console.log("The studentNumber " + studentNumber + " has a studentID of: " + studentID);
        
        phoneIds.push(phoneID);
        studentNumbers.push(studentNumber);
        
        addRowToTable(['student_logs_id', 'student_id', 'class_id', 'room_table'], [null, parseInt(studentID, 10), classActive, parseInt(roomTable, 10)], function(error, results) {
          if (error) {
            console.log("Database error!");
            console.error(error);
            res.sendFile(path.join(__dirname, '/website-student/db-error.html'));
            return;
          }
          
          console.log("StudentID " + studentID + ", classID " + classActive + " , roomTable " + roomTable + " added to student_logs table");
        });
        

        updateTableStatus(roomID, roomTable, 'occupied', function(error, results) {
          if (error) {
            console.log("Database error!");
            console.error(error);
            res.sendFile(path.join(__dirname, '/website-student/db-error.html'));
            return;
          }
          
          console.log("Table " + roomTable + " in roomID " + roomID + " is now occupied in room_tables table");
        });
        
        console.log("Successful registration!");
        console.log("phoneId's = " + phoneIds);
        console.log("Students registred = " + studentNumbers);
        res.sendFile(path.join(__dirname, '/website-student/successful-registration.html'));
      } else {
        console.log("There isn't any student " + studentNumber + " registred in the UC " + classUC + ".");
        res.sendFile(path.join(__dirname, '/website-student/not-in-the-class.html'));
      }
    });
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


http.createServer(app).listen(3333, () => {  
  console.log('Student server is running on port 3333.');
});

function doesRoomNameExist(roomname, callback) {
  const query = `SELECT room_id FROM rooms WHERE room_name = ?`;
  const values = [roomName];

  connection.query(query, values, function(error, results, fields) {
    if (error) {
      return callback(error, null);
    }

    if (results.length > 0) {
      const roomID = results[0].room_id;
      callback(null, roomID);
    } else {
      callback(null, null);
    }
  });
}

function getActiveClassAndUCID(roomName, callback) {
  const query = `SELECT class_id, id_uc FROM classes WHERE class_room = ? AND class_status = 'ativo'`;
  const values = [roomName];

  connection.query(query, values, function(error, results, fields) {
    if (error) {
      return callback(error);
    }
    
    if (results.length > 0) {
      const activeClassID = results[0].class_id;
      const UCID = results[0].id_uc;
      callback(null, activeClassID, UCID);
    } else {
      callback(null, null);
    }
  });
}

function isTableOccupied(roomID, tableID, callback) {
  const query = `SELECT tablet_status FROM room_tables WHERE room_id = ? AND table_number = ?`;

  connection.query(query, [roomID, tableID], function(error, results, fields) {
    if (error) {
      return callback(error);
    }

    if (results.length > 0) {
      const tableStatus = results[0].tablet_status;
      callback(null, tableStatus === 'occupied');
    } else {
      callback(null, false);
    }
  });
}

function findStudentIDinUC(UCID, studentNumber, callback) {
  const query = `SELECT student_id FROM students WHERE id_UC = '${UCID}' AND student_number = '${studentNumber}'`;
  
  connection.query(query, function(error, results, fields) {
    if (error) {
      return callback(error);
    }
    if (results && results.length > 0) { 
      const studentID = results[0].student_id;
      callback(null, studentID); 
    } else {
      callback(null, null); 
    }
  });
}

function addRowToTable(columnNames, values, callback) {
  const sanitizedValues = values.map(value => connection.escape(value));
  const query = `INSERT INTO student_logs (${columnNames.join(', ')}) VALUES (${sanitizedValues.map(v => '?').join(', ')})`;

  connection.query(query, sanitizedValues, function(error, results, fields) {
    if (error) {
      return callback(error);
    }

    callback(null, results);
  });
}

function updateTableStatus(room_id, room_table, status, callback) {
  const query = `UPDATE room_tables SET tablet_status = ? WHERE room_id = ? AND table_number = ?`;
  const values = [status, room_id, room_table];

  connection.query(query, values, function(error, results, fields) {
    if (error) {
      return callback(error);
    }
    
    callback(null, results);
  });
}
