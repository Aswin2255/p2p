"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8080 });
let senderSocket = null;
let receiverSocket = null;
console.log('Server is running on port 8080');
wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'identify-as-sender') {
            console.log("Sender connected");
            senderSocket = ws;
        }
        else if (message.type === "identify-as-receiver") {
            console.log("Receiver connected");
            receiverSocket = ws;
        }
        else if (message.type === "create-offer") {
            console.log("Offer received");
            receiverSocket === null || receiverSocket === void 0 ? void 0 : receiverSocket.send(JSON.stringify({ type: "create-offer", sdp: message.sdp }));
        }
        else if (message.type === "create-answer") {
            console.log("Answer received");
            senderSocket === null || senderSocket === void 0 ? void 0 : senderSocket.send(JSON.stringify({ type: "create-answer", sdp: message.sdp }));
        }
        else if (message.type === "ice-candidate") {
            if (ws === senderSocket) {
                console.log("ICE candidate received from sender");
                receiverSocket === null || receiverSocket === void 0 ? void 0 : receiverSocket.send(JSON.stringify({ type: "ice-candidate", candidate: message.candidate }));
            }
            else if (ws === receiverSocket) {
                console.log("ICE candidate received from receiver");
                senderSocket === null || senderSocket === void 0 ? void 0 : senderSocket.send(JSON.stringify({ type: "ice-candidate", candidate: message.candidate }));
            }
        }
    });
});
