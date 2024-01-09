import Fastify from "fastify";
import sqlite3 from "sqlite3";
import { maskInfo } from "./utils.js";

const fastify = Fastify({ logger: true });
const db = new sqlite3.Database("pcg.sqlite");

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
    const maskedRows = rows.map((row) => {
      const email = maskInfo(row.email);
      const name = maskInfo(row.name);
      return { ...row, email, name };
    });
    res.send(maskedRows);
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
    res.status(200).send({ status: "ok" });
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
