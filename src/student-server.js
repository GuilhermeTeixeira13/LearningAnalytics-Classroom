const express = require('express');
const https = require('https');
const fs = require('fs');
const mime = require('mime');
const path = require('path');

const app = express();
app.use(express.json());

let phoneIds = []; 
let classActive = null;
let classLast = null;
let roomID = null;
let roomTable = null;

app.get('/:roomID/:table', (req, res) => {
  roomID = req.params.roomID;
  roomTable = req.params.table;
  
  console.log("Room: " + roomID);
  console.log("Table: " + roomTable);
  
  // Veriicar se o roomID existe na BD
  const roomIDexists = true; // Função que retorna true se o roomID existe na BD

  if (roomIDexists === true) {
    // roomID existe
    
    // Verificar se alguma class daquela sala está ativa
    classActive = 3; // Função que retorna o classID, se for null é pq n há nenhuma ativa
    
    
    if ( classActive != classLast) {
        phoneIds = [];
        classLast = classActive;
    }
    
    if (classActive === null) {
      // Não existe nenhuma class ativa
      
      res.sendFile(__dirname + '/website-student/no-class.html');
    } else {
      // Existe uma class ativa
  
      res.sendFile(__dirname + '/website-student/index.html');
    }
  } else {
    // roomID não existe
    
    res.sendFile(__dirname + '/website-student/no-room.html');
  }

});

app.post('/verify-phoneID', (req, res) => {
  const { phoneID } = req.body;
  console.log(`Verification -> Received phoneID: ${phoneID}`);
  
  if (phoneIds.includes(phoneID)) {
    // O estudante já fez o registo de uma presença com o seu dispositivo
    console.log(`Verification - O estudante já fez o registo de uma presença com o seu dispositivo`);

    res.sendFile(path.join(__dirname, '/website-student/already-registred.html'));
  } 
});

app.post('/register-studentNumber', (req, res) => {
  const { studentNumber, phoneID } = req.body;
  console.log(`Register - Received studentNumber: ${studentNumber}, phoneID: ${phoneID}`);
  
  // Verificar se existe na BD
  const studentID = 3; // Função que retorna o studentID, se for null é pq n existe
  
  if ( studentID === null ) {
      // O estudante que se está a tentar registar não está registado naquela aula
      
      console.log(`O estudante que se está a tentar registar não está registado naquela aula`);

      res.sendFile(path.join(__dirname, '/website-student/not-in-the-class.html'));
  } else {
    phoneIds.push(phoneID);
    
    console.log(`Registado com sucesso! -> phoneIds: ` + phoneIds);
    
    // Mudar tableStatus para ativo - roomID, roomTable
    
    // Adicionar à tabela das presenças -studentID, classID

    res.sendFile(path.join(__dirname, '/website-student/successful-registration.html'));
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



