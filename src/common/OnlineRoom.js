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

  setupClients: function () {
    if (!this.firstRunHack)
      this.room.clients.forEach((e) => this.addClient(e));
    this.firstRunHack = true;
  },

  roomPing: function (room, id) {
    for (i in room.clients) {
      updatedClient = room.clients[i];
      if (updatedClient.id === id) {
        continue;
      }
      let client = this.findClient(updatedClient.id);
      if (!client) {
        this.addClient(updatedClient);
      } else {
        this.updateClient(updatedClient);
      }
    }
  },

  addClient: function (client) {

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
    return this.clients.filter((e) => e.id === id)[0] || false;
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

  updateClient: function (updatedClient) {
    let client = this.findClient(updatedClient.id);
    client.onUpdateMove(client);
  }
};


