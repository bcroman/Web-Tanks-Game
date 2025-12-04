'use strict';
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
//const Box2D = require('box2dweb-commonjs').Box2D;

let connections = [];

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