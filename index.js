// Server Configurations
'use strict';
const { create } = require('domain');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Box2D = require('box2dweb-commonjs').Box2D;

// Box2D Variables
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

let connections = [];

// Box2D World Variables
let world;
const SCALE = 30;
const WIDTH = 900;
const HEIGHT = 600;
let fps = 60;
let interval;
let playerTanks = {};

// Store objects
let staticObjects = [];
let dynamicObjects = [];

// Function to create a static box
function createStaticBox(x, y, width, height, objid) {
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
    fix.GetBody().SetUserData({ id: objid, type: "static" });

    staticObjects.push({ objid, x, y, width, height, type: "static" });

    return fix;
}

// Function to create a dynamic box
function createDynamicBox(x, y, width, height, objid) {
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

    fix.GetBody().SetUserData({ objid, type: "dynamic" });
    fix.GetBody().SetFixedRotation(true);

    dynamicObjects.push({
        id: objid,
        width: width,
        height: height,
        body: fix.GetBody(),
        type: "dynamic",
        turretAngle: 45
    });

    return fix;
}

// Function to create a dynamic circle
function createDynamicCircle(x, y, radius, objid) {
    let fixDef = new b2FixtureDef();
    fixDef.density = 1;
    fixDef.friction = 0.5;
    fixDef.restitution = 0.2;

    let bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.Set(x / SCALE, y / SCALE);

    fixDef.shape = new b2CircleShape(radius / SCALE);

    let fix = world.CreateBody(bodyDef).CreateFixture(fixDef);
    fix.GetBody().SetUserData({ id: objid, type: "circle" });

    dynamicObjects.push({
        id: objid,
        radius: radius,
        width: radius * 2,
        height: radius * 2,
        body: fix.GetBody(),
        type: "circle"
    });

    return fix;
}

// Function to handle player movement
function handleMovement(playerId, input) {

    let tankObj = dynamicObjects.find(o => o.id === playerId);
    if (!tankObj) return;

    let body = tankObj.body;
    let vel = body.GetLinearVelocity();

    const moveSpeed = 5;
    if (input.left) body.SetLinearVelocity(new b2Vec2(-moveSpeed, vel.y));
    else if (input.right) body.SetLinearVelocity(new b2Vec2(moveSpeed, vel.y));
    else body.SetLinearVelocity(new b2Vec2(vel.x * 0.9, vel.y));

    if (input.aimUp) tankObj.turretAngle -= 1;
    if (input.aimDown) tankObj.turretAngle += 1;

    if (tankObj.turretAngle < 10) tankObj.turretAngle = 10;
    if (tankObj.turretAngle > 170) tankObj.turretAngle = 170;
}

// Update function to step the world
function update() {
    world.Step(1 / fps, 10, 10);
    world.ClearForces();

    // Prepare dynamic object states to send to clients
    let dynState = dynamicObjects.map(obj => ({
        id: obj.id,
        x: obj.body.GetPosition().x * SCALE,
        y: obj.body.GetPosition().y * SCALE,
        angle: obj.body.GetAngle(),
        turretAngle: obj.turretAngle ?? null
    }));

    io.emit("dynamicUpdate", dynState);
};

// Initialize the Box2D world
function init() {
    world = new b2World(
        new b2Vec2(0, 10), //gravity
        true               //allow sleep
    );

    // Canvass Boundaries
    createStaticBox(WIDTH / 2, HEIGHT - 10, WIDTH, 20, 'ground');
    createStaticBox(50, HEIGHT / 2, 20, HEIGHT, 'leftWall');
    createStaticBox(WIDTH - 50, HEIGHT / 2, 20, HEIGHT, 'rightWall');
    createStaticBox(WIDTH / 2, 50, WIDTH, 20, 'ceiling');

    // Hhardcode Tanks
    // createDynamicBox(200, 500, 60, 30, "tank1");
    // createDynamicBox(700, 500, 60, 30, "tank2");

    interval = setInterval(function () {
        update();
    }, 1000 / fps);
    update();
};

// Express Setup 
app.use(express.static('public'));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/assets', express.static(__dirname + '/public/assets'));

// Start the server on Port: 8000
http.listen(8000, () => {
    console.log("Server running on http://localhost:8000");

    io.on("connection", socket => {
        console.log("Client connected:", socket.id);

        //Spawn Tank When Player Joins
        let spawnX = Math.random() * 300 + 200;
        let tank = createDynamicBox(spawnX, 500, 60, 30, socket.id);
        playerTanks[socket.id] = tank;

        // Send object list
        setTimeout(() => {
            io.emit("worldInit", {
                static: staticObjects,
                dynamic: dynamicObjects.map(obj => ({
                    id: obj.id,
                    width: obj.width,
                    height: obj.height,
                    radius: obj.radius ?? null,
                    type: obj.type
                }))
            });
        }, 100);

        // Receive Input from Client
        socket.on("input", data => {
            handleMovement(socket.id, data);
        });

        // Log Disconnection
        socket.on("disconnect", () => {
            console.log("Disconnected:", socket.id);
        });

    });
});

init(); // Start the Box2D world