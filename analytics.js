import { maskInfo } from "../pcg/utils.js/index.js";

export async function get() {
  const response = await fetch("http://localhost:3000/pcg");
  const executions = await response.json();
  const data = executions.map((item) => {
    let { email, name } = item;
    email = maskInfo(email);
    name = maskInfo(name);
    return { ...item, email, name };
  });
  const totalCount = data.reduce((count, item) => {
    count + item.count;
  }, 0);
  return `pcg has been executed for ${totalCount}`;

  console.log("All executions:", data);
}
