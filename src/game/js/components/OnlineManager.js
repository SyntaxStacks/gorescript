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
    this.socket = { emit: () => {}}
    this.onlineRoom.init();
	},

  isCurrentClient(client) {
    client.id === this.socket.id;
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
    socket.on('player-respawn', this.onOnlinePlayerRespawn.bind(this));
    socket.on('player-join', this.onOnlinePlayerJoin.bind(this));
    // socket.on('player-move', this.onOnlinePlayerMove.bind(this));
    socket.on('player-shoot', this.onOnlinePlayerShoot.bind(this));
    socket.on('player-pickup', this.onOnlinePlayerItemPickup.bind(this));
    socket.on('door-open', this.onOnlinePlayerOpenDoor.bind(this));
    socket.on('switch-change', this.onSwitchStateChange.bind(this));
    socket.on('room-ping', this.onRoomPing.bind(this));
    socket.on('use-elevator', this.onUseElevator.bind(this));
    // socket.on('up-elevator', this.onUpElevator.bind(this));
    // socket.on('down-elevator', this.onDownElevator.bind(this));
    socket.on('enter-sector', this.onEnterSector.bind(this));
    socket.on('zone-enter', this.onZoneEnter.bind(this));
    socket.on('zone-leave', this.onZoneLeave.bind(this));
    socket.on('map-won', this.onMapWon.bind(this));
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

	onOnlinePlayerRespawn: function(data) {
    this.onlineRoom.clientRespawn(data.id);
	},

	onOnlinePlayerDeath: function(data) {
		// this.onlinePlayersKilled++;
    this.onlineRoom.clientDie(data.id);
	},

	onOnlinePlayerJoin: function(data) {
    console.log('player joined');
    console.dir(data);
		// this.onlinePlayersKilled++;
    this.onlineRoom.addClient(data);
	},

	onOnlinePlayerMove: function(player, oldPos, newPos) {
		if (this.script !== undefined) {
			this.checkZones(player, oldPos, newPos);
		}

		this.wakeUpNearbyMonsters(player);
		this.applyRegionVisibility(player);
	},

	checkZones: function() {
		var oldPos2d = new THREE.Vector2();
		var newPos2d = new THREE.Vector2();

		return function(player, oldPos, newPos) {
			oldPos.toVector2(oldPos2d);
			newPos.toVector2(newPos2d);

      let aiManager = GAME.grid.aiManager;
			for (let i = 0; i < aiManager.zones.length; i++) {
				var zone = aiManager.zones[i];
				var c1 = zone.boundingSquare.containsPoint(oldPos2d);
				var c2 = zone.boundingSquare.containsPoint(newPos2d);

				if (c1 && !c2) {
					this.zoneLeave(i);
				} else
				if (!c1 && c2) {
					this.zoneEnter(i);
				}
			}
		}
	}(),

	onOnlinePlayerShoot: function(player) {
		// this.activateNearbyMonsters(player);
    this.onlineRoom.addProjectile(player.id);
	},

	onOnlinePlayerOpenDoor: function(data) {
    let id = data.doorInfo.id;
    let aiManager = GAME.grid.aiManager;
    let doorObj = aiManager.gridObjectLibrary.doors[id];
    doorObj.onUse();
	},

	onOnlinePlayerItemPickup: function(player, old_item) {
		// this.itemsPickedUp++;
		GAME.grid.forEachUniqueGridObjectInCells(GAME.grid.player.linkedGridCells, [GS.Item], function(item) {
      if (item.id === old_item.id) {
        item.remove();
        GAME.grid.aiManager.onItemPickup(item);
      }
		});
	},

	onZoneLeave: function(data) {
    let aiManager = GAME.grid.aiManager;
    let z = aiManager.zones[data.zone.id];
    aiManager.script.onZoneLeave(z);
	},

	onZoneEnter: function(data) {
    let aiManager = GAME.grid.aiManager;
    let z = aiManager.zones[data.zone.id];
    aiManager.script.onZoneEnter(z);
	},

	onEnterSector: function(sector) {
    let aiManager = GAME.grid.aiManager;
    let sectorObj = aiManager.gridObjectLibrary.sectors[sector.id];
    // aiManager.onSwitchStateChange(sectorObj);
	},

	onUpElevator: function(data) {
    let id = data.elevatorInfo.id;
    let aiManager = GAME.grid.aiManager;
    let elevatorObj = aiManager.gridObjectLibrary.elevators[id];
    elevatorObj.onUp(false);
	},

	onDownElevator: function(data) {
    let id = data.elevatorInfo.id;
    let aiManager = GAME.grid.aiManager;
    let elevatorObj = aiManager.gridObjectLibrary.elevators[id];
    elevatorObj.onDown(false);
	},

	onUseElevator: function(data) {
    let id = data.elevatorInfo.id;
    let aiManager = GAME.grid.aiManager;
    let elevatorObj = aiManager.gridObjectLibrary.elevators[id];
    elevatorObj.onUse();
	},

	onSwitchStateChange: function(data) {
    let id = data.switchInfo.id
    let aiManager = GAME.grid.aiManager;
    let switchObj = aiManager.gridObjectLibrary.switches[id];
    aiManager.onSwitchStateChange(switchObj);
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

  onMapWon: function () {
    GAME.grid.aiManager.mapWon = true;
  },

  // Events
  joinRoom: function(room) {
    GS.Game.onlinePlay = true;
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
  playerDie: function(data) {
    this.socket.emit('player-die', { killer: data.killId });
  },
  playerRespawn: function() {
    this.socket.emit('player-respawn', {});
  },
  playerPickup: function(item) {
    this.socket.emit('player-pickup', { id: item.sourceObj.id });
  },
  openDoor: function(door) {
    this.socket.emit('door-open', { id: door.sector.id });
  },
  useElevator: function(elevator) {
    this.socket.emit('use-elevator', { id: elevator.sector.id });
  },
  // upElevator: function(elevator) {
  //   this.socket.emit('up-elevator', { id: elevator.sector.id });
  // },
  // downElevator: function(elevator) {
  //   this.socket.emit('down-elevator', { id: elevator.sector.id });
  // },
  enterSector: function(sector) {
    this.socket.emit('enter-sector', { id: sector.sourceObj.id });
  },
  switchStateChange: function(switchObj) {
    this.socket.emit('switch-change', { id: switchObj.segment.id });
  },

  zoneEnter: function(zone) {
    this.socket.emit('zone-enter', { id: zone });
  },

  zoneLeave: function(zone) {
    this.socket.emit('zone-leave', { id: zone });
  },

  useTarget: function (obj) {
    let library = GAME.grid.aiManager.gridObjectLibrary;
    if (obj instanceof GS.Door) {
      this.openDoor(obj);
    } else
    if (obj instanceof GS.Elevator) {
      this.useElevator(obj);
    } else
    if (obj instanceof GS.Switch) {
      this.switchStateChange(obj);
    }
  }
};
