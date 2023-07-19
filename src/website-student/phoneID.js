// Variable to store the phoneID
let phoneID;

// Function that runs when the window loads
window.onload = function () {
	// Attempt to retrieve the phoneID from the local storage
	phoneID = localStorage.getItem('phoneID');

	// If the phoneID is not available in the local storage, generate a new one using uuidv4 and store it in local storage
	if (!phoneID) {
		phoneID = uuidv4();
		localStorage.setItem('phoneID', phoneID);
	}

	// Send a POST request to the server to verify the phoneID
	fetch('/verify-phoneID', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ phoneID })
	})
		.then(response => {
			// Once the response is received, extract the HTML content from the response body
			response.text().then(html => {
				// Replace the entire HTML content of the page with the received HTML
				document.documentElement.innerHTML = html;
			});
		})
		.catch(error => {
			// Handle any errors that occur during the request
			console.error('Error:', error);
		});
}








