
const express = require('express');
const app = express();
app.use(express.static('static'));
app.use(express.json());

let registos = [];

// APLICAR MIDDLEWARES

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

app.post('/table/:tablenumber/:studentnumber/:machineId', (req, res) => {
	console.log("recebi um request");
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

app.listen(3333, () => console.log('Server is running'));
