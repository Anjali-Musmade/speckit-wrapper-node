/**
 * mcpRunner.js
 *
 * - Starts the spec-kit-mcp server as a child process
 * - Connects using the Node/TS MCP client over STDIO
 * - Calls a tool and returns the result object
 *
 * NOTE: You must have spec-kit-mcp installed on the host (e.g. via `cargo install spec-kit-mcp` in Dockerfile).
 *
 * The code below assumes the official MCP client is available.
 * If the package name changes, install it and update the import accordingly.
 */

import { spawn } from "child_process";
import { MCPClient, StdioTransport } from "typescript-sdk";


// Attempt to import the MCP client. If it's not found, throw a clear error at runtime.
let MCPClient, StdioTransport;
try {
  // Preferred package name (change if your environment uses a different MCP package)
  // Many repos use `@modelcontextprotocol/client` or `modelcontextprotocol` or similar.
  // If your environment uses a GitHub SDK, install it (see README).
  const mcp = await import("@modelcontextprotocol/client").catch(() => null);
  if (mcp && mcp.MCPClient && mcp.StdioTransport) {
    MCPClient = mcp.MCPClient;
    StdioTransport = mcp.StdioTransport;
  } else {
    // Try alternative export shapes
    const alt = await import("modelcontextprotocol").catch(() => null);
    if (alt && alt.MCPClient && alt.StdioTransport) {
      MCPClient = alt.MCPClient;
      StdioTransport = alt.StdioTransport;
    }
  }
} catch (e) {
  // we'll handle missing client at runtime
}

/**
 * Start spec-kit-mcp and call a tool.
 * Returns whatever the MCP tool returns (usually JSON + files)
 */
export async function runSpeckitTool(tool, prompt) {
  if (!tool) throw new Error("tool is required");

  // If MCP client not imported, fail fast with actionable message
  if (!MCPClient || !StdioTransport) {
    throw new Error(
      "MCP client library is not installed or not available. Install the official MCP JS client (see README)."
    );
  }

  // Start spec-kit-mcp as a child process
  const proc = spawn("spec-kit-mcp", [], {
    stdio: ["pipe", "pipe", "pipe"]
  });

  // If process immediately exits, capture stderr and throw
  proc.on("error", (err) => {
    console.error("spec-kit-mcp spawn error:", err);
  });

  // Wait a short time for server to be ready
  await new Promise((r) => setTimeout(r, 1500));

  // Create transport & client using the MCP client's STDIO transport
  const transport = new StdioTransport(proc.stdin, proc.stdout);
  const client = new MCPClient({ transport, name: "speckit-wrapper", version: "1.0" });

  await client.connect();

  // Call the tool
  const params = prompt ? { prompt } : {};
  const result = await client.call(tool, params);

  // Clean up process
  try {
    proc.kill();
  } catch (e) {
    // ignore
  }

  return result;
}
