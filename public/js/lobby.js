// lobby.js

// Ensure socket exists (created in index.html)
if (!socket) {
    console.error("Socket not found — ensure index.html creates socket = io();");
}

// Handle Join button click
document.getElementById("joinBtn").onclick = () => {
    const nickname = document.getElementById("nicknameInput").value.trim();
    if (nickname.length > 0) {
        socket.emit("joinLobby", nickname);
    }
};

// When server confirms lobby join
socket.on("lobbyJoined", (players, requiredPlayers) => {
    showLobby(players, requiredPlayers);
});

// Update lobby when players join/leave
socket.on("lobbyUpdate", (players, requiredPlayers) => {
    updateLobby(players, requiredPlayers);
});

// Start game when server says so
socket.on("startGame", () => {
    document.getElementById("lobbyScreen").style.display = "none";
    document.getElementById("gameCanvas").style.display = "block";

    if (typeof startGame === "function") {
        startGame();
    } else {
        console.error("startGame() is not defined in game.js");
    }
});


// Update UI Elements
function showLobby(players, requiredPlayers) {
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("lobbyScreen").style.display = "block";

    updateLobby(players, requiredPlayers);
}

function updateLobby(players, requiredPlayers) {
    const status = `Players in lobby: ${players.length}/${requiredPlayers}`;
    document.getElementById("lobbyStatus").innerText = status;
}
