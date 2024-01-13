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

//Add users
fastify.post("/add", async (req, res) => {
  const { email, name } = req.body;

  const userResult = await db.get(
    "SELECT EXISTS(SELECT * FROM users WHERE email = ?)",
    [email]
  );
  const isUserExist = userResult;

  //if email does not exist in the users table
  try {
    if (isUserExist.count === 0) {
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
      // await db.run("COMMIT");
      res.status(200).send({ Message: "User added", userResult: userResult });
    } else {
      throw new Error("Error");
    }
  } catch (err) {
    res.send(500).send(err.message);
  }

  return res;
});

// //Upsert users
// fastify.post("/pcg", async (req, res) => {
//   const { email, name } = req.body;
//   // begin the transaction;
//   await db.run("BEGIN");

//   try {
//     //check if email exists in users table
//     const userResult = await db.get(
//       "SELECT COUNT(*) as count FROM users WHERE email = ?",
//       [email]
//     );
//     const isUserExist = userResult.count;

//     //if email does not exist in the users table
//     if (isUserExist === 0) {
//       //add the new user in the users table
//       await db.run("INSERT INTO users (email, name) VALUES (?,?)", [
//         email,
//         name,
//       ]);
//       //add the new user in the executions table with count = 1
//       await db.run(
//         "INSERT INTO executions (email, name, count) VALUES (?,?, 1)",
//         [email, name]
//       );
//       // await db.run("COMMIT");
//       res.status(200).send({ Message: "User added", userResult: userResult });
//     } else {
//       //check if email and name exists in the executions table
//       const executionsResult = await db.get(
//         "SELECT COUNT(*) as count FROM executions WHERE EMAIL = ? AND NAME = ?",
//         [email, name]
//       );

//       //if the execution does not exist in the executions table
//       if (executionsResult.count === 0) {
//         throw new Error("This user already exists");
//       } else {
//         //if the execution already exists
//         await db.run(
//           "UPDATE executions set COUNT = COUNT + 1 where email = ? and name =?",
//           [email, name]
//         );
//         //commit the transaction
//         // await db.run("COMMIT");
//         res
//           .status(200)
//           .send({ Message: "Execution count updated", userResult: userResult });
//       }
//     }
//   } catch (err) {
//     //rollback transaction;
//     console.log(err);
//     await db.run("ROLLBACK");
//     res.status(500).send({ "Error message": err.message });
//   }
//   console.log(email, name);
//   return res;
// });

try {
  await fastify.listen({ port: 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
