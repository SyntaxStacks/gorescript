var express = require('express');
var app = require('express')()
var server = require('http').Server(app)
var p2p = require('socket.io-p2p-server').Server
var io = require('socket.io')(server)
var clients = {};

var rooms = {};

app.use(express.static(__dirname + "/../../dist"))
io.use(p2p)

server.listen(3030, function () {
  console.log("Listening on 3030")
})

io.on('connection', function (socket) {
	clients[socket.id] = socket;

  socket.on('peer-msg', function (data) {
    console.log('Message from peer: %s', data)
    socket.broadcast.emit('peer-msg', data)
  })

  socket.on('peer-file', function (data) {
    console.log('File from peer: %s', data)
    socket.broadcast.emit('peer-file', data)
  })

  socket.on('go-private', function (data) {
    socket.broadcast.emit('go-private', data)
  })

	socket.on('join-room', function (data) {
    if (!data.roomName) {
      return;
    }
		let room = "" + data.roomName;
		if (rooms.indexOf(room) < 0) {
			rooms[room] = {
        clents: []
      };
		}

    rooms[room].clients.push()
		socket.join(room);
		p2p(socket, null, room);
	})

	socket.on('get-rooms', function (data) {
		socket.emit('get-rooms', { rooms });
	})
})
