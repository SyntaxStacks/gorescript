var _ = require('lodash');
var express = require('express');
var app = require('express')()
var server = require('http').Server(app)
// var p2p = require('socket.io-p2p-server').Server
var io = require('socket.io')(server)
var clients = [];

var rooms = {};

app.use(express.static(__dirname + "/../../dist"))
// io.use(p2p)

function getClient(clients, id) {
  for (i in clients) {
    let client = clients[i];
    if (client.id === id) {
      return client;
    }
  }

  return {};
}

function getClientRoomName(id) {
  let client = getClient(clients, id);
  return client.room;
}

function getClientRoomData(id) {
  let roomName = getClientRoomName(id);
  return rooms[roomName];
}

function getClientFromRoom(id) {
  let roomData = getClientRoomData(id);
  if (roomData) {
    return getClient(roomData.clients, id);
  }

  return false
}

server.listen(3030, '0.0.0.0', function () {
  console.log("Listening on 3030")
})

io.on('connection', function (socket) {
  let client = { id: socket.id };
	clients.push(client);
  _.uniqBy(clients, 'id');

  socket.on('peer-msg', function (data) {
    console.log('Message from peer: %s', data)
    socket.broadcast.emit('peer-msg', data)
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

    let client = getClient(clients, socket.id);
    client.room = room;
    client.id = socket.id;
    client.x = 0;
    client.y = 0;
    client.z = 0;
    client.direction = 0;
    client.score = 0;

    let currentRoom = rooms[room];
    currentRoom.clients.unshift(client);
    _.uniqBy(currentRoom.clients, 'id');
		socket.join(room);
		// p2p(socket, null, room);

    socket.emit('setup-room', currentRoom);
    socket.broadcast.emit('player-join', client);
	})


  socket.on('get-rooms', function (data) {
    socket.emit('get-rooms', { rooms: Object.keys(rooms) });
  })

	socket.on('setup-grid', function () {
    let roomData = getClientRoomData(socket.id);
    console.dir('roomData')
    console.dir(roomData)
    socket.emit('setup-grid', roomData);
	})

  socket.on('room-sync', function() {
    let roomData = getClientRoomData(socket.id);
    socket.emit('room-sync', roomData);
  })

  socket.on('player-move', function(data) {
    let client = data.client;
    let current_client = getClientFromRoom(socket.id);
    let oldPos = {
      x: current_client.x,
      y: current_client.y,
      z: current_client.z
    };
    current_client.x = client.x;
    current_client.y = client.y;
    current_client.z = client.z;
    current_client.direction = client.direction;

    let moveData = {
      client: current_client,
    };
    socket.broadcast.emit('player-move', moveData);
  })

  socket.on('player-shoot', function() {
    // if ([client.x, client.y, client.z, client.direction].indexOf(undefined) != -1) {
    let current_client = getClientFromRoom(socket.id);
    socket.broadcast.emit('player-shoot', current_client);
	})

  socket.on('player-die', function(data) {
    // if ([client.x, client.y, client.z, client.direction].indexOf(undefined) != -1) {
    let killer = getClientFromRoom(data.killer);
    let current_client = getClientFromRoom(socket.id);
    killer.score++;
    socket.broadcast.emit('player-die', current_client);
	})

  socket.on('player-respawn', function() {
    // if ([client.x, client.y, client.z, client.direction].indexOf(undefined) != -1) {
    let current_client = getClientFromRoom(socket.id);
    socket.broadcast.emit('player-respawn', current_client);
	})

  socket.on('player-pickup', function(itemInfo) {
    let client = getClientFromRoom(socket.id);
    let data = {
      client,
      itemInfo,
    };
    socket.broadcast.emit('player-pickup', client);
	})

  socket.on('door-open', function(doorInfo) {
    let client = getClientFromRoom(socket.id);
    let data = {
      client,
      doorInfo,
    };
    socket.broadcast.emit('door-open', data);
	})

  socket.on('switch-change', function(switchInfo) {
    let client = getClientFromRoom(socket.id);
    let data = {
      client,
      switchInfo
    };
    socket.broadcast.emit('switch-change', data);
	})

  socket.on('use-elevator', function(elevatorInfo) {
    let client = getClientFromRoom(socket.id);
    let data = {
      client,
      elevatorInfo
    };
    socket.broadcast.emit('use-elevator', data);
	})

  socket.on('up-elevator', function(elevatorInfo) {
    let client = getClientFromRoom(socket.id);
    let data = {
      client,
      elevatorInfo
    };
    socket.broadcast.emit('up-elevator', data);
	})

  socket.on('down-elevator', function(elevatorInfo) {
    let client = getClientFromRoom(socket.id);
    let data = {
      client,
      elevatorInfo
    };
    socket.broadcast.emit('down-elevator', data);
	})

  socket.on('zone-enter', function(zone) {
    let client = getClientFromRoom(socket.id);
    let data = {
      client,
      zone
    };
    socket.broadcast.emit('zone-enter', data);
	})

  socket.on('zone-leave', function(zone) {
    let client = getClientFromRoom(socket.id);
    let data = {
      client,
      zone
    };
    socket.broadcast.emit('zone-leave', data);
	})

  socket.on('disconnect', function() {
    let client = getClient(clients, socket.id);
    let room = getClientRoomData(socket.id)

    if (room) {
      let current_client = getClientFromRoom(socket.id);
      socket.broadcast.emit('player-die', current_client);
      _.remove(room.clients, e => e.id === socket.id);
    }
    _.remove(clients, e => e.id === socket.id);
  });


})
