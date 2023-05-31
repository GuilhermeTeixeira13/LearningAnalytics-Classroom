function handleSubmit(event) {
  // Prevent the default form submission behavior
  event.preventDefault();

  const studentNumberInput = document.getElementById('student-number');
  const studentNumber = studentNumberInput.value;
  const roomTable = document.getElementById('roomTable').innerHTML;
  const roomID = document.getElementById('roomID').innerHTML;
  const tableID = document.getElementById('tableID').innerHTML;

  // Check if studentNumber matches the required pattern
  if (/^[a-zA-Z]\d+$/.test(studentNumber)) {
    // Capitalize the first letter of the studentNumber
    const formattedStudentNumber = studentNumber.charAt(0).toUpperCase() + studentNumber.slice(1);

    fetch('/register-studentNumber', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ studentNumber: formattedStudentNumber, phoneID, roomTable, roomID, tableID })
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
}
