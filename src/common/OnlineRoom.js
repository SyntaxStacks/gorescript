GS.OnlineRoom = function() {
  this.clients = [];
}

GS.OnlineRoom.prototype = {
	init: function() {
	},

  setupRoom: function (room) {
    this.clients = room.clients;
  },

  roomPing: function (room) {
    for (i in room.clients) {
      updatedClient = room.clients[i];
      let client = this.findClient(updatedClient.id);
      if (!client)) {
        this.addClient(client);
      } else {
        client.data.pos.x = updatedClient.x;
        client.data.pos.y  = updatedClient.x;
        client.data.pos.z = updatedClient.x;
        client.data.direction = updatedClient.direction;
      }
    }
  },

  addClient: function (client) {
    this.clients.push(client);
  },

  findClient: function (id) {
    return this.clients.filter((e) => e.id === id)[0] || false;
  },

  removeClient: function (id) {
    let client = this.findClient(id);
    this.clients.splice(this.clients.indexOf(client), 1);
  }
};


