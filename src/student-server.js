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
let classActiveID, classLastID, classUCID, msg;

app.get('/:roomName/:table', handleGetRequest);
app.post('/verify-phoneID', handleVerifyPhoneID);
app.post('/register-studentNumber', handleRegisterStudentNumber);

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

function handleGetRequest(req, res) {
  const roomName = req.params.roomName;
  const roomTable = req.params.table;

  console.log(`/${roomName}/${roomTable} > Room: ${roomName}`);
  console.log(`/${roomName}/${roomTable} > Table Number: ${roomTable}`);

  doesRoomNameExist(roomName, (error, roomID) => {
    if (error) {
      handleError(res);
      return;
    }

    if (!roomID) {
      console.log(`/${roomName}/${roomTable} > No roomID for roomName ${roomName}`);
      return res.render('response', { msg: 'This room does not exist!' });
    }

    console.log(`/${roomName}/${roomTable} > roomID: ${roomID}`);
    getActiveClassAndUCID(roomName, (error, classID, UCID) => {
      if (error) {
        handleError(res);
        return;
      }

      classActiveID = classID;
      classUCID = UCID;

      console.log(`/${roomName}/${roomTable} > classActiveID: ${classActiveID}`);
      console.log(`/${roomName}/${roomTable} > classUCID: ${classUCID}`);

      if (classActiveID != classLastID) {
        handleClassChange();
      }

      if (!classActiveID) {
        console.log(`/${roomName}/${roomTable} > No class active in room ${roomName}`);
        return res.render('response', { msg: 'No class active in room ' + roomName });
      }

      doesTableExists(roomID, roomTable, (error, tableID) => {
        if (error) {
          handleError(res);
          return;
        }

        if (!tableID) {
          console.log(`/${roomName}/${roomTable} > Table ${roomTable} does not exist in room ${roomID}`);
          return res.render('response', { msg: 'Seems like this table does not exist in this room!' });
        }

        console.log(`/${roomName}/${roomTable} > TableID: ${tableID}`);
        isTableOccupied(tableID, (error, tableOccupied) => {
          if (error) {
            handleError(res);
            return;
          }

          console.log(`/${roomName}/${roomTable} > Is table ${roomTable} occupied in room ${roomID}? : ${tableOccupied}`);

          if (tableOccupied) {
            res.render('response', { msg: 'It looks like this desk is already being occupied by another student!' });
          } else {
            res.render('index', { roomID, roomTable, tableID, classActiveID });
          }
        });
      });
    });
  });

  function handleError(res) {
    console.log(`/${roomName}/${roomTable} > Database error!`);
    res.render('response', { msg: 'We are experiencing problems with our DB, please be patient...' });
  }

  function handleClassChange() {
    console.log(`/${roomName}/${roomTable} > Class changed!`);
    phoneIds = [];
    studentNumbers = [];
    classLastID = classActiveID;
  }
}


function handleVerifyPhoneID(req, res) {
  const { phoneID } = req.body;
  if (phoneIds.includes(phoneID)) {
    console.log(`/verify-phoneID > The student with phoneID = ${phoneID} already marked his or someone's attendance with that device.`);
    res.render('response', { msg: 'You already marked your attendance to this class!' });
  }
}

function handleRegisterStudentNumber(req, res) {
  const { studentNumber, phoneID, roomTable, roomID, tableID, classActiveStart } = req.body;

  console.log(`/register-studentNumber > Received studentNumber: ${studentNumber}`);
  console.log(`/register-studentNumber > Received phoneID: ${phoneID}`);
  console.log(`/register-studentNumber > Received roomTable: ${roomTable}`);
  console.log(`/register-studentNumber > Received roomID: ${roomID}`);
  console.log(`/register-studentNumber > Received tableID: ${tableID}`);
  console.log(`/register-studentNumber > Received classActiveStart: ${classActiveStart}`);
  console.log(`/register-studentNumber > Received classActiveID: ${classActiveID}`);
  console.log(`/register-studentNumber > (classActiveStart == classActiveID): ${classActiveStart == classActiveID}`);

  if (studentNumbers.includes(studentNumber)) {
    console.log(`/register-studentNumber > The student number ${studentNumber} already marked his attendance.`);
    return res.render('response', { msg: 'You already marked your attendance to this class!' });
  }

  if (classActiveStart != classActiveID) {
    console.log(`/register-studentNumber > The class is not active anymore! You took too long!`);
    return res.render('response', { msg: 'The class is not active anymore! You took too long!' });
  }

  findStudentIDinUC(classUCID, studentNumber, (error, studentID) => {
    if (error) {
      return handleError(res);
    }

    if (!studentID) {
      console.log(`/register-studentNumber > There isn't any student ${studentNumber} registered in the UC ${classUCID}.`);
      return res.render('response', { msg: 'Seems like you are not registered in the UC!' });
    }

    console.log(`/register-studentNumber > The studentNumber ${studentNumber} has a studentID of: ${studentID}`);

    isTableOccupied(tableID, (error, tableOccupied) => {
      if (error) {
        return handleError(res);
      }

      console.log(`/register-studentNumber > Is table ${roomTable} occupied in room ${roomID}? : ${tableOccupied}`);

      if (tableOccupied) {
        return res.render('response', { msg: 'It looks like this desk is already being occupied by another student!' });
      }

      addRowToTable(['student_logs_id', 'student_id', 'class_id', 'room_table'], [null, parseInt(studentID, 10), classActiveID, parseInt(roomTable, 10)], (error, results) => {
        if (error) {
          return handleError(res);
        } else {
          console.log(`/register-studentNumber > [StudentID:${studentID}, classID:${classActiveID}, roomTable:${roomTable}] added to student_logs table`);
        }
      });

      updateTableStatus(roomID, roomTable, 'occupied', (error, results) => {
        if (error) {
          return handleError(res);
        } else {
          console.log(`/register-studentNumber > Desk ${roomTable} in roomID ${roomID} is now occupied in room_tables table`);
          console.log(`/register-studentNumber > Successful registration!`);
        }
      });

      phoneIds.push(phoneID);
      studentNumbers.push(studentNumber);

      console.log(`/register-studentNumber > phoneId's = ${phoneIds}`);
      console.log(`/register-studentNumber > Students registered = ${studentNumbers}`);
      res.render('response', { msg: 'Thanks for your registration!' });
    });
  });

  function handleError(res) {
    console.log(`/register-studentNumber > Database error!`);
    res.render('response', { msg: 'We are experiencing problems with our DB, please be patient...' });
  }
}


function doesRoomNameExist(roomName, callback) {
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
