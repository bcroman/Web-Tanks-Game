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
                hp: update.hp
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

    ctx.fillStyle = "blue";
    ctx.fillRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height);

    ctx.fillStyle = "red"; 
    ctx.fillRect(-obj.width / 2, -obj.height / 2 - 15, obj.width, 6);

    ctx.fillStyle = "lime";
    let hpPercent = Math.max(obj.hp, 0) / 100;
    ctx.fillRect(-obj.width / 2, -obj.height / 2 - 15, obj.width * hpPercent, 6);

    let turretOffsetY = -obj.height / 2;
    ctx.translate(0, turretOffsetY);

    const canvasAngle = (obj.turretAngle + 180) * Math.PI / 180;
    ctx.rotate(canvasAngle);

    ctx.fillStyle = "blue";
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

// Function to Draw Objects
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStaticObjects();
    drawDynamicObjects();
    requestAnimationFrame(draw);
}

// Start Render Loop
draw();