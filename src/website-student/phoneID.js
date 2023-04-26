let phoneID;

window.onload = function() {
	// Get or generate the machine ID
	phoneID = localStorage.getItem('phoneID');
	if (!phoneID) {
		// Generate a random UUID and store it in local storage
		phoneID = crypto.randomUUID();
		localStorage.setItem('phoneID', phoneID);
	}
	
	fetch('/verify-phoneID', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ phoneID })
	})
	.then(response => response.text())
	.then(html => {
		// Create a new HTML element and insert the response HTML
		const container = document.createElement('div');
		container.innerHTML = html;

		document.body.innerHTML = '';
		
		// Append the element to the DOM	
		document.body.appendChild(container);
	})
	.catch(error => {
		console.error('Error:', error);
	});

}


// Register attendance
function handleSubmit(event) {
	// Prevent the default form submission behavior
	event.preventDefault();
	
	const studentNumberInput = document.getElementById('student-number');
	const studentNumber = studentNumberInput.value;
	
	
	fetch('/register-studentNumber', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ studentNumber, phoneID })
	})
	.then(response => response.text())
	.then(html => {
		// Create a new HTML element and insert the response HTML
		const container = document.createElement('div');
		container.innerHTML = html;

		document.body.innerHTML = '';

		// Append the element to the DOM	
		document.body.appendChild(container);
	})
	.catch(error => {
		console.error('Error:', error);
	});
}
