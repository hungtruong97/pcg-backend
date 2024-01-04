export async function get() {
  const response = await fetch("http://localhost:3000/pcg");
  const executions = await response.json();
  console.log("All executions:", executions);
}
// just testing
await get();
