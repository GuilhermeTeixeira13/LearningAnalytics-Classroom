function startStudentServer(){
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/start-new-server');
    xhr.onload = function() {
	console.log(xhr.responseText);
    };
    xhr.send();	
    
    const startBtn = document.getElementById("start-server");
    startBtn.style.display = "none";
    
    const closeBtn = document.getElementById("close-server");
    closeBtn.style.display = "flex";
}

function closeStudentServer(){
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/stop-server');
    xhr.onload = function() {
	console.log(xhr.responseText);
    };
    xhr.send();	
    
    const closeBtn = document.getElementById("close-server");
    closeBtn.style.display = "none";
}
