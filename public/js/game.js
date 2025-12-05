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
    ctx.rotate(obj.angle);

    ctx.fillStyle = "red";
    ctx.fillRect(
        -obj.width / 2,
        -obj.height / 2,
        obj.width,
        obj.height
    );

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

// Function to Draw all dynamic objects
function drawDynamicObjects() {
    dynamicObjects.forEach(obj => {
        if (!obj.x || !obj.y) return;
        if (obj.type === "circle") {
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