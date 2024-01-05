import { maskInfo } from "./utils.js";

export async function get() {
  const response = await fetch("http://localhost:3000/pcg");
  const executions = await response.json();
  const data = executions.map((item) => {
    let { email, name } = item;
    email = maskInfo(email);
    name = maskInfo(name);
    return { ...item, email, name };
  });

  console.log("All executions:", data);
}
// just testing
await get();
