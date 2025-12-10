/*
Server Configuration
*/
'use strict';
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Box2D = require('box2dweb-commonjs').Box2D;
const fs = require("fs");

/*
Box2D Valiables
*/
let b2Vec2 = Box2D.Common.Math.b2Vec2;
let b2AABB = Box2D.Collision.b2AABB;
let b2BodyDef = Box2D.Dynamics.b2BodyDef;
let b2Body = Box2D.Dynamics.b2Body;
let b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
let b2Fixture = Box2D.Dynamics.b2Fixture;
let b2World = Box2D.Dynamics.b2World;
let b2MassData = Box2D.Collision.Shapes.b2MassData;
let b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
let b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
let b2MouseJointDef = Box2D.Dynamics.Joints.b2MouseJointDef;
let b3EdgeShape = Box2D.Collision.Shapes.b2EdgeShape;

/*
Game Variables
*/
let world;
const SCALE = 30;
const WIDTH = 1200;
const HEIGHT = 600;
let fps = 60;
let interval;

let mapData = null;
let tankSpawns = [];
let nextSpawnIndex = 0;

let playerTanks = {};
let bulletsToDelete = [];
let staticObjects = [];
let dynamicObjects = [];

const requiredPlayers = 2;   // Change this for larger matches
let lobby = [];              // { id, nickname }
let gameStarted = false;

/*
Map Loading Function
*/
function loadMap(mapNumber) {
    const filePath = `./maps/map${mapNumber}.json`;
    const raw = fs.readFileSync(filePath);
    mapData = JSON.parse(raw);

    console.log(`Loaded Map ${mapNumber}: ${mapData.name}`);

    // Set world size
    global.WIDTH = mapData.width;
    global.HEIGHT = mapData.height;

    staticObjects = [];

    // Build static objects
    mapData.static.forEach(obj => {
        if (obj.type === "box") {
            createStaticBox(obj.x, obj.y, obj.width, obj.height, obj.id);
        }
    });

    // Save spawn points
    tankSpawns = mapData.spawns;
}

/*
Create Object Functions
*/

// Function to create a static box
function createStaticBox(x, y, width, height, id) {
    let fixDef = new b2FixtureDef();
    fixDef.density = 1;
    fixDef.friction = 0.5;
    fixDef.restitution = 0.2;

    let bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_staticBody;
    bodyDef.position.Set(x / SCALE, y / SCALE);

    fixDef.shape = new b2PolygonShape();
    fixDef.shape.SetAsBox((width / SCALE) / 2, (height / SCALE) / 2);

    let fix = world.CreateBody(bodyDef).CreateFixture(fixDef);
    fix.GetBody().SetUserData({ id: id, type: "static" });

    staticObjects.push({ id, x, y, width, height, type: "static" });

    return fix;
}

// Function to create a dynamic box
function createTank(x, y, width, height, id) {
    let fixDef = new b2FixtureDef();
    fixDef.density = 2;
    fixDef.friction = 0.8;
    fixDef.restitution = 0.0;

    let bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.Set(x / SCALE, y / SCALE);

    fixDef.shape = new b2PolygonShape();
    fixDef.shape.SetAsBox((width / SCALE) / 2, (height / SCALE) / 2);

    let fix = world.CreateBody(bodyDef).CreateFixture(fixDef);
    let body = fix.GetBody();

    body.SetUserData({ id: id, type: "tank" });
    body.SetFixedRotation(true);

    const tankObj = {
        id,
        width,
        height,
        body,
        type: "tank",
        turretAngle: 200,
        hp: 100
    };

    dynamicObjects.push(tankObj);

    return tankObj;
}

// Function to create a dynamic circle
function createBullet(x, y, radius, id, angleRad, speed) {
    let fixDef = new b2FixtureDef();
    fixDef.density = 0.2;
    fixDef.friction = 0;
    fixDef.restitution = 0.1;

    let bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.bullet = true; // continuous collision detection
    bodyDef.position.Set(x / SCALE, y / SCALE);

    fixDef.shape = new b2CircleShape(radius / SCALE);

    let fix = world.CreateBody(bodyDef).CreateFixture(fixDef);
    let body = fix.GetBody();

    body.SetUserData({ id: id, type: "bullet" });

    const bulletObj = {
        id,
        radius,
        width: radius * 2,
        height: radius * 2,
        body,
        type: "bullet"
    };

    dynamicObjects.push(bulletObj);

    // Shot velocity
    body.SetLinearVelocity(new b2Vec2(
        Math.cos(angleRad) * speed,
        Math.sin(angleRad) * speed
    ));

    return bulletObj;
}

/*
Movement and Input Logic
*/
// Function to handle player movement input
function handleMovement(playerId, input) {

    let tankObj = dynamicObjects.find(o => o.id === playerId);
    if (!tankObj) return;

    let body = tankObj.body;
    let vel = body.GetLinearVelocity();
    const moveSpeed = 5;

    // Handle left/right movement
    if (input.left) {
        body.SetLinearVelocity(new b2Vec2(-moveSpeed, vel.y));
    }
    else if (input.right) {
        body.SetLinearVelocity(new b2Vec2(moveSpeed, vel.y));
    }
    else {
        body.SetLinearVelocity(new b2Vec2(vel.x * 0.9, vel.y));
    }
    body.SetAwake(true);

    // Handle Turret Rotation
    if (input.aimUp) tankObj.turretAngle -= 2;
    if (input.aimDown) tankObj.turretAngle += 2;

    // Turret Angles 
    if (tankObj.turretAngle < 10) tankObj.turretAngle = 10;
    if (tankObj.turretAngle > 170) tankObj.turretAngle = 170;
}

// Function to handle firing bullets
function fireBullet(playerId) {
    const tank = dynamicObjects.find(o => o.id === playerId && o.type === "tank");
    if (!tank) return;

    const angleDeg = tank.turretAngle;
    const angleRad = (angleDeg + 180) * Math.PI / 180;
    const power = 20;

    // Tank body center (world coordinates in pixels)
    const tankX = tank.body.GetPosition().x * SCALE;
    const tankY = tank.body.GetPosition().y * SCALE;

    // Turret pivot = top-center of tank
    const pivotX = tankX;
    const pivotY = tankY - (tank.height / 2);

    // Spawn bullet 35px ahead of turret
    const spawnX = pivotX + Math.cos(angleRad) * 35;
    const spawnY = pivotY + Math.sin(angleRad) * 35;

    const bulletId = "bullet_" + Date.now();
    createBullet(spawnX, spawnY, 5, bulletId, angleRad, power);
}

/*
Collision Handling
*/
// Function to handle collisions
function setupContactListener() {
    let listener = new Box2D.Dynamics.b2ContactListener();

    listener.BeginContact = function (contact) {
        handleCollision(contact);
    };

    world.SetContactListener(listener);
}

// Function to handle collision events
function handleCollision(contact) {
    let fixtureA = contact.GetFixtureA();
    let fixtureB = contact.GetFixtureB();

    let bodyA = fixtureA.GetBody();
    let bodyB = fixtureB.GetBody();

    let dataA = bodyA.GetUserData();
    let dataB = bodyB.GetUserData();

    if (!dataA || !dataB) return;

    // Bullet → Ground collision
    if (dataA.type === "bullet" && dataB.type === "static") {
        markBulletForDeletion(dataA.id);
    }
    else if (dataB.type === "bullet" && dataA.type === "static") {
        markBulletForDeletion(dataB.id);
    }

    // Bullet → Tank collision
    if (dataA.type === "bullet" && dataB.type === "tank") {
        handleBulletHitTank(dataA.id, dataB.id);
    }
    if (dataB.type === "bullet" && dataA.type === "tank") {
        handleBulletHitTank(dataB.id, dataA.id);
    }
}

// Function to mark bullet for deletion
function markBulletForDeletion(bulletId) {
    bulletsToDelete.push({
        id: bulletId,
        time: Date.now()
    });
}

// Function to handle bullet hitting a tank
function handleBulletHitTank(bulletId, tankId) {
    //console.log("Bullet", bulletId, "hit Tank", tankId);
    markBulletForDeletion(bulletId);

    let tankObj = dynamicObjects.find(o => o.id === tankId && o.type === "tank");
    if (!tankObj) return;

    //Apply damage
    const damage = 5;
    tankObj.hp -= damage;

    console.log("Tank", tankId, "HP:", tankObj.hp);

    // Destroy tank if HP <= 0
    if (tankObj.hp <= 0) {
        destoryTank(tankObj);
    }
}

// Function to destroy tank
function destoryTank(tankId) {
    console.log(`Tank ${tankId} destroyed!`);

    // Find tank
    let tankObj = dynamicObjects.find(o => o.id === tankId && o.type === "tank");
    if (!tankObj) return;

    // Remove from physics world
    world.DestroyBody(tankObj.body);

    // Remove from dynamicObjects
    dynamicObjects = dynamicObjects.filter(o => o.id !== tankId);

    // Remove from player list
    delete playerTanks[tankId];

    // Notify clients
    io.emit("tankDestroyed", { id: tankId });

    checkForGameOver("tank eliminated");
}

/*
World Update Loop
*/
function update() {
    world.Step(1 / fps, 10, 10);
    world.ClearForces();

    // Delete bullets that have collided
    let now = Date.now();

    // Remove bullets after 5 seconds
    bulletsToDelete = bulletsToDelete.filter(entry => {
        if (now - entry.time >= 5000) {
            let bulletObj = dynamicObjects.find(o => o.id === entry.id && o.type === "bullet");
            if (bulletObj) {
                world.DestroyBody(bulletObj.body);
                dynamicObjects = dynamicObjects.filter(o => o.id !== entry.id);
            }
            return false;
        }
        return true;
    });

    // Prepare dynamic state for clients
    const dynState = dynamicObjects.map(obj => ({
        id: obj.id,
        x: obj.body.GetPosition().x * SCALE,
        y: obj.body.GetPosition().y * SCALE,
        angle: obj.body.GetAngle(),
        radius: obj.radius,
        width: obj.width,
        height: obj.height,
        turretAngle: obj.turretAngle,
        type: obj.type,
        hp: obj.hp
    }));

    io.emit("dynamicUpdate", dynState);
};

/*
World Initialisation
*/
function init() {
    world = new b2World(new b2Vec2(0, 10), true);

    // Call Collision Handler
    setupContactListener();

    // Map Loading
    let mapNumber = Math.floor(Math.random() * 3) + 1; // random map 1–3
    loadMap(mapNumber);

    interval = setInterval(update, 1000 / fps);
    update();
};

/*
Express + Socket.IO Setup
*/
app.use(express.static('public'));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/assets', express.static(__dirname + '/public/assets'));

io.on("connection", socket => {

    console.log("Client connected:", socket.id);

    socket.on("joinLobby", nickname => {

        if (gameStarted) {
            socket.emit("lobbyFull", "Game already in progress.");
            return;
        }

        lobby.push({ id: socket.id, nickname });

        socket.emit("lobbyJoined", lobby, requiredPlayers);
        io.emit("lobbyUpdate", lobby, requiredPlayers);

        // Start when lobby full
        if (lobby.length >= requiredPlayers) {
            startGame();
        }
    });

    // Receive Input from Player
    socket.on("input", data => {
        handleMovement(socket.id, data);
    });

    // Handle Firing Bullets From Players
    socket.on("fire", () => {
        fireBullet(socket.id);
    });

    // Remove from lobby on disconnect
    socket.on("disconnect", () => {
        console.log("Disconnected:", socket.id);

        // Remove from lobby if still waiting
        lobby = lobby.filter(p => p.id !== socket.id);
        if (!gameStarted) {
            io.emit("lobbyUpdate", lobby, requiredPlayers);
        }

        // Remove player tank from world & arrays
        const tankObj = dynamicObjects.find(o => o.id === socket.id && o.type === "tank");
        if (tankObj) {
            world.DestroyBody(tankObj.body);
            dynamicObjects = dynamicObjects.filter(o => o.id !== socket.id);
        }
        delete playerTanks[socket.id];

        checkForGameOver("player disconnected");
    });
});

// Start the server on Port: 8000
function startGame() {
    console.log("Game starting...");
    gameStarted = true;

    io.emit("startGame");

    // Spawn tanks for ALL lobby players
    lobby.forEach(p => {
        let spawn = tankSpawns[nextSpawnIndex % tankSpawns.length];
        nextSpawnIndex++;

        let tank = createTank(spawn.x, spawn.y, 60, 30, p.id);
        playerTanks[p.id] = tank;
    });

    // Send full world data
    io.emit("worldInit", {
        static: staticObjects,
        dynamic: dynamicObjects.map(o => ({
            id: o.id,
            width: o.width,
            height: o.height,
            radius: o.radius ?? null,
            type: o.type,
            turretAngle: o.turretAngle,
            hp: o.hp
        }))
    });

}

// Functiin to check if game is over 
function checkForGameOver(reason = "tank eliminated") {
    if (!gameStarted) return;   // avoid firing twice

    // Find alive tank objects
    const aliveTanks = dynamicObjects.filter(o => o.type === "tank");

    // If 0 or 1 tanks left, match is over
    if (aliveTanks.length <= 1) {

        let winnerId = aliveTanks[0] ? aliveTanks[0].id : null;

        // Look up nickname for winner
        let winnerEntry = lobby.find(p => p.id === winnerId);
        let winnerName = winnerEntry ? winnerEntry.nickname : "No winner";

        console.log("GAME OVER - Winner:", winnerName);

        // Tell all clients to show Game Over screen
        io.emit("gameOver", {
            winnerId: winnerId,
            winnerName: winnerName,
            reason: reason
        });

        // Cleanup world tanks
        dynamicObjects = dynamicObjects.filter(o => o.type !== "tank");
        Object.values(playerTanks).forEach(t => {
            if (t.body) world.DestroyBody(t.body);
        });
        playerTanks = {};

        // Reset match
        gameStarted = false;
        lobby = [];
    }
}

/*
Start the server on Port: 8000
*/
http.listen(8000, () => {
    console.log("Server running on http://localhost:8000");
});

init(); // Start Box2D world