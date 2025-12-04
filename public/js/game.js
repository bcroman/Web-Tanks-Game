let staticObjects = [];
let dynamicObjects = [];

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Receive initial world objects
socket.on("worldInit", (data) => {
    staticObjects = data.static;
    dynamicObjects = data.dynamic;
    console.log("World initialized:", data);
});