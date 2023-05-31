const express = require('express');
const cors = require('cors')

const { ExpressPeerServer } = require('peer');
const app = express();

app.use(cors())

const server = app.listen(3001);
const peerServer = ExpressPeerServer(server, {
    debug:true,
    allow_discovery:true,
    proxied: true
});

app.use('/peerjs', peerServer);