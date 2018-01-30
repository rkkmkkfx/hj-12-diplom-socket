"use strict";

const webSocketsServerPort = process.env.PORT || 3000;

const webSocketServer = require('websocket').server;
const http = require('http');

const online = [];

const colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
colors.sort(() => { return Math.random() > 0.5; } );

let user;

function getID() {
  const id = Math.floor(Math.random()*90000) + 10000;
  let el = online.findIndex(user => user.id === id);
  if (el === -1) {
    return id
  } else {
    getID();
  }
}

const server = http.createServer((request, response) => {});
server.listen(webSocketsServerPort, function() {
  online.length = 0;
  console.log((new Date()) + " Server is listening on port "
    + webSocketsServerPort);
});

const wss = new webSocketServer({
  httpServer: server,
  maxReceivedFrameSize: 500000
});

wss.on('connect', () => console.log('Connected'));

wss.on('request', function(request) {
  console.log((new Date()) + ' Connection from origin '
    + request.origin + '.');

  const connection = request.accept(null, request.origin);

  console.log((new Date()) + ' Connection accepted.');
  // user sent some message
  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      const data = JSON.parse(message.utf8Data);
      if (data.type === 'login') {
        const index = (data.userID) ? data.userID : getID();
        user = {userpic: data.pic, color: colors.shift(), id: index, type: 'user'};
        online.push(user);
        connection.send(JSON.stringify(user));
        wss.broadcast(JSON.stringify({data: online, type: 'users'}));
      } else if (data.type === 'message') {
        wss.broadcast(JSON.stringify({data: data, type: 'message'}));
      } else if (data.type === 'close') {
        let i = online.findIndex(user => user.id === data.index);
        colors.push(online[i].color);
        online.splice(i, 1);
        wss.broadcast(JSON.stringify({data: online, type: 'users'}));
      }
    } else if (message.type === 'binary') {
      wss.broadcast(message.binaryData);
    }
  });
  // user disconnected
  connection.on('close', () => {
    console.log((new Date()) + " Peer disconnected.");
  });
});