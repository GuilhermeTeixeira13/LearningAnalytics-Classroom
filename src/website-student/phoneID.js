let phoneID;

window.onload = function() {
	// Get or generate the machine ID
	phoneID = localStorage.getItem('phoneID');
	if (!phoneID) {
		// Generate a random UUID and store it in local storage
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
        // Replace the content of the current page with the response HTML
        document.documentElement.innerHTML = html;
      });
    })
    .catch(error => {
      console.error('Error:', error);
    });

}





