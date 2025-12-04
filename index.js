// Server Configurations
'use strict';
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
let fps = 30;
let interval;

// Function to create a static box
function createStaticBox(x, y, width, height, objid, density = 1, friction = 0.5, restitution = 0.2) {
    let fixDef = new b2FixtureDef();
    fixDef.density = density;
    fixDef.friction = friction;
    fixDef.restitution = restitution;

    let bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_staticBody;
    bodyDef.position.Set(x / SCALE, y / SCALE);

    fixDef.shape = new b2PolygonShape();
    fixDef.shape.SetAsBox((width / SCALE) / 2, (height / SCALE) / 2);

    let fix = world.CreateBody(bodyDef).CreateFixture(fixDef);
    fix.GetBody().SetUserData({ id: objid, type: "static" });

    return fix;
}

// Function to create a dynamic box
function createDynamicBox(x, y, width, height, objid, density = 1, friction = 0.5, restitution = 0.2) {
    let fixDef = new b2FixtureDef();
    fixDef.density = density;
    fixDef.friction = friction;
    fixDef.restitution = restitution;

    let bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.Set(x / SCALE, y / SCALE);

    fixDef.shape = new b2PolygonShape();
    fixDef.shape.SetAsBox((width / SCALE) / 2, (height / SCALE) / 2);

    let fix = world.CreateBody(bodyDef).CreateFixture(fixDef);
    fix.GetBody().SetUserData({ id: objid, type: "dynamic" });

    return fix;
}

// Function to create a dynamic circle
function createDynamicCircle(x, y, radius, objid, density = 1, friction = 0.5, restitution = 0.2) {
    let fixDef = new b2FixtureDef();
    fixDef.density = density;
    fixDef.friction = friction;
    fixDef.restitution = restitution;

    let bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.Set(x / SCALE, y / SCALE);

    fixDef.shape = new b2CircleShape(radius / SCALE);

    let fix = world.CreateBody(bodyDef).CreateFixture(fixDef);
    fix.GetBody().SetUserData({ id: objid, type: "bullet" });

    return fix;
}

// Update function to step the world
function update() {
    world.Step(1 / fps, 10, 10);
    world.ClearForces();
};

// Initialize the Box2D world
function init() {
    world = new b2World(
        new b2Vec2(0, 10), //gravity
        true               //allow sleep
    );

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
http.listen(8000, function () {
    console.log('listening on *:8000');
    io.on('connection', function (socket) {
        connections.push(socket);
    });
});

init(); // Start the Box2D world