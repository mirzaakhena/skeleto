// src/index.ts

import { ActionHandler, newContext, Skeleto } from "skeleto";

async function main() {
  const application = await Skeleto.start("./src/app");
  const heloworld = application.getContainer().get("HelloWorld")?.getInstance() as ActionHandler;
  {
    const response = await heloworld(newContext(), { name: "asep" });
    console.log(response.message);
  }
  {
    const response = await heloworld(newContext(), { name: "john" });
    console.log(response.message);
  }
}

main();
