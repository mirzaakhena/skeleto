import { ActionHandler, newContext, Skeleto } from "skeleto";

async function main() {
  //

  const application = await Skeleto.getInstance().startScan("./src/app");

  console.log(JSON.stringify(application.getContainer().get("HelloWorld")?.funcMetadata));

  const heloworld = application.getContainer().get("HelloWorld")?.funcInstance as ActionHandler;

  const response = await heloworld(newContext(), { name: "Mirza" });

  console.log(response);

  //
}

main();
