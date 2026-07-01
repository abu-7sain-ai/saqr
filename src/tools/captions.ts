import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callPremiere, toolResult } from "../bridge.js";

export function registerCaptionTools(server: McpServer) {

  server.tool(
    "get_caption_tracks",
    "Get all caption/subtitle tracks on the active sequence",
    {},
    async () => toolResult(await callPremiere("getCaptionTracks"))
  );

  server.tool(
    "add_caption_track",
    "Add a new caption/subtitle track to the active sequence",
    {
      format: z.enum(["srt", "cea608", "cea708", "teletext", "open"]).optional().describe("Caption format (default: open/burned-in)"),
    },
    async ({ format }) =>
      toolResult(await callPremiere("addCaptionTrack", [format || "open"]))
  );

  server.tool(
    "add_caption",
    "Add a caption/subtitle segment to a caption track",
    {
      trackIndex: z.number().optional().describe("Caption track index (default: 0)"),
      startTime: z.number().describe("Start time in seconds"),
      endTime: z.number().describe("End time in seconds"),
      text: z.string().describe("Caption text content"),
    },
    async ({ trackIndex, startTime, endTime, text }) =>
      toolResult(await callPremiere("addCaption", [trackIndex ?? 0, startTime, endTime, text]))
  );

  server.tool(
    "get_captions",
    "Get all caption segments from a caption track",
    {
      trackIndex: z.number().optional().describe("Caption track index (default: 0)"),
    },
    async ({ trackIndex }) =>
      toolResult(await callPremiere("getCaptions", [trackIndex ?? 0]))
  );

  server.tool(
    "update_caption",
    "Update the text or timing of an existing caption segment",
    {
      trackIndex: z.number().describe("Caption track index"),
      captionIndex: z.number().describe("Caption segment index"),
      text: z.string().optional().describe("New caption text"),
      startTime: z.number().optional().describe("New start time in seconds"),
      endTime: z.number().optional().describe("New end time in seconds"),
    },
    async ({ trackIndex, captionIndex, text, startTime, endTime }) =>
      toolResult(await callPremiere("updateCaption", [
        trackIndex, captionIndex, text ?? null, startTime ?? -1, endTime ?? -1
      ]))
  );

  server.tool(
    "remove_caption",
    "Remove a caption segment",
    {
      trackIndex: z.number().describe("Caption track index"),
      captionIndex: z.number().describe("Caption segment index"),
    },
    async ({ trackIndex, captionIndex }) =>
      toolResult(await callPremiere("removeCaption", [trackIndex, captionIndex]))
  );

  server.tool(
    "import_captions",
    "Import captions from an SRT, SCC, or MCC file",
    {
      filePath: z.string().describe("Path to the caption file (.srt, .scc, .mcc)"),
    },
    async ({ filePath }) =>
      toolResult(await callPremiere("importCaptions", [filePath]))
  );

  server.tool(
    "export_captions",
    "Export captions to a file (SRT, SCC, MCC, etc.)",
    {
      outputPath: z.string().describe("Output file path"),
      format: z.enum(["srt", "scc", "mcc", "stl", "dfxp"]).optional().describe("Export format (default: srt)"),
      trackIndex: z.number().optional().describe("Caption track index to export (default: 0)"),
    },
    async ({ outputPath, format, trackIndex }) =>
      toolResult(await callPremiere("exportCaptions", [outputPath, format || "srt", trackIndex ?? 0]))
  );

  server.tool(
    "transcribe_sequence",
    "Start automatic speech-to-text transcription of the active sequence (Premiere Pro 2021+)",
    {},
    async () => toolResult(await callPremiere("transcribeSequence"))
  );
}
