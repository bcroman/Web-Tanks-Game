// Movement Data
let inputState = {
    left: false,
    right: false,
    aimUp: false,
    aimDown: false
};

// Key Listeners
// Key Down - Move Left/Right
document.addEventListener("keydown", (e) => {
    if (e.key === "a" || e.key === "ArrowLeft") inputState.left = true;
    if (e.key === "d" || e.key === "ArrowRight") inputState.right = true;
    if (e.key === "ArrowUp" || e.key === "w") inputState.aimUp = true;
    if (e.key === "ArrowDown" || e.key === "s") inputState.aimDown = true;
});

// Key Up - Stop Moving Left/Right
document.addEventListener("keyup", (e) => {
    if (e.key === "a" || e.key === "ArrowLeft") inputState.left = false;
    if (e.key === "d" || e.key === "ArrowRight") inputState.right = false;
    if (e.key === "ArrowUp" || e.key === "w") inputState.aimUp = false;
    if (e.key === "ArrowDown" || e.key === "s") inputState.aimDown = false;
});

// Send Data To Server 
setInterval(() => {
    socket.emit("input", inputState);
}, 60);