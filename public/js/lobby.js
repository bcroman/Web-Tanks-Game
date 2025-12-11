// lobby.js

// Ensure socket exists (created in index.html)
if (!socket) {
    console.error("Socket not found — ensure index.html creates socket = io();");
}

// Handle Join button click
document.getElementById("joinBtn").onclick = () => {
    const nickname = document.getElementById("nicknameInput").value.trim();
    const color = document.getElementById("selectedColor").value;

    if (nickname.length > 0) {
        socket.emit("joinLobby", { nickname, color });
    }
}

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

// Game Over
socket.on("gameOver", (data) => {
    const winnerName = data.winnerName || data.winnerId || "No winner";
    updateGameOverScreen(winnerName, data.reason);
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

function updateGameOverScreen(winnerName, reason) {
    const winnerText = document.getElementById("winnerText");
    const reasonText = document.getElementById("gameOverReason");

    // Update main winner message
    winnerText.innerText = `Winner: ${winnerName}`;

    // Optional reason text (HP death, disconnect, etc.)
    if (reasonText) {
        reasonText.innerText = reason ? `Reason: ${reason}` : "";
    }

    // Show screen
    document.getElementById("gameCanvas").style.display = "none";
    document.getElementById("gameOverScreen").style.display = "block";

}
