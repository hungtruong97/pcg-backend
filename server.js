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

//Get users
fastify.get("/pcg", async (req, res) => {
  await db.all("SELECT * FROM executions", (err, rows) => {
    if (err) {
      throw err;
    }
    res.send(rows);
    console.log(rows);
  });
  return res;
});

//Upsert users
fastify.post("/pcg", async (req, res) => {
  const { email, name } = req.body;
  const sql =
    "INSERT INTO EXECUTIONS (EMAIL, NAME) VALUES (?,?) ON CONFLICT (EMAIL) DO UPDATE SET COUNT = COUNT + 1 ";
  await db.run(sql, [email, name], (err, rows) => {
    if (err) {
      res.status(500).send({ "error message": err });
      return res;
    }
    res.status(201).send({ status: "ok" });
  });
  console.log(email, name);
  return res;
});

try {
  await fastify.listen({ port: 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
