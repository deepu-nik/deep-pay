import { app } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

let server;
let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[server] ${signal} received; shutting down`);

  if (!server) {
    await disconnectDatabase().catch(() => {});
    process.exit(0);
  }

  server.close(async (error) => {
    if (error) {
      console.error("[server] HTTP shutdown failed", error);
      process.exit(1);
    }

    try {
      await disconnectDatabase();
      process.exit(0);
    } catch (disconnectError) {
      console.error("[server] MongoDB shutdown failed", disconnectError);
      process.exit(1);
    }
  });
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await connectDatabase();
  server = app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`[server] DeepPay API listening on port ${env.PORT}`);
    console.log(`[server] Environment: ${env.NODE_ENV}`);
  });
} catch (error) {
  console.error("[server] Startup failed", error);
  await disconnectDatabase().catch(() => {});
  process.exit(1);
}
