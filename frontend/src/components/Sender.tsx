import React, { useEffect, useState } from 'react'

function Sender() {
  const [socket,setSocket] = useState<WebSocket | null>(null)
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080')
    socket.onopen = () => {
      socket.send(JSON.stringify({type : "identify-as-sender"}))
    }
    setSocket(socket)
  }, [])
  const sendVideo = async ()=>{
    if(!socket) return
    const pc = new RTCPeerConnection() //create new peer connection

    pc.onnegotiationneeded = async ()=>{
      const offer = await pc.createOffer() //create offer
      await pc.setLocalDescription(offer) //set local description
      socket?.send(JSON.stringify({type : "create-offer", sdp : pc.localDescription})) //send offer to server
    }


    //sending ice candidate to server
    pc.onicecandidate = (event)=>{
      if(event.candidate){
        socket?.send(JSON.stringify({type : "ice-candidate", candidate : event.candidate}))
      }
    }

    

    socket.onmessage = async (event)=>{
      const message = JSON.parse(event.data)
      if(message.type === "create-answer"){
        console.log("answer received");
        pc.setRemoteDescription(message.sdp) //recieve answer from server and set remote description
      }
      else if(message.type === "ice-candidate"){
        console.log("ice candidate received");
        pc.addIceCandidate(message.candidate)
      }
    }
    const stream = await navigator.mediaDevices.getUserMedia({video : true, audio : false})
    console.log("stream", stream);
    pc.addTrack(stream.getVideoTracks()[0])
    const video = document.createElement("video")
    video.autoplay = true
    video.playsInline = true
    video.muted = true
    document.body.appendChild(video)
    video.srcObject = stream
    video.play()
  }
  return (
    <div>Sender
      <button onClick={sendVideo}>Send Video</button>
    </div>
  )
}

export default Sender