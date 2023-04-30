const express = require('express');
const https = require('https');
const fs = require('fs');
const mime = require('mime');
const path = require('path');
const mysql = require('mysql');

const app = express();
app.use(express.json());

const connection = mysql.createConnection({
    host: 'your_host',
    user: 'your_user',
    password: 'your_password',
    database: 'your_database'
});

connection.on('error', function(err) {
  console.log("AQUI");
  console.error('Database connection error:', err);
});


let phoneIds = []; 
let classActive, classLast, roomID, roomTable;

app.get('/:roomID/:table', (req, res) => {
  roomID = req.params.roomID;
  roomTable = req.params.table;
  
  console.log("------------------------");
  console.log("Room: " + roomID);
  console.log("Table: " + roomTable);

  
  doesRoomIDExist(roomID, function(error, exists) {
    if (error) {
      console.log(`Database error!`);
      //console.error(error);
      res.sendFile(path.join(__dirname, '/website-student/db-error.html'));
      return;
    } else {
      if (exists) {
        
        // Verify what class of that room is currently active
        // Function that returns the active classID in that the roomID, if null there isn't any class running.
    
        getActiveClassID(roomID, function(error, activeClassID) {
          if (error) {
            console.log(`Database error!`);
            //console.error(error);
            res.sendFile(path.join(__dirname, '/website-student/db-error.html'));
            return;
          }
          
          // Reset phoneId array whenever the class changes
          if ( classActive != classLast) {
              phoneIds = [];
              classLast = classActive;
          }
          
          if (activeClassID) {
            
            // Verify if table is already occupied      
            isTableOccupied(roomID, roomTable, function(error, tableOccupied) {
              if (error) {
                console.log(`Database error!`);
                //console.error(error);
                res.sendFile(path.join(__dirname, '/website-student/db-error.html'));
                return;
              }
              
              if ( tableOccupied ) {
                res.sendFile(path.join(__dirname, '/website-student/table-occupied.html'));
              } else {
                res.sendFile(path.join(__dirname, '/website-student/index.html'));
              }
            });
          } else {
            res.sendFile(path.join(__dirname, '/website-student/no-class.html'));
          }
        });
      } else {
        res.sendFile(path.join(__dirname, '/website-student/no-room.html'));
      }
    }
  });
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
  // Function that returns studentID. If null there isn't any student with that studentNumber registred in the class.
  
  findStudentIDinClass(classActive, studentNumber, function(studentID) {
    if (error) {
      console.log(`Database error!`);
      //console.error(error);
      res.sendFile(path.join(__dirname, '/website-student/db-error.html'));
      return;
    }
    
    if (studentID) {
      phoneIds.push(phoneID);
  
      console.log(`Successful registration! -> phoneIds: ` + phoneIds);
      
      // DB: Add presence to presence table - studentID, classID
      
      addRowToTable(['student_id', 'class_id', 'time_arrival'], [studentID, ClassActive, null], function(error, results) {
        if (error) {
          console.log(`Database error!`);
          //console.error(error);
          res.sendFile(path.join(__dirname, '/website-student/db-error.html'));
          return;
        }
      });
      
      // DB: Change tableStatus to active - roomID, roomTable
      
      updateTableStatus(roomID, roomTable, 'active', function(error, results) {
        if (error) {
          console.log(`Database error!`);
          //console.error(error);
          res.sendFile(path.join(__dirname, '/website-student/db-error.html'));
          return;
        }
      });
      
      res.sendFile(path.join(__dirname, '/website-student/successful-registration.html'));
    } else {
      console.log(`There isn't any student ${studentNumber} registred in the class.`);
      res.sendFile(path.join(__dirname, '/website-student/not-in-the-class.html'));
    }
  });
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


// Function that returns true if roomID exists and false if not.
function doesRoomIDExist(roomID, callback) {
  const query = `SELECT roomID FROM tableName WHERE roomID = ?`;
  const values = [roomID];

  connection.query(query, values, function(error, results, fields) {
    if (error) {
      return callback(error, null);
    }

    if (results.length > 0) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  });
}


// Function that returns the active classID in that the roomID, if null there isn't any class running.
function getActiveClassID(roomID, callback) {
  const query = `SELECT classID FROM tableName WHERE roomID = ? AND classStatus = 'active'`;
  const values = [roomID];

  connection.query(query, values, function(error, results, fields) {
    if (error) {
      return callback(error);
    }
    
    if (results.length > 0) {
      const activeClassID = results[0].classID;
      callback(null, activeClassID);
    } else {
      callback(null, null);
    }
  });
}

// Function that checks if a table is occupied.
function isTableOccupied(roomID, tableID, callback) {
  const query = `SELECT table_status FROM tableName WHERE room_id = ? AND table_id = ?`;

  connection.query(query, [roomID, tableID], function(error, results, fields) {
    if (error) {
      return callback(error);
    }

    if (results.length > 0) {
      const tableStatus = results[0].table_status;
      callback(null, tableStatus === 'occupied');
    } else {
      callback(null, false);
    }
  });
}

// Function that returns studentID. If null there isn't any student with that studentNumber registred in the class.
function findStudentIDinClass(classID, studentNumber, callback) {
  const query = `SELECT StudentID FROM tableName WHERE classID = '${classID}' AND StudentNumber = '${studentNumber}'`;

  connection.query(query, function(error, results, fields) {
    if (error) {
      return callback(error);
    }
    if (results.length > 0) {
      const studentID = results[0].StudentID;
      callback(studentID);
    } else {
      callback(null);
    }
  });
}

// Function that adds a new row to the specified table.
function addRowToTable(columnNames, values, callback) {
  const sanitizedValues = values.map(value => connection.escape(value));
  const query = `INSERT INTO tableName (${columnNames.join(', ')}) VALUES (${sanitizedValues.map(v => '?').join(', ')})`;

  connection.query(query, sanitizedValues, function(error, results, fields) {
    if (error) {
      return callback(error);
    }

    callback(null, results);
  });
}


// Function that updates the status of the specified table.
function updateTableStatus(room_id, room_table, status, callback) {
  const query = `UPDATE tableName SET table_status = ? WHERE room_id = ? AND room_table = ?`;
  const values = [status, mysql.escape(room_id), mysql.escape(room_table)];

  connection.query(query, values, function(error, results, fields) {
    if (error) {
      return callback(error);
    }
    
    callback(null, results);
  });
}
