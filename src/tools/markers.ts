import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callPremiere, toolResult } from "../bridge.js";

const markerColorSchema = z.enum([
  "green", "red", "purple", "orange", "yellow", "white", "blue", "cyan"
]).describe("Marker color");

export function registerMarkerTools(server: McpServer) {

  server.tool(
    "add_marker",
    "Add a marker to the active sequence",
    {
      time: z.number().describe("Time in seconds to place the marker"),
      name: z.string().optional().describe("Marker name"),
      comment: z.string().optional().describe("Marker comment/notes"),
      color: markerColorSchema.optional().describe("Marker color (default: green)"),
      duration: z.number().optional().describe("Marker duration in seconds (0 for point marker)"),
      markerType: z.enum(["comment", "chapter", "segmentation", "webLink", "flashCuePoint"]).optional().describe("Marker type (default: comment)"),
      url: z.string().optional().describe("URL for webLink markers"),
      frameTarget: z.string().optional().describe("Frame target for webLink markers"),
    },
    async ({ time, name, comment, color, duration, markerType, url, frameTarget }) =>
      toolResult(await callPremiere("addMarker", [
        time, name || "", comment || "", color || "green", duration || 0,
        markerType || "comment", url || "", frameTarget || ""
      ]))
  );

  server.tool(
    "get_markers",
    "Get all markers on the active sequence",
    {},
    async () => toolResult(await callPremiere("getMarkers"))
  );

  server.tool(
    "remove_marker",
    "Remove a specific marker from the active sequence by index",
    {
      markerIndex: z.number().describe("Index of the marker to remove (0-based, in time order)"),
    },
    async ({ markerIndex }) => toolResult(await callPremiere("removeMarker", [markerIndex]))
  );

  server.tool(
    "update_marker",
    "Update properties of an existing marker",
    {
      markerIndex: z.number().describe("Index of the marker to update"),
      name: z.string().optional().describe("New marker name"),
      comment: z.string().optional().describe("New marker comment"),
      color: markerColorSchema.optional().describe("New marker color"),
      duration: z.number().optional().describe("New marker duration in seconds"),
    },
    async ({ markerIndex, name, comment, color, duration }) =>
      toolResult(await callPremiere("updateMarker", [
        markerIndex, name ?? null, comment ?? null, color ?? null, duration ?? -1
      ]))
  );

  server.tool(
    "clear_all_markers",
    "Remove all markers from the active sequence",
    {},
    async () => toolResult(await callPremiere("clearAllMarkers"))
  );

  server.tool(
    "add_clip_marker",
    "Add a marker to a specific clip on the timeline",
    {
      trackType: z.enum(["video", "audio"]).describe("Track type"),
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
      time: z.number().describe("Time in seconds relative to clip start"),
      name: z.string().optional().describe("Marker name"),
      comment: z.string().optional().describe("Marker comment"),
      color: markerColorSchema.optional().describe("Marker color"),
    },
    async ({ trackType, trackIndex, clipIndex, time, name, comment, color }) =>
      toolResult(await callPremiere("addClipMarker", [
        trackType, trackIndex, clipIndex, time, name || "", comment || "", color || "green"
      ]))
  );

  server.tool(
    "get_clip_markers",
    "Get all markers on a specific clip",
    {
      trackType: z.enum(["video", "audio"]).describe("Track type"),
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
    },
    async ({ trackType, trackIndex, clipIndex }) =>
      toolResult(await callPremiere("getClipMarkers", [trackType, trackIndex, clipIndex]))
  );

  server.tool(
    "add_project_item_marker",
    "Add a marker to a project item (source clip, not timeline)",
    {
      nodeId: z.string().describe("The nodeId of the project item"),
      time: z.number().describe("Time in seconds"),
      name: z.string().optional().describe("Marker name"),
      comment: z.string().optional().describe("Marker comment"),
      color: markerColorSchema.optional().describe("Marker color"),
    },
    async ({ nodeId, time, name, comment, color }) =>
      toolResult(await callPremiere("addProjectItemMarker", [
        nodeId, time, name || "", comment || "", color || "green"
      ]))
  );
}
