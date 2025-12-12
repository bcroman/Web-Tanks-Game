let staticObjects = [];
let dynamicObjects = [];
let isRendering = false;

let cameraX = 0;
let cameraY = 0;
let zoom = 1;
let targetZoom = 1;

let zoomingToWinner = false;
let winnerId = null;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Socket Connection
socket.on("connect", () => {
    console.log("Connected to server.");
})

// Receive initial world objects
socket.on("worldInit", (data) => {
    console.log("World initialized:", data);

    // Reset arrays
    staticObjects = data.static;
    dynamicObjects = data.dynamic;

    // Save map name
    currentMapName = data.mapName;
});
// Function to Receive Dynamic Objects
socket.on("dynamicUpdate", (state) => {

    // Update or add objects from server
    state.forEach(update => {
        let obj = dynamicObjects.find(o => o.id === update.id);

        if (!obj) {
            // New Object
            dynamicObjects.push({
                id: update.id,
                x: update.x,
                y: update.y,
                angle: update.angle,
                radius: update.radius,
                width: update.width,
                height: update.height,
                type: update.type,
                turretAngle: update.turretAngle,
                hp: update.hp,
                color: update.color
            });
        } else {
            // Update Object
            obj.x = update.x;
            obj.y = update.y;
            obj.angle = update.angle;
            obj.turretAngle = update.turretAngle,
            obj.hp = update.hp;
        }
    });

    // Delete objects not present on server
    dynamicObjects = dynamicObjects.filter(localObj =>
        state.some(serverObj => serverObj.id === localObj.id)
    );
});

// Function to Draw Static Boxes
function drawStaticObjects() {
    staticObjects.forEach(obj => {
        ctx.fillStyle = "#888";

        ctx.fillRect(
            obj.x - obj.width / 2,
            obj.y - obj.height / 2,
            obj.width,
            obj.height
        );
    });
}

// Function to Draw dynamic Boxes
function drawDynamicBoxes(obj) {
    ctx.save();
    ctx.translate(obj.x, obj.y);

    // Draw Box
    ctx.fillStyle = "red";
    ctx.fillRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height);

    ctx.restore();
}

// Function to Draw Dynamic Circles
function drawDynamicCircles(obj) {
    ctx.save();
    ctx.translate(obj.x, obj.y);

    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(0, 0, obj.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// Function to Draw Tank
function drawTank(obj) {
    ctx.save();
    ctx.translate(obj.x, obj.y);

    // Draw Body
    ctx.fillStyle = obj.color || "blue";
    ctx.fillRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height);

    // Draw Lost Health
    ctx.fillStyle = "red";
    ctx.fillRect(-obj.width / 2, -obj.height / 2 - 15, obj.width, 6);

    // Draw Current Health
    ctx.fillStyle = "lime";
    let hpPercent = Math.max(obj.hp, 0) / 100;
    ctx.fillRect(-obj.width / 2, -obj.height / 2 - 15, obj.width * hpPercent, 6);

    let turretOffsetY = -obj.height / 2;
    ctx.translate(0, turretOffsetY);

    const canvasAngle = (obj.turretAngle + 180) * Math.PI / 180;
    ctx.rotate(canvasAngle);

    // Draw Turret
    ctx.fillStyle = obj.color || "blue";
    ctx.fillRect(0, -5, 40, 10);

    ctx.restore();
}

// Function to Draw Bullets
function drawBullet(obj) {
    ctx.save();
    ctx.translate(obj.x, obj.y);
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(0, 0, obj.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// Function to Draw all dynamic objects
function drawDynamicObjects() {
    dynamicObjects.forEach(obj => {
        if (!obj.x || !obj.y) return;
        if (obj.type === "bullet") {
            drawBullet(obj);
        } else if (obj.type === "tank") {
            drawTank(obj);
        } else if (obj.type === "circle") {
            drawDynamicCircles(obj);
        } else {
            drawDynamicBoxes(obj);
        }
    });
}

// Function to active the zoom camera
socket.on("gameOver", data => {
    winnerId = data.winnerId;
    zoomingToWinner = true;
    targetZoom = 2.5;
});

// Function to zoom camera to the winner tank
function updateCamera() {
    if (!zoomingToWinner) return;

    const winner = dynamicObjects.find(o => o.id === winnerId);
    if (!winner) return;

    // Smooth zoom
    zoom += (targetZoom - zoom) * 0.03;

    // Center on winner
    cameraX = winner.x - canvas.width / (2 * zoom);
    cameraY = winner.y - canvas.height / (2 * zoom);
}

// Function to Draw Objects
function draw() {
    if (!isRendering) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set Zoom
    if (zoomingToWinner) {
        updateCamera();
    } else {
        cameraX = 0;
        cameraY = 0;
        zoom = 1;
    }

    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(-cameraX, -cameraY);

    drawStaticObjects();
    drawDynamicObjects();

    ctx.restore();

    requestAnimationFrame(draw);
}

// Start Game Until Lobby is ready
function startGame() {
    console.log("Game Starting!")
    isRendering = true;
    zoomingToWinner = false;
    zoom = 1;
    targetZoom = 1;
    draw();
}

// Function to stop all rendering
function stopGameRendering() {
    isRendering = false;
}