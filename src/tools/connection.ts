import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { isConnected, getPort } from "../bridge.js";

export function registerConnectionTools(server: McpServer) {
  server.tool(
    "get_connection_status",
    "Check if Premiere Pro is connected to the MCP bridge",
    {},
    async () => ({
      content: [{
        type: "text",
        text: JSON.stringify({ connected: isConnected(), wsPort: getPort() }),
      }],
    })
  );
}
