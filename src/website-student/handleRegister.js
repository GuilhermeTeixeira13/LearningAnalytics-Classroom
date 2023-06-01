function handleSubmit(event) {
  event.preventDefault();

  const studentNumberInput = document.getElementById('student-number');
  const studentNumber = studentNumberInput.value;
  const roomTable = document.getElementById('roomTable').innerHTML;
  const roomID = document.getElementById('roomID').innerHTML;
  const tableID = document.getElementById('tableID').innerHTML;
  const classActiveStart = document.getElementById('classActiveID').innerHTML;

  if (/^[a-zA-Z]\d+$/.test(studentNumber)) {
    const formattedStudentNumber = studentNumber.charAt(0).toUpperCase() + studentNumber.slice(1);

    fetch('/register-studentNumber', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ studentNumber: formattedStudentNumber, phoneID, roomTable, roomID, tableID, classActiveStart })
    })
    .then(response => {
      response.text().then(html => {
        document.documentElement.innerHTML = html;
      });
    })
    .catch(error => {
      console.error('Error:', error);
    });
  } else {
    window.alert('The student number must start with a letter followed by one or more digits.');
  }
}
