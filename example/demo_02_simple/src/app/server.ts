import { WebSocketServer } from "ws";

export function runServer() {
  // Create a new WebSocket server
  const wss = new WebSocketServer({ port: 8080 });

  console.log("WebSocket server is running on ws://localhost:8080");

  // Listen for connection events
  wss.on("connection", (ws) => {
    console.log("New client connected");

    // Listen for messages from the client
    ws.on("message", (message) => {
      console.log(`Received message: ${message}`);

      // Echo the received message back to the client
      ws.send(`Server received: ${message}`);
    });

    // Listen for the close event
    ws.on("close", () => {
      console.log("Client disconnected");
    });

    // Listen for errors
    ws.on("error", (error) => {
      console.error(`WebSocket error: ${error}`);
    });
  });
}
