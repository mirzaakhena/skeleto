import WebSocket from "ws";

export function runClient() {
  // Create a new WebSocket client and connect to the server
  const ws = new WebSocket("ws://localhost:8080");

  // Listen for the open event
  ws.on("open", () => {
    console.log("Connected to the WebSocket server");

    // Send a message to the server
    ws.send("Hello, server!");
  });

  // Listen for messages from the server
  ws.on("message", (message) => {
    console.log(`Received message: ${message}`);
  });

  // Listen for the close event
  ws.on("close", () => {
    console.log("Disconnected from the server");
  });

  // Listen for errors
  ws.on("error", (error) => {
    console.error(`WebSocket error: ${error}`);
  });

  // Optionally, you can send messages interactively from the command line
  process.stdin.on("data", (input) => {
    const message = input.toString().trim();

    if (message === "quit") {
      ws.close();
      process.exit(0);
    }
    ws.send(message);
  });
}
