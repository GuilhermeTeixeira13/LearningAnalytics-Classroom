let phoneID;

window.onload = function() {
	phoneID = localStorage.getItem('phoneID');
	if (!phoneID) {
		phoneID = uuidv4();
		localStorage.setItem('phoneID', phoneID);
	}
	
	fetch('/verify-phoneID', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ phoneID })
	})
	.then(response => {
      response.text().then(html => {
        document.documentElement.innerHTML = html;
      });
    })
    .catch(error => {
      console.error('Error:', error);
    });
}







