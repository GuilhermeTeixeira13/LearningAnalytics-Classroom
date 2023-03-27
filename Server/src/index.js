
const express = require('express');
const app = express();
app.use(express.static('static'));
app.use(express.json());

// APLICAR MIDDLEWARES

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

app.get('/table/:studentnumber/:tablenumber', (req, res) => {
	let studentnumber=req.params.studentnumber;
	let tablenumber= req.params.tablenumber;
	
	let data= {
		"data":"27-03-2023",
		"hora": "11:14",
		"class":"Redes de Computadores",
		"stdNumb":studentnumber,
		"tableN":tablenumber
	}
	
	//DATA SER ENVIADA PARA UMA BD LOCAL OU CLOUD
	res.send(data)
});

app.listen(3333, () => console.log('Server is running'));
