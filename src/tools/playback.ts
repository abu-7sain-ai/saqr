import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callPremiere, toolResult } from "../bridge.js";

export function registerPlaybackTools(server: McpServer) {

  server.tool(
    "set_playhead",
    "Set the playhead (CTI) position on the active sequence",
    {
      time: z.number().describe("Time in seconds"),
    },
    async ({ time }) => toolResult(await callPremiere("setPlayhead", [time]))
  );

  server.tool(
    "get_playhead",
    "Get the current playhead position",
    {},
    async () => toolResult(await callPremiere("getPlayhead"))
  );

  server.tool(
    "play",
    "Start playback of the active sequence",
    {
      speed: z.number().optional().describe("Playback speed multiplier (1 = normal, -1 = reverse, 2 = 2x, etc.)"),
    },
    async ({ speed }) => toolResult(await callPremiere("play", [speed ?? 1]))
  );

  server.tool(
    "stop",
    "Stop playback of the active sequence",
    {},
    async () => toolResult(await callPremiere("stop"))
  );

  server.tool(
    "step_forward",
    "Step forward by a number of frames",
    {
      frames: z.number().optional().describe("Number of frames to step (default: 1)"),
    },
    async ({ frames }) => toolResult(await callPremiere("stepForward", [frames || 1]))
  );

  server.tool(
    "step_backward",
    "Step backward by a number of frames",
    {
      frames: z.number().optional().describe("Number of frames to step (default: 1)"),
    },
    async ({ frames }) => toolResult(await callPremiere("stepBackward", [frames || 1]))
  );

  server.tool(
    "go_to_in_point",
    "Move the playhead to the sequence in point",
    {},
    async () => toolResult(await callPremiere("goToInPoint"))
  );

  server.tool(
    "go_to_out_point",
    "Move the playhead to the sequence out point",
    {},
    async () => toolResult(await callPremiere("goToOutPoint"))
  );

  server.tool(
    "go_to_start",
    "Move the playhead to the start of the sequence",
    {},
    async () => toolResult(await callPremiere("goToStart"))
  );

  server.tool(
    "go_to_end",
    "Move the playhead to the end of the sequence",
    {},
    async () => toolResult(await callPremiere("goToEnd"))
  );

  server.tool(
    "go_to_next_edit",
    "Move the playhead to the next edit point (cut) on the timeline",
    {},
    async () => toolResult(await callPremiere("goToNextEdit"))
  );

  server.tool(
    "go_to_previous_edit",
    "Move the playhead to the previous edit point (cut) on the timeline",
    {},
    async () => toolResult(await callPremiere("goToPreviousEdit"))
  );

  server.tool(
    "open_in_source_monitor",
    "Open a project item in the Source Monitor",
    {
      nodeId: z.string().describe("The nodeId of the project item to open"),
    },
    async ({ nodeId }) => toolResult(await callPremiere("openInSourceMonitor", [nodeId]))
  );

  server.tool(
    "get_source_monitor_clip",
    "Get info about the clip currently loaded in the Source Monitor",
    {},
    async () => toolResult(await callPremiere("getSourceMonitorClip"))
  );

  server.tool(
    "set_source_in_out",
    "Set in and out points on the clip in the Source Monitor",
    {
      inPoint: z.number().optional().describe("In point in seconds"),
      outPoint: z.number().optional().describe("Out point in seconds"),
    },
    async ({ inPoint, outPoint }) =>
      toolResult(await callPremiere("setSourceInOut", [inPoint ?? -1, outPoint ?? -1]))
  );

  server.tool(
    "set_workspace",
    "Switch to a specific workspace layout",
    {
      workspaceName: z.string().describe("Name of the workspace (e.g. 'Editing', 'Color', 'Audio', 'Effects', 'Graphics')"),
    },
    async ({ workspaceName }) =>
      toolResult(await callPremiere("setWorkspace", [workspaceName]))
  );

  server.tool(
    "set_label_defaults",
    "Get the current zoom level and visible range of the timeline",
    {},
    async () => toolResult(await callPremiere("getTimelineZoom"))
  );
}
