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
		// Parse the response HTML into a Document object
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');

		// Get the head and body elements from the Document object
		const head = doc.head;
		const body = doc.body;
		
		// Clear the current page's head and body elements
		document.head.innerHTML = '';
		document.body.innerHTML = '';

		// Append the new head and body elements to the current page
		document.head.appendChild(head);
		document.body.appendChild(body);
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
	
	if (studentNumber) {
		fetch('/register-studentNumber', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ studentNumber, phoneID })
		})
		.then(response => response.text())
		.then(html => {
			// Parse the response HTML into a Document object
			const parser = new DOMParser();
			const doc = parser.parseFromString(html, 'text/html');

			// Get the head and body elements from the Document object
			const head = doc.head;
			const body = doc.body;
			
			// Clear the current page's head and body elements
			document.head.innerHTML = '';
			document.body.innerHTML = '';

			// Append the new head and body elements to the current page
			document.head.appendChild(head);
			document.body.appendChild(body);
		})
		.catch(error => {
			console.error('Error:', error);
		});
	} else {
		window.alert('Student number is empty!');
	}

	
	

}
