import React, { useEffect, useState, useRef } from "react";

function Reciever() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "identify-as-receiver" }));
    };
    const pc = new RTCPeerConnection();
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.send(
          JSON.stringify({ type: "ice-candidate", candidate: event.candidate })
        );
      }
    };
    pc.ontrack = (event) => {
      console.log("track received");
      console.log(event.track);
      const video = document.createElement("video");
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      document.body.appendChild(video);
      video.srcObject = new MediaStream([event.track]);
      video.play();
      console.log("video played");
     
     
    };
    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "create-offer") {
        pc.setRemoteDescription(message.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.send(
          JSON.stringify({ type: "create-answer", sdp: pc.localDescription })
        );
      } else if (message.type === "ice-candidate") {
        pc.addIceCandidate(message.candidate);
      }
    };
    setSocket(socket);
  }, []);
  return (
    <div>
      Reciever
    
    </div>
  );
}

export default Reciever;
