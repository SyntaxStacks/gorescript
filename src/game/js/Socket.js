GS.Socket = function() {
  let that = this;
  return {
    init: function() {
      GS.Socket.io = io('http://localhost:3030');
      GS.Socket.p2p = new P2P(GS.Socket.io);
      let p2p = GS.Socket.p2p;

      p2p.on('ready', function(){
        p2p.usePeerConnection = true;
        p2p.emit('peer-obj', { peerId: peerId });
        (GS.Socket.ready || (() => {}))();
      })

      // this event will be triggered over the socket transport
      // until `usePeerConnection` is set to `true`
      p2p.on('peer-msg', function(data){
        console.log(data);
      });

      p2p.on('get-rooms', function (data) {
        (GS.Socket.getRoomsCb || ((e) => {}))(data.rooms);
      });
    },
    joinRoom: function(room) {
      GS.Socket.p2p.emit('join-room', { roomName: room })
    },

    getRooms: function(room) {
      GS.Socket.p2p.emit('get-rooms', {})
    },
    close: function() {
      if (GS.Socket.io) {
        GS.Socket.io.close();
      }
    }
  };
}();
