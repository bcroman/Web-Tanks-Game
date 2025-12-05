let staticObjects = [];
let dynamicObjects = [];

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Socket Connection
socket.on("connect", () => {
    console.log("Connected to server.");
})

// Receive initial world objects
socket.on("worldInit", (data) => {
    staticObjects = [];
    dynamicObjects = [];

    staticObjects = data.static;
    dynamicObjects = data.dynamic;
    console.log("World initialized:", data);
});

// Function to Receive Dynamic Objects
socket.on("dynamicUpdate", (state) => {
    state.forEach(update => {
        let obj = dynamicObjects.find(o => o.id === update.id);
        if (obj) {
            obj.x = update.x;
            obj.y = update.y;
            obj.angle = update.angle;
            if (update.turretAngle !== null) {
                obj.turretAngle = update.turretAngle;
            }
        }
    });
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

    // Draw tank body
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

// Function to Draw Tank with Turret
function drawTank(obj) {
    ctx.save();
    ctx.translate(obj.x, obj.y);

    // Draw tank body
    ctx.fillStyle = "blue";
    ctx.fillRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height);

    // Move pivot to TOP CENTER of tank
    let turretOffsetY = -obj.height / 2; // correct pivot
    ctx.translate(0, turretOffsetY);

    // Convert logical angle → canvas angle
    // Logical 90° = straight up; Canvas 0° = right
    let canvasAngle = (obj.turretAngle - 90) * Math.PI / 180;
    ctx.rotate(canvasAngle);

    // Draw the barrel extending outward from pivot
    ctx.fillStyle = "blue";
    ctx.fillRect(0, -3, 45, 6);

    ctx.restore();
}

// Function to Draw all dynamic objects
function drawDynamicObjects() {
    dynamicObjects.forEach(obj => {
        if (!obj.x || !obj.y) return;
        if (obj.type === "circle") {
            drawDynamicCircles(obj);
        }
        else if (obj.type === "tank") {
            drawTank(obj);
        }
        else {
            drawDynamicBoxes(obj);
        }
    });
}

// Function to Draw Objects
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStaticObjects();
    drawDynamicObjects();
    requestAnimationFrame(draw);
}

// Start Render Loop
draw();