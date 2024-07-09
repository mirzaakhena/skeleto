import { runClient } from "./app/client.js";
import { runServer } from "./app/server.js";

async function main() {
  //

  const input = process.argv[2];

  if (input === "client") {
    console.log("Running client application...");
    runClient();

    //
  } else if (input === "server") {
    console.log("Running server application...");
    runServer();

    //
  } else {
    console.log('Unknown argument. Please use "client" or "server".');
  }

  //
}

main();
