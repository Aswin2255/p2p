import React, {  useRef, useState } from 'react'

function Home() {
    const senderRef = useRef<HTMLVideoElement>(null);
    const receiverRef = useRef<HTMLVideoElement>(null);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [lobby, setLobby] = useState<boolean>(true);

    const startCall = async () => {
        const socket = new WebSocket("ws://localhost:8080");
        const senderPC = new RTCPeerConnection();
        const recieverPc = new RTCPeerConnection();
      
       
        socket.onopen = () => {
            socket.send(JSON.stringify({type : "lobby"}));
        }

        setSocket(socket)
        const stream = await navigator.mediaDevices.getUserMedia({video : true, audio : false});
        
        
        

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
         
            if(message.type === "waiting-for-other-user"){
                setLobby(true);
            }
            if(message.type === "create-offer"){
                let roomid = message.roomid
               
                senderPC.addTrack(stream.getVideoTracks()[0]);
               
                const offer = await senderPC.createOffer();
                await senderPC.setLocalDescription(offer);
                socket.send(JSON.stringify({type : "send-offer",roomid:roomid, sdp : senderPC.localDescription}));
            }
            else if(message.type === "create-answer"){
                let roomid = message.roomid
                let sdp = message.sdp
            recieverPc.setRemoteDescription(sdp)
                const answer = await recieverPc.createAnswer()
                await recieverPc.setLocalDescription(answer)
                socket.send(
                    JSON.stringify({type : "send-answer",roomid : roomid,sdp : recieverPc.localDescription})
                )
            }
            else if (message.type === "send-answer"){
                senderPC.setRemoteDescription(message.sdp) 
            }
            else if (message.type === "recieved-candidate"){
                console.log(message)
            }
           
        }
       
       
        



        senderPC.onicecandidate = (event) => {
            
            if(event.candidate){
                socket.send(JSON.stringify({type : "ice-candidate", candidate : event.candidate,role:"sender"}));
                console.log("sender sends ice")
            }
        }

        recieverPc.onicecandidate = (event)=>{
            if(event.candidate){
                socket.send(JSON.stringify({type : "ice-candidate",candidate : event.candidate,role : "reciever"}))
                console.log("reciever sends ice")
            }
        }
    
        
        if(senderRef?.current){
            senderRef.current.srcObject = stream;
            senderRef.current.play();
        }
      
       

        recieverPc.ontrack = (event) => {
            try {
                console.log("track received");
                let receiverStream = new MediaStream([event.track]);
                if(receiverRef?.current){
    
                    receiverRef.current.srcObject = receiverStream
                    receiverRef.current.play()
    
                }
               
                console.log("video played");
               
                
            } catch (error) {
                console.log(error)
                
            }
          
           
          };
        



  
 

    }
  return (
    <div>
        <button onClick={startCall}>
            Start The Call
        </button>
        <div style={{display : "flex", height:"500px"}}>
<div style={{width:"50%", height:"100%",border : "1px solid black"}}>
    <video ref={senderRef} style={{width:"100%", height:"100%"}}></video>
</div>
<div style={{width:"50%", height:"100%",border : "1px solid black"}}>
    {
        lobby ? <div>Waiting for another user to join..</div> :  <video ref={receiverRef} style={{width:"100%", height:"100%"}}></video>
    }
   
</div>
        </div>
    </div>
  )
}

export default Home