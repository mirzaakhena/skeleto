import { printControllers } from "./infrastructure/controller.js";
import { createServer } from "./server.js";

async function main() {
  const { app, config, controllers } = await createServer();

  console.table(printControllers(controllers));

  app.listen(config.port, () => {
    console.log(`Server is running on : http://localhost:${config.port}`);
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
