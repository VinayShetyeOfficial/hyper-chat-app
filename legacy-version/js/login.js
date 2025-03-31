const form = document.querySelector(".login form"),
	continueBtn = form.querySelector(".button input"),
	errorText = form.querySelector(".error-txt");

form.onsubmit = (e) => {
	e.preventDefault(); //  prevents the form from submitting and refreshing the page
}

continueBtn.onclick = () => {
	// let' start Ajax 
	let xhr = new XMLHttpRequest(); // creating XML Object
	xhr.open("POST", "php/login.php", true);
	xhr.onload = () => {
		if (xhr.readyState === XMLHttpRequest.DONE) {
			if (xhr.status === 200) {
				let data = xhr.response;

				if (data.indexOf("success") != -1) {
					location.href = "user.php";
				} else {
					errorText.style.display = "block";
					errorText.textContent = data;
				}
			}
		}
	}
	// we have to send the form data to the php file 
	let formData = new FormData(form); //creating new formData Object
	xhr.send(formData); //sending formData to the php file
}