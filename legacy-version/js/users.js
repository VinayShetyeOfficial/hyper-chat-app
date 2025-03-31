const searchBar = document.querySelector(".users .search input"),
	searchBtn = document.querySelector(".users .search button"),
	userList = document.querySelector(".users .users-list"),
	form = document.getElementById("search_user");
let intervalId;

// Add event listener to search button to toggle active class on searchBar and searchBtn
searchBtn.addEventListener("click", (event) => {
	event.preventDefault();
	searchBar.classList.toggle("active");
	searchBtn.classList.toggle("active");
	form.reset();
	searchBar.dispatchEvent(new Event("keyup"))
	searchBar.focus();

	if (searchBar.value !== "") {
		clearInterval(intervalId);
	} else {
		intervalId = setInterval(() => {
			let xhr = new XMLHttpRequest();
			xhr.open("GET", "php/users.php", true);
			xhr.onload = () => {
				if (xhr.readyState === XMLHttpRequest.DONE) {
					if (xhr.status === 200) {
						let data = xhr.response;
						userList.innerHTML = data;
					}
				}
			}
			xhr.send();
		}, 500);
	}
});

// Add event listener to searchBar to send ajax request
searchBar.addEventListener("keyup", () => {
	let searchTerm = searchBar.value;
	console.log(searchTerm);
	// let's start Ajax
	let xhr = new XMLHttpRequest(); // creating XML object
	xhr.open("POST", "php/search.php", true);
	xhr.onload = () => {
		if (xhr.readyState === XMLHttpRequest.DONE) {
			if (xhr.status === 200) {
				let data = xhr.response;
				userList.innerHTML = data;
			}
		}
	}
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.send("searchTerm=" + searchTerm);

	clearInterval(intervalId);

});

// Add event listener to document to remove active class when searchBar loses focus
document.addEventListener("click", (e) => {
	if (!searchBar.contains(e.target) && !searchBtn.contains(e.target) && searchBar.value == "") {
		searchBar.classList.remove("active");
		searchBtn.classList.remove("active");
		form.reset();
		searchBar.dispatchEvent(new Event("keyup"))
		intervalId();
	}
});

intervalId = setInterval(() => {
	let xhr = new XMLHttpRequest();
	xhr.open("GET", "php/users.php", true);
	xhr.onload = () => {
		if (xhr.readyState === XMLHttpRequest.DONE) {
			if (xhr.status === 200) {
				let data = xhr.response;
				userList.innerHTML = data;
			}
		}
	}
	xhr.send();
}, 500);