const express = require('express');
const http = require('http');
const fs = require('fs');
const mime = require('mime');
const path = require('path');
const mysql = require('mysql');

const app = express();
app.use(express.json());
app.set('view engine', 'ejs');

const dotenv = require('dotenv');
const envPath = path.join('/home/guilherme/Desktop/IoT_Attendance_Project/src', '..', '.env');
dotenv.config({ path: envPath });

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

let phoneIds = [];
let studentNumbers = []; 
let classActive, classLast, roomID, roomTable, roomName, classID, classUC, msg;

app.get('/:roomID/:table', (req, res) => {
  roomName = req.params.roomID;
  roomTable = req.params.table;
  
  console.log("------------------------");
  console.log("Room: " + roomName);
  console.log("Table Number: " + roomTable);

  
  doesRoomNameExist(roomName, function(error, roomIDquery) {
    if (error) {
      console.log("Database error!");
      console.error(error);
      res.render('response', { msg: 'We are experiencing problems with our DB, please be patient...' });
      return;
    } else {
      roomID = roomIDquery;
      
      if (roomID) {
        
        console.log("roomID: " + roomID);
    
        getActiveClassAndUCID(roomName, function(error, classID, UCID) {
          if (error) {
            console.log("Database error!");
            console.error(error);
            res.render('response', { msg: 'We are experiencing problems with our DB, please be patient...' });
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
            
            doesTableExists(roomID, roomTable, function(error, tableID) {
              if (error) {
                console.log("Database error!");
                console.error(error);
                res.render('response', { msg: 'We are experiencing problems with our DB, please be patient...' });
                return;
              }
              
              if (tableID) {
                console.log("TableID: " + tableID);
                
                isTableOccupied(tableID, function(error, tableOccupied) {
                  if (error) {
                    console.log("Database error!");
                    console.error(error);
                    res.render('response', { msg: 'We are experiencing problems with our DB, please be patient...' });
                    return;
                  }
                  
                  console.log("Is table " + roomTable + " occupied in room " + roomID + "? : " + tableOccupied);
                  
                  if ( tableOccupied ) {
                    res.render('response', { msg: 'It looks like this desk is already being occupied by another student!' });
                  } else {
                    res.sendFile(path.join(__dirname, '/website-student/index.html'));
                  }
                });
              } else {
                console.log("Table " + roomTable + " does not exist in room " + roomID);
                res.render('response', { msg: 'Seems like this table is does not exist in this room!' });
              }              
            });         
          } else {
            console.log("No class active in room " +  roomName);
            res.render('response', { msg: 'No class active in room ' +  roomName });
          }
        });
      } else {
        console.log("No roomID for roomName " + roomName);
        res.render('response', { msg: 'This room does not exist!' });
      }
    }
  });
});

app.post('/verify-phoneID', (req, res) => {
  const { phoneID } = req.body;
  
  console.log("Verification -> Received phoneID: " + phoneID);
  
  if (phoneIds.includes(phoneID)) {
    console.log("Verification - The student already marked his or someone's attendance with that device.");
    res.render('response', { msg: 'You already marked your attendance to this class!' });
  } 
});

app.post('/register-studentNumber', (req, res) => {
  const { studentNumber, phoneID } = req.body;
  
  console.log("Register - Received studentNumber: " + studentNumber + ", phoneID: " + phoneID);
  
  if (studentNumbers.includes(studentNumber)) {
    console.log("The student number " + studentNumber + " already marked his attendance.");
    res.render('response', { msg: 'You already marked your attendance to this class!' });
  } else {
    
    findStudentIDinUC(classUC, studentNumber, function(error, studentID) {
      if (error) {
        console.log("Database error!");
        console.error(error);
        res.render('response', { msg: 'We are experiencing problems with our DB, please be patient...' });
        return;
      }
      
      if (studentID) {
        console.log("The studentNumber " + studentNumber + " has a studentID of: " + studentID);
        
        addRowToTable(['student_logs_id', 'student_id', 'class_id', 'room_table'], [null, parseInt(studentID, 10), classActive, parseInt(roomTable, 10)], function(error, results) {
          if (error) {
            console.log("Database error!");
            console.error(error);
            res.render('response', { msg: 'We are experiencing problems with our DB, please be patient...' });
            return;
          }
          
          console.log("StudentID " + studentID + ", classID " + classActive + " , roomTable " + roomTable + " added to student_logs table");
        });
        

        updateTableStatus(roomID, roomTable, 'occupied', function(error, results) {
          if (error) {
            console.log("Database error!");
            console.error(error);
            res.render('response', { msg: 'We are experiencing problems with our DB, please be patient...' });
            return;
          }
          
          console.log("Table " + roomTable + " in roomID " + roomID + " is now occupied in room_tables table");
        });
        
        phoneIds.push(phoneID);
        studentNumbers.push(studentNumber);
        
        console.log("phoneId's = " + phoneIds);
        console.log("Students registred = " + studentNumbers);
        console.log("Successful registration!");
        
        res.render('response', { msg: 'Thanks for your registration!' });
      } else {
        console.log("There isn't any student " + studentNumber + " registred in the UC " + classUC + ".");
        res.render('response', { msg: 'Seems like you are not registred in this class!' });
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

function doesTableExists(roomID, tableNumber, callback) {
  const query = `SELECT room_table_id FROM room_tables WHERE room_id = ? AND table_number = ?`;

  connection.query(query, [roomID, tableNumber], function(error, results, fields) {
    if (error) {
      return callback(error);
    }

    if (results.length > 0) {
      const tableID = results[0].room_table_id;
      callback(null, tableID);
    } else {
      callback(null, null);
    }
  });
}

function isTableOccupied(tableID, callback) {
  const query = `SELECT tablet_status FROM room_tables WHERE room_table_id = ?`;

  connection.query(query, [tableID], function(error, results, fields) {
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
