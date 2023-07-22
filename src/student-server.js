// Import required modules
const express = require('express'); // Express web framework
const http = require('http'); // HTTP module for creating a server
const fs = require('fs'); // File system module for file operations
const mime = require('mime'); // Mime module for working with MIME types
const path = require('path'); // Path module for working with file paths
const mysql = require('mysql'); // MySQL module for database operations

// Create an instance of the Express application
const app = express();

// Middleware to parse incoming JSON data
app.use(express.json());

// Set the view engine to EJS (Embedded JavaScript templates)
app.set('view engine', 'ejs');

// Load environment variables from the .env file in the specified path
const dotenv = require('dotenv');
const envPath = path.join('/home/guilherme/Desktop/IoT_Attendance_Project/src', '..', '.env');
dotenv.config({ path: envPath });

// Create a MySQL database connection using environment variables
// .env file at /home/guilherme/Desktop/IoT_Attendance_Project
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Declare some global variables
let phoneIds = []; // An array to store phone IDs from the current class
let studentNumbers = []; // An array to store student numbers from the current class
let activeClassID, lastClassID, classCourseID, msg; // Some variables for class-related data

// Set up routes and their corresponding handlers
app.get('/:classroomName/:table', handleQRcodeRequest); // GET request handler - QRCODE reading
app.post('/verify-phoneID', handleVerifyPhoneID); // POST request handler for phone ID verification - When form page is onLoad()
app.post('/register-studentNumber', handleRegisterStudentNumber); // POST request handler for registering student attendance - When the student clicks in the register button

// Serve static files (CSS and JS) from the 'website-student' directory
app.use(express.static(__dirname + '/website-student/', {
  index: false,
  setHeaders: (res, path) => {
    // Set appropriate Content-Type headers for CSS and JS files
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Create an HTTP server to listen on port 3333
http.createServer(app).listen(3333, () => {
  console.log('Student server is running on port 3333.');
});

function handleQRcodeRequest(req, res) {
  // Extract classroomName and classroomTable from request parameters
  const classroomName = req.params.classroomName;
  const classroomTable = req.params.table;

  // Log classroomName and classroomTable for debugging purposes
  console.log(`/${classroomName}/${classroomTable} > Room: ${classroomName}`);
  console.log(`/${classroomName}/${classroomTable} > Table Number: ${classroomTable}`);

  // Check if the given classroomName exists in the database
  doesRoomNameExist(classroomName, (error, classroomID) => {
    if (error) {
      handleError(res, error);
      return;
    }

    // If the classroomName doesn't exist, render an error response
    if (!classroomID) {
      console.log(`/${classroomName}/${classroomTable} > No classroomID for classroomName ${classroomName}`);
      return res.render('response', { msg: 'This classroom does not exist!' });
    }

    // If the classroomName exists, get the active classID and courseID
    getActiveClassAndCourseID(classroomName, (error, classID, courseID) => {
      if (error) {
        handleError(res, error);
        return;
      }

      // Store the classID and courseID in global variables for later use
      activeClassID = classID;
      classCourseID = courseID;

      // Log the activeClassID and classCourseID for debugging purposes
      console.log(`/${classroomName}/${classroomTable} > activeClassID: ${activeClassID}`);
      console.log(`/${classroomName}/${classroomTable} > classCourseID: ${classCourseID}`);

      // If the class changes, call handleClassChange()
      if (activeClassID != lastClassID) {
        handleClassChange();
      }

      // If there is no active class, render an error response
      if (!activeClassID) {
        console.log(`/${classroomName}/${classroomTable} > No class active in classroom ${classroomName}`);
        return res.render('response', { msg: 'No class active in classroom ' + classroomName });
      }

      // Check if the given table exists in the classroom
      doesTableExists(classroomID, classroomTable, (error, tableID) => {
        if (error) {
          handleError(res, error);
          return;
        }

        // If the table doesn't exist, render an error response
        if (!tableID) {
          console.log(`/${classroomName}/${classroomTable} > Table ${classroomTable} does not exist in classroom ${classroomID}`);
          return res.render('response', { msg: 'Seems like this table does not exist in this classroom!' });
        }

        // Log the tableID for debugging purposes
        console.log(`/${classroomName}/${classroomTable} > tableID: ${tableID}`);

        // Check if the table is already occupied by another student
        isTableOccupied(tableID, (error, tableOccupied) => {
          if (error) {
            handleError(res, error);
            return;
          }

          // Log whether the table is occupied or not
          console.log(`/${classroomName}/${classroomTable} > Is table ${classroomTable} occupied in room ${classroomID}? : ${tableOccupied}`);

          // If the table is occupied, render an error response
          if (tableOccupied) {
            res.render('response', { msg: 'It looks like this desk is already being occupied by another student!' });
          } else {
            // If the table is not occupied, render the 'index' view with relevant data
            res.render('index', { classroomID, classroomTable, tableID, activeClassID });
          }
        });
      });
    });
  });

  // Function to handle database-related errors
  function handleError(res, error) {
    console.log(`/${classroomName}/${classroomTable} > Database error!` + error);
    res.render('response', { msg: 'We are experiencing problems with our DB, please be patient...' });
  }

  // Function to handle class change
  function handleClassChange() {
    console.log(`/${classroomName}/${classroomTable} > Class changed!`);
    phoneIds = []; // Clear the phoneIds array
    studentNumbers = []; // Clear the studentNumbers array
    lastClassID = activeClassID; // Update the classLastID with the current classActiveID
  }
}

// Function to handle the verification of phoneID
function handleVerifyPhoneID(req, res) {
  // Extract the phoneID from the request body
  const { phoneID } = req.body;

  // Check if the phoneID is included in the phoneIds array
  if (phoneIds.includes(phoneID)) {
    // If the phoneID is already present in the phoneIds array, it means the student has already marked attendance with that device
    console.log(`/verify-phoneID > The student with phoneID = ${phoneID} already marked his or someone's attendance with that device.`);

    // Render a response to inform the student that they have already marked their attendance for this class
    res.render('response', { msg: 'You already marked your attendance to this class!' });
  }
}


function handleRegisterStudentNumber(req, res) {
  // Destructure data from the request body
  const { studentNumber, phoneID, classroomTable, classroomID, tableID, startClassID } = req.body;

  // Log the received data for debugging purposes
  console.log(`/register-studentNumber > Received studentNumber: ${studentNumber}`);
  console.log(`/register-studentNumber > Received phoneID: ${phoneID}`);
  console.log(`/register-studentNumber > Received classroomTable: ${classroomTable}`);
  console.log(`/register-studentNumber > Received classroomID: ${classroomID}`);
  console.log(`/register-studentNumber > Received tableID: ${tableID}`);
  console.log(`/register-studentNumber > Received startClassID: ${startClassID}`);
  console.log(`/register-studentNumber > Received activeClassID: ${activeClassID}`);
  console.log(`/register-studentNumber > (startClassID == activeClassID): ${startClassID == activeClassID}`);

  // Check if the student number has already marked attendance
  if (studentNumbers.includes(studentNumber)) {
    console.log(`/register-studentNumber > The student number ${studentNumber} already marked his attendance.`);
    return res.render('response', { msg: 'You already marked your attendance for this class!' });
  }

  // Check if the same class is still active
  if (startClassID != activeClassID) {
    console.log(`/register-studentNumber > The class is not active anymore! You took too long!`);
    return res.render('response', { msg: 'The class is not active anymore! You took too long!' });
  }

  // Find the student ID for the given student number in the class
  findStudentIDinUC(classCourseID, studentNumber, (error, studentID) => {
    if (error) {
      handleError(res, error);
      return;
    }

    // If the student number is not registered in the course, render an error response
    if (!studentID) {
      console.log(`/register-studentNumber > There isn't any student ${studentNumber} registered in the course ${classCourseID}.`);
      return res.render('response', { msg: 'Seems like you are not registered in the course!' });
    }

    // Log the studentID for debugging purposes
    console.log(`/register-studentNumber > The studentNumber ${studentNumber} has a studentID of: ${studentID}`);

    // Check if the table is already occupied by another student
    isTableOccupied(tableID, (error, tableOccupied) => {
      if (error) {
        handleError(res, error);
        return;
      }

      // Log whether the table is occupied or not
      console.log(`/register-studentNumber > Is table ${classroomTable} occupied in room ${classroomID}? : ${tableOccupied}`);

      // If the table is occupied, render an error response
      if (tableOccupied) {
        return res.render('response', { msg: 'It looks like this desk is already being occupied by another student!' });
      }

      // Add a new row to the 'student_logs' table with student's attendance information
      addRowToTable(['student_logs_id', 'student_id', 'class_id', 'time_arrival', 'room_table'], [null, parseInt(studentID, 10), activeClassID, getDateTime(), parseInt(classroomTable, 10)], (error, results) => {
        if (error) {
          handleError(res, error);
          return;
        } else {
          console.log(`/register-studentNumber > [StudentID:${studentID}, classID:${activeClassID}, DateTime:${getDateTime()} , classroomTable:${classroomTable}] added to student_logs table`);
        }
      });

      // Update the status of the table to 'occupied' in the 'room_tables' table
      updateTableStatus(classroomID, classroomTable, 'occupied', (error, results) => {
        if (error) {
          handleError(res, error);
          return;
        } else {
          console.log(`/register-studentNumber > Table ${classroomTable} in classroomID ${classroomID} is now occupied in room_tables table`);
          console.log(`/register-studentNumber > Successful registration!`);

          // Add the phoneID and studentNumber to their respective arrays
          phoneIds.push(phoneID);
          studentNumbers.push(studentNumber);
          
          // Log the updated arrays for debugging purposes
        console.log(`/register-studentNumber > phoneId's = ${phoneIds}`);
        console.log(`/register-studentNumber > Students registered = ${studentNumbers}`);
        }
      });

      // Render a success response after successful registration
      res.render('response', { msg: 'Thanks for your registration!' });
    });
  });

  // Function to handle database-related errors
  function handleError(res, error) {
    console.log(`/register-studentNumber > Database error!` + error);
    res.render('response', { msg: 'We are experiencing problems with our DB, please be patient...' });
  }
}

// Function to get the current date and time in ISO format
const getDateTime = () => {
  const now = new Date();
  return now.toISOString();
};

// Function to check if a classroomName exists in the database
function doesRoomNameExist(classroomName, callback) {
  const query = `SELECT room_id FROM rooms WHERE room_name = ?`;
  const values = [classroomName];

  // Execute the database query
  connection.query(query, values, function (error, results, fields) {
    if (error) {
      // If there's an error, pass it to the callback
      return callback(error, null);
    }

    if (results.length > 0) {
      // If the classroomName exists, pass the corresponding roomID to the callback
      const classroomID = results[0].room_id;
      callback(null, classroomID);
    } else {
      // If the roomName does not exist, pass null to the callback
      callback(null, null);
    }
  });
}

// Function to get the active classID and courseID for a given classroomName
function getActiveClassAndCourseID(classroomName, callback) {
  const query = `SELECT class_id, id_uc FROM classes WHERE class_room = ? AND class_status = 'ativo'`;
  const values = [classroomName];

  // Execute the database query
  connection.query(query, values, function (error, results, fields) {
    if (error) {
      // If there's an error, pass it to the callback
      return callback(error);
    }

    if (results.length > 0) {
      // If an active class exists, pass the activeClassID and courseID to the callback
      const activeClassID = results[0].class_id;
      const courseID = results[0].id_uc;
      callback(null, activeClassID, courseID);
    } else {
      // If there is no active class, pass null for both activeClassID and courseID to the callback
      callback(null, null);
    }
  });
}

// Function to check if a table with a given classroomID and tableNumber exists in the database
function doesTableExists(classroomID, tableNumber, callback) {
  const query = `SELECT room_table_id FROM room_tables WHERE room_id = ? AND table_number = ?`;

  // Execute the database query with classroomID and tableNumber as parameters
  connection.query(query, [classroomID, tableNumber], function (error, results, fields) {
    if (error) {
      // If there's an error, pass it to the callback
      return callback(error);
    }

    if (results.length > 0) {
      // If the table exists, pass the corresponding tableID to the callback
      const tableID = results[0].room_table_id;
      callback(null, tableID);
    } else {
      // If the table does not exist, pass null to the callback
      callback(null, null);
    }
  });
}

// Function to check if a table with a given tableID is occupied in the database
function isTableOccupied(tableID, callback) {
  const query = `SELECT tablet_status FROM room_tables WHERE room_table_id = ?`;

  // Execute the database query with tableID as a parameter
  connection.query(query, [tableID], function (error, results, fields) {
    if (error) {
      // If there's an error, pass it to the callback
      return callback(error);
    }

    if (results.length > 0) {
      // If the table exists, check if it is occupied and pass the result to the callback
      const tableStatus = results[0].tablet_status;
      callback(null, tableStatus === 'occupied');
    } else {
      // If the table does not exist, pass false to the callback
      callback(null, false);
    }
  });
}

// Function to find the studentID in the specified courseID by student number
function findStudentIDinUC(courseID, studentNumber, callback) {
  const query = `SELECT student_id FROM students WHERE id_UC = '${courseID}' AND student_number = '${studentNumber}'`;

  // Execute the database query with courseID and studentNumber
  connection.query(query, function (error, results, fields) {
    if (error) {
      // If there's an error, pass it to the callback
      return callback(error);
    }
    if (results && results.length > 0) {
      // If the student is found in the specified UC, pass the studentID to the callback
      const studentID = results[0].student_id;
      callback(null, studentID);
    } else {
      // If the student is not found in the couse, pass null to the callback
      callback(null, null);
    }
  });
}

// Function to add a row to the student_logs table with given column names and values
function addRowToTable(columnNames, values, callback) {
  const sanitizedValues = values.map(value => connection.escape(value));
  const query = `INSERT INTO student_logs (${columnNames.join(', ')}) VALUES (${sanitizedValues.map(v => '?').join(', ')})`;

  // Execute the database query with sanitized values
  connection.query(query, sanitizedValues, function (error, results, fields) {
    if (error) {
      // If there's an error, pass it to the callback
      return callback(error);
    }

    // If successful, pass the results to the callback
    callback(null, results);
  });
}

// Function to update the status of a table (desk) in the room_tables table
function updateTableStatus(classrooID, classroomTable, status, callback) {
  const query = `UPDATE room_tables SET tablet_status = ? WHERE room_id = ? AND table_number = ?`;
  const values = [status, classrooID, classroomTable];

  // Execute the database query with the specified parameters
  connection.query(query, values, function (error, results, fields) {
    if (error) {
      // If there's an error, pass it to the callback
      return callback(error);
    }

    // If successful, pass the results to the callback
    callback(null, results);
  });
}
