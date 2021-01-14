const numOfPawns = 8
const rosette = 8
const escapedField = 15
canSendTurn = false


function abs(num) {
	if (num < 0) return -1*num
	else return num
}

function joinGame(gameID){
	console.log("Connected to Game "+gameID)
	return new WebSocket("ws://localhost:8080/join/"+gameID)
}

function postGame() {
	let myHeaders = new Headers();
	myHeaders.append("Content-Type", "application/json");
	 
	let raw = JSON.stringify({"key":"my-key"});
	let res 
	
	let requestOptions = {
	  method: 'POST',
	  headers: myHeaders,
	  body: raw,
	  redirect: 'follow'
	};

	fetch("http://localhost:8080/game", requestOptions)
		  .then(response => response.text())
		  .then(result => {console.log(result); return result})
		  .catch(error => console.log('error', error))
}

function checkMoves(data) {
	let available = []

	for (i = 0; i < numOfPawns; i++) {
		let bool = true
		let next = abs(data.playerPawns[plrID][i])

		next += data.roll
		if (plrID==1 && (next < 5 || next == 13 || next == 14)) next *= -1
		
		console.log(plrID, i, next, data.roll)

		for(j = 0; j < numOfPawns; j++) {
			if (i==j) continue
			if (next==data.playerPawns[plrID][j]) {
				bool = false
				break
			}
		}

		if (next==rosette) {
			for(j = 0; j < numOfPawns; j++) {
				if (data.playerPawns[1-plrID][j]==rosette) {
					bool = false
					break
				}
			}
		}

		if (next > escapedField) bool = false

		if(bool) available.push(i)
	}

	return available
}

function playTurn(data) {

	if(data.roll == 0) {
		let msg = JSON.stringify({
			pawnID: move,
		})
	
		socket.send(msg)
	}

	available = checkMoves(data)
	console.log("Available: " + available)
	console.log(data)
	canSendTurn = true;
}

function sendMessage() {
	if(!canSendTurn) {
		console.log("Not your turn yet!")
		return;
	}

	let move = parseInt(document.getElementById("plrID").value)
	let bool = false

	for (i of available) {
		if(move==i) bool = true
	} 

	if(!bool) {
		console.log("Can't move that one!")
		return;
	}

	console.log("Mooving that one!")

	let msg = JSON.stringify({
			pawnID: move,
	})

	canSendTurn = false

	socket.send(msg)
}

function mainLoop() {
	plrID = parseInt(document.getElementById("plrID").value)
	console.log(plrID);
	let gameKey = getGameKey()
	socket = joinGame(gameKey)
	let state

	socket.onopen = () => {
		data = JSON.stringify({
			key: "my-key",
			playerID: plrID,
		})
		socket.send(data)
	}
	  
	socket.onmessage  = (event) => {
		console.log("New turn.")
		state = JSON.parse(event.data)
		console.log(state)
		if (state.turn==plrID) playTurn(state)
	}
	  
	// socket.onclose = function(event) {
	// 	if (event.wasClean) {
	// 	  alert(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
	// 	} else {
	// 	  // e.g. server process killed or network down
	// 	  // event.code is usually 1006 in this case
	// 	  alert('[close] Connection died');
	// 	}
	// };
	  
	// socket.onerror = function(error) {
	// 	alert(`[error] ${error.message}`);
	// };
}

function getGameKey() {
	return "25a65da0-56ba-11eb-bdc1-00d861fbbd1d"
}

mainLoop();

// TODO LIST:
// client-side move validation
// send move message 
// json parser
// client side authentication
// automate roll 0
