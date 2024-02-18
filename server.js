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
fastify.post("/add", async (req, res) => {
  const { email, name } = req.body;

  //begin the transaction
  await db.run("BEGIN");

  try {
    //check if email exists in users table
    const userResult = await new Promise((resolve, reject) => {
      db.get(
        "SELECT COUNT(*) as count FROM users WHERE email = ?",
        [email],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row.count);
          }
        }
      );
    });

    //if email does not exist in the users table
    if (userResult === 0) {
      //add the new user in the users table
      await db.run("INSERT INTO users (email, name) VALUES (?,?)", [
        email,
        name,
      ]);
      //add the new user in the executions table with count = 1
      await db.run(
        "INSERT INTO executions (email, name, count) VALUES (?,?, 1)",
        [email, name]
      );
      await db.run("COMMIT");
      res.status(200).send({ Message: "User added", userResult: userResult });
    } else {
      //check if email and name exists in the executions table
      const executionsResult = await new Promise((resolve, reject) => {
        db.get(
          "SELECT COUNT(*) as count FROM executions WHERE EMAIL = ? AND NAME = ?",
          [email, name],
          (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row.count);
            }
          }
        );
      });

      //if the execution does not exist in the executions table
      if (executionsResult === 0) {
        throw new Error(
          "This email already exists, but maybe you got the wrong name?"
        );
      } else {
        //if the execution already exists
        await db.run(
          "UPDATE executions set COUNT = COUNT + 1 where email = ? and name =?",
          [email, name],
          (err, rows) => {
            if (err) {
              throw err;
            }
            res.status(200).send({
              Message:
                "This user already exists in the database. Execution count updated.",
            });
          }
        );
        await db.run("COMMIT");
      }
    }
  } catch (err) {
    //rollback transaction
    await db.run("ROLLBACK");
    res.status(500).send({ "Error Message": err.message });
  }
  return res;
});

try {
  await fastify.listen({ port: 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
