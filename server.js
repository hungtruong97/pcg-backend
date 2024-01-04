import Fastify from "fastify";
import sqlite3 from "sqlite3";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { resolve, dirname } from "path";

const fastify = Fastify({ logger: true });
const db = new sqlite3.Database("pcg.sqlite");

// Resolve path to file
function resolvePath(path) {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  return resolve(__dirname, path);
}

// Health Check
fastify.get("/healthz", async () => {
  return { status: "ok" };
});

fastify.get("/pcg", async (req, res) => {
  await db.all("SELECT * FROM executions", (err, rows) => {
    if (err) {
      throw err;
    }
    res.send(rows);
  });
  return res;
});

fastify.get("/html.txt", () => {
  return readFileSync(resolvePath("html.txt"), "utf8");
});

try {
  await fastify.listen({ port: 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
