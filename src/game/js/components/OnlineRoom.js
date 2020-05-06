GS.OnlineRoom = function() {
  this.clients = [];
}

GS.OnlineRoom.prototype = {
	init: function() {
	},

  setupRoom: function (room) {
    this.room = room;
    let mapName = "airstrip1online";// room.mapName;
    GAME.loadOnlineLevel(mapName);
  },

  setupClients: function (room) {
    clients = room.clients || this.room.clients
    clients.forEach((e) => this.addClient(e));
  },

  roomSync: function (room, id) {
    // for (i in room.clients) {
    //   updatedClient = room.clients[i];
    //   console.log(updatedClient.id + ": " + updatedClient.score)
    //   if (updatedClient.id === id) {
    //     continue;
    //   }
    //   let client = this.findClient(updatedClient.id);
    //   if (!client) {
    //     // this.addClient(updatedClient);
    //   } else {
    //     this.updateClient(updatedClient);
    //   }
    // }
  },

  addClient: function (client) {
    if (GAME.onlineManager.socket.id === client.id) {
      return;
    }
    let ntt = {
      id: client.id,
      pos: new THREE.Vector2(client.x || 0, client.y || 0),
      type: "O",
      y: 0,
      isStatic:false,
      rotation: client.direction || 0
    };
    let gridObj = GAME.grid.spawnEntityAtRuntime(ntt, GAME.grid);
    this.clients.push(gridObj);
    GAME.grid.map.layerObjects[GS.MapLayers.Entity].push(gridObj);
  },

  findClient: function (id) {
    if (GAME.onlineManager.socket.id === id) {
      return false;
    }
    return this.clients.filter((e) => e.id === id && e.id !== GAME.onlineManager.socket.id)[0] || false;
  },

  clientDie: function (id) {
    let client = this.findClient(id);
    if (client) {
      client.onDeath();
    }
  },

  clientRespawn: function (id) {
    let client = this.findClient(id);
    if (client) {
      client.onRespawn();
    }
  },

  removeClient: function (id) {
    let client = this.findClient(id);
    if (client) {
      client.onDeath();
      this.clients.splice(this.clients.indexOf(client), 1);
    }
  },

  addProjectile: function (id) {
    let client = this.findClient(id);
    if (client) {
      client.onPlayerShoot();
    }
  },

  removeAllClients: function (id) {
    this.clients = [];
  },

  updateClient: function (c, newPos) {
    let client = this.findClient(c.id);
    if (!client) {
      return
    }
    // if (this.script !== undefined) {
    //   this.checkZones(data.client,
    // }

		// this.wakeUpNearbyMonsters(player);
		// this.applyRegionVisibility(player);
    client.onUpdateMove(client, newPos);
  }
};


