// Movement Data
let inputState = {
    left: false,
    right: false
};

// Key Listeners
// Key Down - Move Left/Right
document.addEventListener("keydown", (e) => {
    if (e.key === "a" || e.key === "ArrowLeft") inputState.left = true;
    if (e.key === "d" || e.key === "ArrowRight") inputState.right = true;
});

// Key Up - Stop Moving Left/Right
document.addEventListener("keyup", (e) => {
    if (e.key === "a" || e.key === "ArrowLeft") inputState.left = false;
    if (e.key === "d" || e.key === "ArrowRight") inputState.right = false;
});

// Send Data To Server 
setInterval(() => {
    socket.emit("input", inputState);
}, 60);