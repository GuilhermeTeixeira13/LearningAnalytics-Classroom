// Function to handle form submission
function handleSubmit(event) {
  // Prevent the default form submission behavior
  event.preventDefault();

  // Get the input element for the student number from the form
  const studentNumberInput = document.getElementById('student-number');
  // Get the value of the student number entered by the user
  const studentNumber = studentNumberInput.value;

  // Get the classroomTable, classroomID, tableID, classActiveStart from the corresponding HTML element
  const classroomTable = document.getElementById('classroomTable').innerHTML;
  const classroomID = document.getElementById('classroomID').innerHTML;
  const tableID = document.getElementById('tableID').innerHTML;
  const classActiveStart = document.getElementById('activeClassID').innerHTML;

  // Regular expression to validate the student number format
  if (/^[a-zA-Z]\d+$/.test(studentNumber)) {
    // Format the student number to start with an uppercase letter followed by digits
    const formattedStudentNumber = studentNumber.charAt(0).toUpperCase() + studentNumber.slice(1);

    // Send a POST request to the server to register the student number
    fetch('/register-studentNumber', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ studentNumber: formattedStudentNumber, phoneID, classroomTable, classroomID, tableID, classActiveStart })
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
  } else {
    // If the student number format is invalid, show an alert to the user
    window.alert('The student number must start with a letter followed by one or more digits.');
  }
}
