import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callPremiere, toolResult } from "../bridge.js";

export function registerScriptingTools(server: McpServer) {

  server.tool(
    "execute_extendscript",
    "Execute arbitrary ExtendScript code in Premiere Pro. Use for operations not covered by other tools. Returns the result as JSON.",
    {
      script: z.string().describe("ExtendScript code to execute. Must return a JSON.stringify'd result."),
    },
    async ({ script }) =>
      toolResult(await callPremiere("executeScript", [script]))
  );

  server.tool(
    "execute_qe_script",
    "Execute ExtendScript code using the QE (Quantum Engine) DOM. Enables access to internal Premiere functions not in the public API.",
    {
      script: z.string().describe("ExtendScript code using qe.* objects. Must return a JSON.stringify'd result."),
    },
    async ({ script }) =>
      toolResult(await callPremiere("executeScript", ["app.enableQE(); " + script]))
  );

  server.tool(
    "get_app_version",
    "Get the Premiere Pro application version and build info",
    {},
    async () => toolResult(await callPremiere("getAppVersion"))
  );

  server.tool(
    "undo",
    "Undo the last action in Premiere Pro",
    {},
    async () => toolResult(await callPremiere("undo"))
  );

  server.tool(
    "redo",
    "Redo the last undone action",
    {},
    async () => toolResult(await callPremiere("redo"))
  );
}
