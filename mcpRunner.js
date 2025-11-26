import { spawn } from "child_process";
import { MCPClient, StdioTransport } from "typescript-sdk";

/**
 * Start spec-kit-mcp and call a tool.
 */
export async function runSpeckitTool(tool, prompt) {
  if (!tool) throw new Error("tool is required");

  // Start the MCP server locally
  const proc = spawn("spec-kit-mcp", [], {
    stdio: ["pipe", "pipe", "pipe"]
  });

  // Wait briefly for it to boot
  await new Promise((r) => setTimeout(r, 1500));

  // Create STDIO MCP client
  const transport = new StdioTransport(proc.stdin, proc.stdout);
  const client = new MCPClient({
    name: "speckit-wrapper",
    version: "1.0",
    transport
  });

  await client.connect();

  const params = prompt ? { prompt } : {};
  const result = await client.call(tool, params);

  try {
    proc.kill();
  } catch {}

  return result;
}
