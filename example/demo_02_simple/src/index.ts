import { ActionHandler, newContext, Skeleto } from "skeleto";

async function main() {
  //

  const application = await Skeleto.getInstance().startScan("./src/app");

  console.log(JSON.stringify(application.getContainer().get("HelloWorld")?.funcMetadata));

  const helloworld = application.getContainer().get("HelloWorld")?.funcInstance as ActionHandler;

  const response = await helloworld(newContext(), { name: "Mirza" });

  console.log(response);

  //
}

main();
