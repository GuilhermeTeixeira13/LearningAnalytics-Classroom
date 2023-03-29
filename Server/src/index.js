const express = require('express');
const https = require('https');
const fs = require('fs');

const app = express();
app.use(express.static('static'));
app.use(express.json());

let registos = [];

// APLICAR MIDDLEWARES

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/table/:tablenumber/:studentnumber/:machineId', (req, res) => {
  let studentnumber =req.params.studentnumber;
  let tablenumber = req.params.tablenumber;
  let machineId = req.params.machineId;
  
  const registo = {"data":"27-03-2023", "hora":"11:14", "aula":"Redes de Computadores", "num":studentnumber, "table":tablenumber, "idMaquina":machineId};
  registos.push(registo);
  
  //DATA SER ENVIADA PARA UMA BD LOCAL OU CLOUD
  return res.status(200).json(registo);
});

app.get('/table' , (req, res) => {
  const allRegistos = registos;
  return res.status(200).json(registos); 
});

const options = {
  key: fs.readFileSync('/home/guilherme/Desktop/IoT_Attendance_Project/Server/src/server.key'),
  cert: fs.readFileSync('/home/guilherme/Desktop/IoT_Attendance_Project/Server/src/server.cert')
};

https.createServer(options, app).listen(3333, () => {
  console.log('Server is running on port 3333');
});
