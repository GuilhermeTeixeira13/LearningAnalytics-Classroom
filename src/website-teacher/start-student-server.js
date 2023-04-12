function startStudentServer(){
	const xhr = new XMLHttpRequest();
    xhr.open('GET', '/start-new-server');
    xhr.onload = function() {
		console.log(xhr.responseText);
    };
    xhr.send();	
}
