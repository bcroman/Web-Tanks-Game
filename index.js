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

let world;
const SCALE = 30;
const WIDTH = 900;
const HEIGHT = 600;
let fps = 30;
let interval;

function update() {
    world.Step(1/fps, 10, 10);
    world.ClearForces();
};

function init() {
    world = new b2World(
        new b2Vec2(0, 10), //gravity
        true               //allow sleep
    );

    interval = setInterval(function() {
        update();
    }, 1000/fps);
    update();
};

app.use(express.static('public'));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/assets', express.static(__dirname + '/public/assets'));

http.listen(8000, function() {
    console.log('listening on *:8000');
    io.on('connection', function(socket) {
        connections.push(socket);
    });
});

init();