import React, { useRef, useState } from "react";

function Home() {
  const senderRef = useRef<HTMLVideoElement>(null);
  const receiverRef = useRef<HTMLVideoElement>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lobby, setLobby] = useState<boolean>(false);
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [userRole, setUserRole] = useState<"sender" | "receiver">("sender");
  const [roomid, setRoomid] = useState<number | null>(null);

  // Use refs to track current values
  const roomidRef = useRef<number | null>(null);
  const userRoleRef = useRef<"sender" | "receiver">("sender");
  const streamRef = useRef<MediaStream | null>(null);
  const receiverStreamRef = useRef<MediaStream | null>(null);

  const startCall = async () => {
    const socket = new WebSocket("ws://localhost:8080");
    const pc = new RTCPeerConnection();
    setPeerConnection(pc);
    pc.onicecandidate = (event) => {
      console.log("ice candidate triggered ");

      if (event.candidate) {
        let roomid = roomidRef.current;
        let userRole = userRoleRef.current;
        socket.send(
          JSON.stringify({
            type: "send-ice-candidate",
            candidate: event.candidate,
            roomid: roomid,
            role: userRole,
          })
        );
        console.log("sender sends ice");
      }
    };

    pc.ontrack = (event) => {
      try {
        console.log("track received");
        console.log(userRoleRef.current);
        
        // Set the stream directly from the event
        if (receiverRef?.current) {
          if (!receiverRef.current.srcObject) {
            receiverRef.current.srcObject = event.streams[0];
          }
          console.log("Setting receiver video stream");
          receiverRef.current.play().catch(e => console.error("Play error:", e));
        }
      } catch (error) {
        console.log(error);
      }
    };
    
    //adding msg handeler
    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "waiting-for-other-user") {
        console.log("waiting for other user sender");
        roomidRef.current = message.roomid;
        userRoleRef.current = "sender";
        //setLobby(true);
        setUserRole("sender");
        setRoomid(message.roomid);
      } else if (message.type === "create-offer") {
        let roomid = message.roomid;
        const stream = streamRef.current;
        if (stream) {
          stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
          });
        } else {
          console.log("stream not found in sender");
        }

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.send(
          JSON.stringify({
            type: "send-offer",
            roomid: roomid,
            sdp: pc.localDescription,
          })
        );
      } else if (message.type === "create-answer") {
        //setLobby(true);
        roomidRef.current = message.roomid;
        userRoleRef.current = "receiver";
        setUserRole("receiver");
        console.log("created answer");
        let roomid = message.roomid;
        setRoomid(roomid);
        let sdp = message.sdp;
        pc.setRemoteDescription(sdp);
        const stream = streamRef.current;
        if (stream) {
          stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
          });
        } else {
         
        }
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("answer local des added");
        socket.send(
          JSON.stringify({
            type: "send-answer",
            roomid: roomid,
            sdp: pc.localDescription,
          })
        );
        console.log("reciever sends answer");
      } else if (message.type === "receiver-answer") {
        console.log("reciever answer received");
        //setLobby(false);
        await pc.setRemoteDescription(message.sdp);
      } else if (message.type === "add-ice-candidate") {
        await pc.addIceCandidate(message.candidate);
      } else {
        console.log("message type not found");
      }
    };

    socket.onopen = () => {
      console.log("socket opened waiting for camera permission");
    };
    setSocket(socket);
    //getting the media stream
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    streamRef.current = stream;

    socket.send(JSON.stringify({ type: "lobby" }));

    socket.onerror = (error) => {
      console.log("WebSocket error:", error); 
    };

    if (senderRef?.current) {
      senderRef.current.srcObject = streamRef.current;
      senderRef.current.play();
    }


  };
  return (
    <div>
      <button onClick={startCall}>Start The Call</button>
      <p>Room ID: {roomid}</p>
      <div style={{ display: "flex", height: "500px" }}>
        <div
          style={{ width: "50%", height: "100%", border: "1px solid black" }}
        >
          <video
            ref={senderRef}
            style={{ width: "100%", height: "100%" }}
          ></video>
        </div>
        <div
          style={{ width: "50%", height: "100%", border: "1px solid black" }}
        >
          <video
            autoPlay
            playsInline
            ref={receiverRef}
            style={{ width: "100%", height: "100%" }}
          ></video>
        </div>
      </div>
    </div>
  );
}

export default Home;
