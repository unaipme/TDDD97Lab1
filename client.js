const minPSWChars = 8

displayView = function() {
	// the code required to display a view
	
};

var token = null;
var loggedUser = null;
var browseUser = null;
window.onload = function() {
	
	if (localStorage.getItem("UserToken") === null)
		document.getElementById("MBody").innerHTML = document.getElementById("WelcomeView").innerHTML;
	else {
		document.getElementById("MBody").innerHTML = document.getElementById("ProfileView").innerHTML;
		token = localStorage.getItem("UserToken");
		loggedUser = serverstub.getUserDataByToken(token).data;
		prepareHomePanel(false, loggedUser);
		refreshMessageWall(false, loggedUser);
	}
	
	if (localStorage.getItem("PendingSuccess") !== null) {
		addToSuccessDisplay(localStorage.getItem("PendingSuccess"));
		localStorage.removeItem("PendingSuccess");
	}
}

function addToErrorDisplay(txt) {
	console.log(txt);
	var err = document.getElementById("ErrorDisplay");
	err.innerHTML = txt;
	err.style.display = "initial";
	setTimeout( function() {document.getElementById("ErrorDisplay").style.display = "none";}, 7000);
}

function addToSuccessDisplay(txt) {
	console.log(txt);
	var succ = document.getElementById("SuccessDisplay");
	succ.innerHTML = txt;
	succ.style.display = "initial";
	setTimeout( function() {document.getElementById("SuccessDisplay").style.display = "none";}, 7000);
}

function passwordValidation(pswID, rpswID) {
	var psw = document.getElementById(pswID).value;
	var rpsw = document.getElementById(rpswID).value;
	
	var ret = (psw == rpsw) && psw.length > minPSWChars;
	if (!ret) addToErrorDisplay("The password must be at least 8 characters long, or it wasn\'t correctly copied.");
	
	return ret;
}

function signUp() {
	var info = new function() {
		this.email = document.getElementById("Email").value;
		this.password = document.getElementById("Password").value;
		this.firstname = document.getElementById("FirstName").value;
		this.familyname = document.getElementById("FamilyName").value;
		this.gender = document.getElementById("Gender").value;
		this.city = document.getElementById("City").value;
		this.country = document.getElementById("Country").value;
	};
	
	console.log("Signing user up");
	
	var resp = serverstub.signUp(info);
	if (!resp.success) {
		addToErrorDisplay(resp.message);
		return false;
	} else {
		resp = signIn(info.email, info.password);
		return resp.success;
	}
}

function signIn(user, pass) {
	var username = user || document.getElementById("LoginEmail").value;
	var password = pass || document.getElementById("LoginPassword").value;
	
	console.log("Signing user in: "+username);
	
	var resp = serverstub.signIn(username, password);
	if (!resp.success) addToErrorDisplay(resp.message);
	else localStorage.setItem("PendingSuccess", resp.message);
	
	localStorage.setItem("UserToken", resp.data);
	
	return resp.success;
}

function signOut() {
	localStorage.removeItem("UserToken");
	serverstub.signOut(token);
	return true;
}

var panels = {"AccountTab": "AccountPanel", "HomeTab": "HomePanel", "BrowseTab": "BrowsePanel"};
function tabClick(id) {
	document.getElementsByClassName("selected")[0].className = "tab";
	document.getElementById(id).className += " selected";
	
	var pId = panels[id];	
	document.getElementsByClassName("shown")[0].className = "panel";
	document.getElementById(pId).className += " shown";
}

function changePassword() {
	var oldPass = document.getElementById("CurrentPassword").value;
	var newPass = document.getElementById("NewPassword").value;
	
	var resp = serverstub.changePassword(token, oldPass, newPass);
	if (!resp.success) addToErrorDisplay(resp.message);
	else localStorage.setItem("PendingSuccess", resp.message);
	
	return resp.success;
}

function prepareHomePanel(search, user) {
	var dif = "";
	if (search) dif = "O";
	document.getElementById(dif + "FirstNameS").innerHTML = user.firstname;
	document.getElementById(dif + "FamilyNameS").innerHTML = user.familyname;
	document.getElementById(dif + "GenderS").innerHTML = user.gender;
	document.getElementById(dif + "CityS").innerHTML = user.city;
	document.getElementById(dif + "CountryS").innerHTML = user.country;
	document.getElementById(dif + "EmailS").innerHTML = user.email;
}

function postOnWall(user, search) {
	if (search) var txt = document.getElementById("OMessageContent").value;
	else var txt = document.getElementById("MessageContent").value;
	if (txt == "") {
		addToErrorDisplay("The posts can't be empty");
		return;
	}
	document.getElementById("MessageContent").value = "";
	var resp = serverstub.postMessage(token, txt, user.email);
	if (!resp.success) addToErrorDisplay(resp.message);
	else {
		addToSuccessDisplay(resp.message);
		refreshMessageWall(search, user);
	}
	return resp.success;
}

function createMessageElement(txt, author) {
	var msg = document.createElement("DIV");
	msg.className = "UserPost";
	var name = document.createElement("SPAN");
	name.className = "PosterName";
	name.innerHTML = author + " ";
	var body = document.createElement("SPAN");
	body.className = "MessageBody";
	body.innerHTML = txt;
	msg.appendChild(name);
	msg.appendChild(body);
	return msg;
}

function refreshMessageWall(search, user) {
	var resp = serverstub.getUserMessagesByEmail(token, user.email);
	var msgs = {};
	var wall;
	if (search) wall = document.getElementById("OPostShowcase");
	else wall = document.getElementById("PostShowcase");
	while (wall.firstChild) wall.removeChild(wall.firstChild);
	if (resp.success) msgs = resp.data;
	else addToErrorDisplay(resp.message);
	for (var i=0; i<msgs.length; i++)
		wall.appendChild(createMessageElement(msgs[i].content, msgs[i].writer));
}

function searchUser() {
	var term = document.getElementById("SearchTerm").value;
	var resp = serverstub.getUserDataByEmail(token, term);
	if (!resp.success) {
		addToErrorDisplay(resp.message);
		return;
	}
	browseUser = resp.data;
	prepareHomePanel(true, browseUser);
	refreshMessageWall(true, browseUser);
}