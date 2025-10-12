import React, {  useRef, useState } from 'react'

function Home() {
    const senderRef = useRef<HTMLVideoElement>(null);
    const receiverRef = useRef<HTMLVideoElement>(null);
    const [socket, setSocket] = useState<WebSocket | null>(null);

    const startCall = async () => {
        const socket = new WebSocket("ws://localhost:8080");
        socket.onopen = () => {
            socket.send(JSON.stringify({type : "join-room"}));
        }

        setSocket(socket)

        const pc = new RTCPeerConnection();


        pc.onnegotiationneeded = async () => {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.send(JSON.stringify({type : "create-offer", sdp : offer}));
        }
        pc.onicecandidate = (event) => {
            if(event.candidate){
                socket.send(JSON.stringify({type : "ice-candidate", candidate : event.candidate}));
            }
        }


        const stream = await navigator.mediaDevices.getUserMedia({video : true, audio : false});
        
        pc.addTrack(stream.getVideoTracks()[0]);
        if(senderRef?.current){
            senderRef.current.srcObject = stream;
            senderRef.current.play();
        }
        
  
 

    }
  return (
    <div>
        <button onClick={startCall}>
            Start The Call
        </button>
        <div style={{display : "flex", flexDirection : "column", gap : "10px"}}>
<div style={{width:"50%", height:"50%",border : "1px solid black"}}>
    <video ref={senderRef} style={{width:"100%", height:"100%"}}></video>
</div>
<div style={{width:"50%", height:"50%",border : "1px solid black"}}>
    <video ref={receiverRef} style={{width:"100%", height:"100%"}}></video>
</div>
        </div>
    </div>
  )
}

export default Home