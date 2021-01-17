const numOfPawns = 8
const rosette = 8
const escapedField = 15
canSendTurn = false

let available = []
let state = []
let plrID
let lastPlr = -1

function leaderLog(items) {
	const table = document.getElementById("leaderboard");

	items.forEach(item => {
		let row = table.insertRow();

		let firstName = row.insertCell(0);
		let lastName = row.insertCell(1);
		let age = row.insertCell(2);
		firstName.innerHTML = item.firstName;
		lastName.innerHTML = item.lastName;
		age.innerHTML = item.age;
	});
}

function pageLog(n, message) {
	document.getElementById("message:" + n).innerHTML = message;
}

function abs(num) {
	if (num < 0) return -1 * num
	else return num
}

function joinGame(gameData) {
	console.log("Connected to Game " + gameData.gameID)
	return new WebSocket("ws://" + gameData.murkerAddr + "/v1/join/" + gameData.gameID)
}

function calcNext(curr, roll) {
	let next = abs(curr)
	next += roll
	if (plrID == 1 && (next < 5 || next == 13 || next == 14)) next *= -1
	return next
}

function checkMoves(data) {
	let available = []

	for (i = 0; i < numOfPawns; i++) {
		let bool = true
		let next = calcNext(data.playerPawns[plrID][i], data.roll)

		for (j = 0; j < numOfPawns; j++) {
			//if (i == j) continue
			if (next != 15 && next == data.playerPawns[plrID][j]) {
				bool = false
				break
			}
		}

		if (next == rosette) {
			for (j = 0; j < numOfPawns; j++) {
				if (data.playerPawns[1 - plrID][j] == rosette) {
					bool = false
					break
				}
			}
		}

		if (next > escapedField) bool = false

		if (bool) available.push(i)
	}

	return available
}

function playTurn(data) {
	available = checkMoves(data)
	console.log("Available: " + available)
	canSendTurn = true;
}

function sendMessage(move) {
	if (!canSendTurn) {
		pageLog(3, "Not your turn yet!")
		console.log("Not your turn yet!")
		return;
	}

	console.log("Mooving that one!")

	let msg = JSON.stringify({
		pawnID: move,
	})

	canSendTurn = false

	socket.send(msg)
}

function skipMove() {
	setTimeout(pageLog(3, "Status: Skipping move"), 2000)
	sendMessage(-1)
}

function mainLoop(gameData) {
	socket = joinGame(gameData)

	socket.onopen = () => {
		data = JSON.stringify({
			key: gameData.key,
			playerID: gameData.playerID,
		})
		socket.send(data)
	}

	socket.onmessage = (event) => {
		console.log("New turn.")

		lastPlr = state.turn

		state = JSON.parse(event.data)
		console.log(state)

		showScore(state)

		if (state.turn == lastPlr)
			if (state.turn == plrID) pageLog(3, "You stepped on a Rosette, you get an extra turn.")
			else pageLog(3, "Opponent stepped on a Rosette, they get an extra turn.")
		else if (state.roll == 0) pageLog(3, "Roll was zero, turn must be skipped.")
		else pageLog(3, "Status: OK")

		pageLog(2, "Roll: " + state.roll)
		if (state.turn == plrID) {
			playTurn(state)
			pageLog(1, "Your turn.")
		} else pageLog(1, "Opponent's turn.")

		drawBoard(state)
	}

	socket.onclose = (event) => {
		if (state.turn == plrID) {
			alert("Congratulations, you win!")
			location.reload()
		}
		if (state.turn == 1 - plrID) {
			alert("You lose!")
			location.reload()
		}
		alert("Connection timed out!")
		location.reload()
	}
}

function createGame(name) {
	let data = JSON.stringify({"nickname":name});

	var xhr = new XMLHttpRequest();

	xhr.addEventListener("readystatechange", function() {
		if(this.readyState === 4) {
			console.log(this.responseText);
		}
	});

	xhr.withCredentials = false;
	xhr.open("POST", "http://localhost:8080/murabi/v1/game", false);
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.send(data);

	return JSON.parse(xhr.response);
}

function getGameID() {
	return "85980270-58c0-11eb-a3a2-3e22fb434d0e"
}

function startGame() {
	let nick = document.getElementById("nickname-input").value

	if (!nick) {
		alert("Insert a nickname!")
		return
	}

	let main = document.getElementById("container")
	let landing = document.getElementById("landing")
	main.style.display = "flex"
	landing.style.display = "none"

	let createResp = createGame(nick)

	plrID = createResp.playerID

	changeLegend()
	mainLoop(createResp)
}

function changeLegend() {
	let elem = document.getElementById("white-pawn")
	if (plrID == 0) elem.innerHTML = "Your pawns";
	else elem.innerHTML = "Opponent's pawns"

	elem = document.getElementById("black-pawn")
	if (plrID == 1) elem.innerHTML = "Your pawns";
	else elem.innerHTML = "Opponent's pawns"
}

function movePawn(id) {
	id = parseInt(id.slice(2))
	let bool = false
	let pawnID

	console.log("movePawn: " + id)

	if (!canSendTurn) {
		console.log("Not your turn yet!")
		pageLog(3, "Not your turn yet!")
		return;
	}

	for (i = 0; i < numOfPawns; i++)
		if (state.playerPawns[plrID][i] == id) {
			bool = true
			pawnID = i
			break
		}

	console.log("pawnID: " + pawnID)

	if (!bool) {
		pageLog(3, "This pawn isn't yours.")
		console.log("This pawn isn't yours.")
		return;
	}

	if (available.indexOf(pawnID) == -1) {
		pageLog(3, "Can't move this pawn.")
		console.log("Can't move this pawn.")
		return;
	}

	sendMessage(pawnID)
}

function initPawn(id) {
	id = parseInt(id.slice(2)) - 1

	if (!canSendTurn) {
		console.log("Not your turn yet!")
		console.log("Not your turn yet!")
		return;
	}

	if (available.indexOf(id) == -1) {
		pageLog(3, "Can't move this pawn.")
		console.log("Can't move this pawn.")
		return;
	}

	sendMessage(id)
}

function drawBoard(state) {
	let array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, -1, -2, -3, -4, -13, -14]

	let border = "#424242"
	let availableBorder = "#d35400"

	array.forEach(function (element) {
		let id = "B:" + element
		let elem = document.getElementById(id)
		elem.style.display = "none"
	})

	for (i = 1; i <= numOfPawns; i++) {
		let id = "S:" + i
		let elem = document.getElementById(id)
		elem.style.display = "none"
	}

	for (i = 0; i < 2; i++) {
		let color;
		if (i == 0) color = "#fff"
		else color = "#000"

		for (j = 0; j < numOfPawns; j++) {
			let zone = state.playerPawns[i][j]
			if (zone == 0 && i == plrID) {
				let elem = document.getElementById("S:" + (j + 1))
				elem.style.display = "block"
				elem.style.backgroundColor = color
				if (state.turn == plrID && i == plrID && available.indexOf(j) != -1) elem.style.borderColor = availableBorder
				else elem.style.borderColor = border
			}
			else if (zone != 0 && zone != 15) {
				let elem = document.getElementById("B:" + zone)
				elem.style.display = "block"
				elem.style.backgroundColor = color
				if (state.turn == plrID && i == plrID && available.indexOf(j) != -1) elem.style.borderColor = availableBorder
				else elem.style.borderColor = border
			}
		}
	}
}

function showScore(state) {
	let score = [0, 0]
	for (i = 0; i < 2; i++)
		for (j = 0; j < numOfPawns; j++) {
			if (state.playerPawns[i][j] == 15)
				score[i]++;
		}
	document.getElementById("score").innerHTML = "Score - You: " + score[plrID] + ", Opponent: " + score[1 - plrID]
}

function initBoard() {
	state.turn = -1

	let array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, -1, -2, -3, -4, -13, -14]

	array.forEach(function (element) {
		let elem = document.getElementById("B:" + element)
		elem.style.display = "none"
		elem.addEventListener("click", function () { movePawn(this.id) })
	})

	for (i = 1; i <= numOfPawns; i++) {
		let elem = document.getElementById("S:" + i)
		elem.style.display = "none"
		elem.addEventListener("click", function () { initPawn(this.id) })
	}
}

initBoard()
