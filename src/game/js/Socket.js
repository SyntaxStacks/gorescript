GS.Socket = function() {
  let that = this;
  return {
    init: function() {
      let url = 'http://localhost:3030';
      // let url = 'http://socket.pixelrocketstudio.com';
      // let url = 'http://192.168.86.26:3030';
      GS.Socket.io = io(url);
      // GS.Socket.p2p = new P2P(GS.Socket.io);
    },
    close: function() {
      if (GS.Socket.io) {
        GS.Socket.io.close();
      }
    },
  };
}();
