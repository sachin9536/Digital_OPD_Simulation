import { io } from "socket.io-client";
const socket = io("ws://localhost:5000");
 // Change to your backend URL

export const sendMessageToServer = (sessionId, userMessage) => {
  return new Promise((resolve) => {
    socket.emit("chatMessage", { sessionId, role: "user", text: userMessage });

    socket.on("chatMessage", (message) => {
      resolve(message); // AI response
    });
  });
};

export default socket;
