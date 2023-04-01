function handleSubmit(event) {
  // Prevent the default form submission behavior
  event.preventDefault();

  // Display the QR code scanner and hide the form
  document.getElementById("qr-scan").style.display = "flex";
  document.getElementById("form-student-number").style.display = "none";
  document.getElementById("title").innerHTML = "Scan the QR CODE";

  // Get the value of the student number input field
  const studentNumber = document.querySelector('#student-number').value;

  // Get or generate the machine ID
  let machineID = localStorage.getItem('MachineId');
  if (!machineID) {
    // Generate a random UUID and store it in local storage
    machineID = crypto.randomUUID();
    localStorage.setItem('MachineId', machineID);
  }

  // Set up the HTML5 QR code scanner
  const html5QrCode = new Html5Qrcode("reader");
  const config = { fps: 10, qrbox: { width: 250, height: 250 } };

  // Define the success callback for when a QR code is scanned
  const qrCodeSuccessCallback = (decodedText, decodedResult) => {
    document.getElementById("scan-result").style.display = "flex";

    // Send the attendance data to the server 
    const request = decodedText + studentNumber + "/" + machineID;
    fetch(request, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        // handle the response
      })
      .catch(error => {
        document.getElementById("title").innerHTML = "An error has occurred!";
      });

    // Stop the QR code scanner
    html5QrCode.stop();
    document.getElementById("title").innerHTML = "Presence successfully registered!";
  };

  // Start the HTML5 QR code scanner with the success callback
  html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback);
}
