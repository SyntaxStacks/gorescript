GS.Socket = function() {
  let that = this;
  return {
    init: function() {
      GS.Socket.io = io('http://localhost:3030');
      GS.Socket.p2p = new P2P(GS.Socket.io);
      let p2p = GS.Socket.p2p;

    },
    close: function() {
      if (GS.Socket.io) {
        GS.Socket.io.close();
      }
    },
  };
}();
