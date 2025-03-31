const form = document.querySelector(".typing-area"),
	inputField = document.querySelector(".input-field"),
	sendBtn = form.querySelector("#send"),
	chatBox = document.querySelector(".chat-box");

form.onsubmit = (e) => {
	e.preventDefault(); // preventing the form from getting submitted
}

sendBtn.onclick = () => {
	// let' start Ajax 
	let xhr = new XMLHttpRequest(); // creating XML Object
	xhr.open("POST", "php/insert-chat.php", true);
	xhr.onload = () => {
		if (xhr.readyState === XMLHttpRequest.DONE) {
			if (xhr.status === 200) {
				inputField.value = ""; // clear the input field once the message is sent
			}
		}
	}

	// we have to send the form data to the php file 
	let formData = new FormData(form); //creating new formData Object
	xhr.send(formData); //sending formData to the php file
}

chatBox.onmouseenter = () => {
	chatBox.classList.add("active");
}

chatBox.onmouseleave = () => {
	chatBox.classList.remove("active");
}

setInterval(() => {
	console.log('triggred');
	// let's start Ajax
	let xhr = new XMLHttpRequest(); // creating XML object 
	xhr.open("POST", "php/get-chat.php", true);
	xhr.onload = () => {
		if (xhr.readyState === XMLHttpRequest.DONE) {
			if (xhr.status === 200) {
				let data = xhr.response;
				chatBox.innerHTML = data;
				if (!chatBox.classList.contains("active")) {
					scrollToBottom();
				}
			}
		}
	}

	// we have to send the form data to the php file 
	let formData = new FormData(form); //creating new formData Object
	xhr.send(formData); //sending formData to the php file
}, 500);

function scrollToBottom() {
	chatBox.scrollTop = chatBox.scrollHeight;
}