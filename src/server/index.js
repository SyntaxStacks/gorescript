var express = require('express');
var app = require('express')()
var server = require('http').Server(app)
var p2p = require('socket.io-p2p-server').Server
var io = require('socket.io')(server)
var clients = {};

var rooms = {};

app.use(express.static(__dirname + "/../../dist"))
io.use(p2p)

function getClient(clients, id) {
  for (i in clients) {
    let client = client[i];
    if (client.id === id) {
      return client;
    }
  }

  return {};
}

function getClientRoomName(id) {
  let client = getClient(clients, id);
  return client.data.room;
}

function getClientRoomData(id) {
  let roomName = getClientRoomName(id);
  return rooms[roomName];
}

function getClientFromRoom(id) {
  let roomData = getClientRoomData(id);
  return getClient(roomData.clients, id);
}

server.listen(3030, function () {
  console.log("Listening on 3030")
})

io.on('connection', function (socket) {
	clients[socket.id] = {
    data: {
      room: ''
    }
  };

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
		if (!rooms[room]) {
			rooms[room] = {
        clients: []
      };
		}

    let data = {
      pos: {
        x: 0,
        y: 0,
        z: 0
      }
    };
    let client = {
      id: socket.id,
      data,
    };

    let currentRoom = rooms[room];
    currentRoom.clients.push(client);
		socket.join(room);
		p2p(socket, null, room);

    socket.emit('setup-room', currentRoom);
    socket.broadcast.emit('player-join', client);
	})

	socket.on('get-rooms', function (data) {
		socket.emit('get-rooms', { rooms: Object.keys(rooms) });
	})

  socket.on('room-ping', function() {
    let roomData = getClientRoomData();
    socket.emit('room-ping', roomData);
  })

  socket.on('player-move', function(data) {
    let pos = data.pos || {};
    let direction = data.direction;
    if ([pos.x, pos.y, pos.z, direction].indexOf(undefined) != -1) {
      let client = getClientFromRoom(socket.id);
      let clientPos = client.data.pos;
      clientPos.x = pos.x;
      clientPos.y = pos.y;
      clientPos.z = pos.z;
      client.data.direction = direction;
    }
  })
})
