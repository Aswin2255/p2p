import {WebSocketServer, WebSocket} from 'ws';

const wss = new WebSocketServer({ port: 8080 });

const GLOBAL_ROOM_ID = 1

interface USER {
    socket : WebSocket;
}

interface ROOM {
    roomId : number;
    users : {
        socket : WebSocket;
    }[]
}

let senderSocket : null | WebSocket = null;
let receiverSocket : null | WebSocket = null;

let room : ROOM[] = [];
let userQue : USER[] = [];

const addUserToQueue = (ws: WebSocket)=>{
    let newUser = {
        socket : ws,
    }
    userQue.push(newUser);
}

const addUserToRoom = (ws: WebSocket)=>{
    let newUser = {
        socket : ws,
    }
    userQue.push(newUser);

    if(room.length && room.length < 2){
        let newRoom = {
            roomId : GLOBAL_ROOM_ID,

        }
    }
}



let roomLogic = ()=>{
    let newUser = userQue.shift();
    let findRoom = room.find((room) => room.roomId === GLOBAL_ROOM_ID);
if(findRoom && findRoom.users.length < 2 ){
    let newUser = userQue.shift();
    const newRoom = {
        roomId : GLOBAL_ROOM_ID,
        users : [{socket : newUser?.socket}]
    }


}
else{

}
}

console.log('Server is running on port 8080');

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('message', (data: any) => {
        const message = JSON.parse(data);
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

    })
})