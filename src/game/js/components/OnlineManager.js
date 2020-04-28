GS.OnlineManager = function(grid) {
	this.mapWon = false;

	this.onlinePlayersKilled = 0;
  this.onlineRoom = new GS.OnlineRoom();
};

GS.OnlineManager.prototype = {
	init: function() {
		// this.initGridObjectLibrary();
		// this.initScripts();
    this.callbacks = {};
    this.onlineRoom.init();
	},

  setGrid: function (grig) {
    this.grid = grid;
    this.map = grid.map;
  },

  setupClients: function () {
    this.onlineRoom.setupClients();
  },

  socketListeners: function (socket) {
    // socket.usePeerConnection = true;

    // this event will be triggered over the socket transport
    // until `usePeerConnection` is set to `true`
    socket.on('peer-msg', (data) => {
      console.log(data);
    });

    socket.on('get-rooms', (data) => {
      (this.callbacks.getRooms || ((e) => {}))(data.rooms);
    });

    // socket.on('dead-monster', this.onMonsterDeath.bind(this));
    socket.on('setup-room', this.onSetupRoom.bind(this));
    socket.on('player-die', this.onOnlinePlayerDeath.bind(this));
    socket.on('player-join', this.onOnlinePlayerJoin.bind(this));
    // socket.on('player-move', this.onOnlinePlayerMove.bind(this));
    socket.on('player-shoot', this.onOnlinePlayerShoot.bind(this));
    // socket.on('player-pickup', this.onOnlinePlayerItemPickup.bind(this));
    // socket.on('door-open', this.onOnlinePlayerOpenDoor.bind(this));
    // socket.on('switch-change', this.onSwitchStateChange.bind(this));
    socket.on('room-ping', this.onRoomPing.bind(this));
  },

  start: function (cb) {
    this.callbacks.getRooms = cb;
    GS.Socket.init();

    this.socket = GS.Socket.io;
    this.socketListeners(this.socket);
    this.getRooms();

  },

  stop: function () {
    GS.Socket.close();
  },

  startGame: function () {
    this.pingInterval = setInterval(() => this.roomPing(), 100);
  },

  stopGame: function () {
    clearInterval(this.pingInterval);
  },

	// initGridObjectLibrary: function() {
	// 	var that = this;

	// 	var library = {
	// 		items: {},
	// 		doors: {},
	// 		elevators: {},
	// 		monsters: {},
	// 		sectors: {},
	// 		switches: {},
	// 	};

	// 	this.grid.forEachUniqueGridObject([GS.Item, GS.Door, GS.Elevator, GS.Monster, GS.Concrete, GS.Switch], function(gridObject) {
	// 		if (gridObject instanceof GS.Item) {
	// 			library.items[gridObject.sourceObj.id] = gridObject;
	// 		} else
	// 		if (gridObject instanceof GS.Door) {
	// 			library.doors[gridObject.sector.id] = gridObject;
	// 		} else
	// 		if (gridObject instanceof GS.Elevator) {
	// 			library.elevators[gridObject.sector.id] = gridObject;
	// 		} else
	// 		if (gridObject instanceof GS.Monster) {
	// 			library.monsters[gridObject.sourceObj.id] = gridObject;
	// 		} else
	// 		if (gridObject instanceof GS.Concrete && gridObject.type == GS.MapLayers.Sector) {
	// 			library.sectors[gridObject.sourceObj.id] = gridObject;
	// 		} else
	// 		if (gridObject instanceof GS.Switch) {
	// 			library.switches[gridObject.segment.id] = gridObject;
	// 		}
	// 	});

	// 	this.gridObjectLibrary = library;
	// },

	// initScripts: function() {
	// 	if (this.map.hasScript === true) {
	// 		this.script = new GS.MapScripts[this.map.name](this.gridObjectLibrary);
	// 		this.script.init();

	// 		var entities = this.grid.map.layerObjects[GS.MapLayers.Entity];
	// 		for (var i = 0; i < entities.length; i++) {
	// 			var entity = entities[i];
	// 			var type = GS.MapEntities[entity.type].type;
	// 			if (type === "Monster") {
	// 				this.maxMonsters++;
	// 			} else
	// 			if (type === "Item") {
	// 				this.maxItems++;
	// 			}
	// 		}
	// 	}
	// },

	update: function() {
		// if (this.script !== undefined) {
		// 	this.script.update();

		// 	if (this.script.mapWon && !this.mapWon) {
		// 		this.mapWon = true;
		// 	}
		// }

		// if (!this.mapWon) {
    //   this.updateTime();
		// }
	},
  // Listeners
	onMonsterDeath: function() {
		// this.monstersKilled++;
	},

	onOnlinePlayerDeath: function(data) {
		// this.onlinePlayersKilled++;
    this.onlineRoom.removeClient(data.id);
	},

	onOnlinePlayerJoin: function(data) {
    console.log('player joined');
    console.dir(data);
		// this.onlinePlayersKilled++;
    this.onlineRoom.addClient(data);
	},

	onOnlinePlayerMove: function(data) {

		// if (this.script !== undefined) {
		// 	this.checkZones(player, oldPos, newPos);
		// }

		// this.wakeUpNearbyMonsters(player);
		// this.applyRegionVisibility(player);
	},

	onOnlinePlayerShoot: function(player) {
		// this.activateNearbyMonsters(player);
    this.onlineRoom.addProjectile(player.id);
	},

	onOnlinePlayerOpenDoor: function(door) {
		if (this.script !== undefined) {
			this.script.onPlayerOpenDoor(door);
		}
	},

	onOnlinePlayerItemPickup: function(player, item) {
		// this.itemsPickedUp++;

		// if (this.script !== undefined) {
		// 	this.script.onItemPickup(item);
		// }
	},

	onSwitchStateChange: function(switchObj) {
		if (this.script !== undefined) {
			this.script.onSwitchStateChange(switchObj);
		}
	},

  onSetupRoom: function (room) {
    this.onlineRoom.setupRoom(room);
    this.startGame();
  },

  onRoomPing: function(room) {
    let id = this.socket.id;
    this.onlineRoom.roomPing(room, id);
    let player = {
      id,
      x: GAME.grid.player.position.x,
      y: GAME.grid.player.position.y,
      z: GAME.grid.player.position.z,
      direction: GAME.grid.player.direction,
    };
    this.socket.emit('player-move', player)
  },

  // Events
  joinRoom: function(room) {
    this.socket.emit('join-room', { roomName: GS.Settings.roomName })
  },

  roomPing: function() {
    this.socket.emit('room-ping', { roomName: GS.Settings.roomName })
  },

  getRooms: function(room) {
    this.socket.emit('get-rooms', {});
  },
  playerShoot: function() {
    this.socket.emit('player-shoot', {});
  },
  playerDie: function() {
    this.socket.emit('player-die', {});
  },
};
