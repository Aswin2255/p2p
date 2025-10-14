"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8080 });
const GLOBAL_ROOM_ID = 1;
let room = [];
let senderSocket = null;
let receiverSocket = null;
let userQue = [];
const addUserToQueue = (ws) => {
    let newUser = {
        socket: ws,
    };
    userQue.push(newUser);
};
const addUserToRoom = (ws) => {
    let newUser = {
        socket: ws,
    };
    userQue.push(newUser);
    if (room.length && room.length < 2) {
        let newRoom = {
            roomId: GLOBAL_ROOM_ID,
        };
    }
};
let roomLogic = (ws) => {
    let findRoom = room.find((room) => room.roomId === GLOBAL_ROOM_ID);
    if (findRoom && findRoom.members && findRoom.members.length < 2) {
        console.log("room already there..");
        let reciever = { socket: ws, type: "reciever" };
        findRoom.members.push(reciever);
        let sender = findRoom.members.find((mem) => mem.type === 'sender');
        if (sender) {
            senderSocket = sender === null || sender === void 0 ? void 0 : sender.socket;
            senderSocket.send(JSON.stringify({ type: "create-offer", roomid: findRoom.roomId }));
        }
        console.log("receiver came");
    }
    else {
        console.log("new room created");
        let newRoom = {
            roomId: GLOBAL_ROOM_ID,
            members: [{ socket: ws, type: "sender" }]
        };
        senderSocket = ws;
        room.push(newRoom);
        senderSocket.send(JSON.stringify({ type: "waiting-for-other-user" }));
    }
};
console.log('Server is running on port 8080');
wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === "lobby") {
            console.log("user enter the loby..");
            roomLogic(ws);
        }
        else if (message.type === "send-offer") {
            console.log("sender sents offer...");
            let roomid = message.roomid;
            let sdp = message.sdp;
            let findRoom = room.find((room) => room.roomId === roomid);
            if (findRoom) {
                let reciver = findRoom.members.find((mem) => mem.type === "reciever");
                if (reciver) {
                    receiverSocket = reciver === null || reciver === void 0 ? void 0 : reciver.socket;
                    receiverSocket.send(JSON.stringify({ type: "create-answer", sdp: sdp, roomid: roomid }));
                }
            }
        }
        else if (message.type === "send-answer") {
            console.log("reciever sends answer");
            let roomid = message.roomid;
            let sdp = message.sdp;
            let findRoom = room.find((room) => room.roomId === roomid);
            if (findRoom) {
                let sender = findRoom.members.find((mem) => mem.type === "sender");
                if (sender) {
                    senderSocket = sender.socket;
                    senderSocket.send(JSON.stringify({ type: "send-answer", sdp: sdp, roomid: roomid }));
                }
            }
        }
        else if (message.type === "ice-candidate") {
            const { role } = message;
            let findRoom = room.find((room) => room.roomId === GLOBAL_ROOM_ID);
            if (role === "reciever") {
                if (findRoom) {
                    let reciever = findRoom.members.find((mem) => mem.type === "reciever");
                    if (reciever) {
                        receiverSocket = reciever.socket;
                        receiverSocket === null || receiverSocket === void 0 ? void 0 : receiverSocket.send(JSON.stringify({ type: "recieved-candidate", candidate: message.candidate, role }));
                    }
                }
            }
            else if (role === "sender") {
                if (findRoom) {
                    let sender = findRoom.members.find((mem) => mem.type === "sender");
                    if (sender) {
                        senderSocket = sender.socket;
                        senderSocket === null || senderSocket === void 0 ? void 0 : senderSocket.send(JSON.stringify({ type: "recieved-candidate", candidate: message.candidate, role }));
                    }
                }
            }
        }
        /*
        if(message.type === "join-room"){
            addUserToQueue(ws);
            if(userQue.length && userQue.length < 2){
                addUserToRoom(ws);
            }
        }
        if (message.type === 'identify-as-sender') {
            console.log("Sender connected");
           senderSocket = ws
        } else if (message.type === "identify-as-receiver"){
            console.log("Receiver connected");
            receiverSocket = ws
        }
        else if(message.type === "create-offer"){
            console.log("Offer received");
            receiverSocket?.send(JSON.stringify({type : "create-offer", sdp : message.sdp}))
        }
        else if(message.type === "create-answer"){
            console.log("Answer received");
            senderSocket?.send(JSON.stringify({type : "create-answer", sdp : message.sdp}))
        }
        else if (message.type === "ice-candidate"){
            if (ws === senderSocket){
                console.log("ICE candidate received from sender");
                receiverSocket?.send(JSON.stringify({type : "ice-candidate", candidate : message.candidate}))
            }
            else if (ws === receiverSocket){
                console.log("ICE candidate received from receiver");
                senderSocket?.send(JSON.stringify({type : "ice-candidate", candidate : message.candidate}))
            }
        }
            */
    });
});
