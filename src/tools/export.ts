import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callPremiere, toolResult } from "../bridge.js";

export function registerExportTools(server: McpServer) {

  server.tool(
    "export_sequence",
    "Export/render the active sequence via Adobe Media Encoder",
    {
      outputPath: z.string().describe("Full output file path (e.g. 'C:/output/video.mp4')"),
      presetPath: z.string().describe("Path to an AME preset file (.epr)"),
      startTime: z.number().optional().describe("Export range start in seconds (omit for full sequence)"),
      endTime: z.number().optional().describe("Export range end in seconds (omit for full sequence)"),
      useInOut: z.boolean().optional().describe("Use sequence in/out points as export range (default: true if set)"),
    },
    async ({ outputPath, presetPath, startTime, endTime, useInOut }) =>
      toolResult(await callPremiere("exportSequence", [
        outputPath, presetPath, startTime ?? -1, endTime ?? -1, useInOut ?? false
      ]))
  );

  server.tool(
    "export_frame",
    "Export a single frame as an image (JPEG, PNG, TIFF, etc.)",
    {
      outputPath: z.string().describe("Full output file path (e.g. 'C:/output/frame.png')"),
      time: z.number().optional().describe("Time in seconds to capture (omit for current playhead position)"),
      format: z.enum(["png", "jpg", "tiff", "bmp", "tga", "dpx"]).optional().describe("Image format (default: png)"),
    },
    async ({ outputPath, time, format }) =>
      toolResult(await callPremiere("exportFrame", [outputPath, time ?? -1, format || "png"]))
  );

  server.tool(
    "export_aaf",
    "Export the active sequence as an AAF file (for Pro Tools, etc.)",
    {
      outputPath: z.string().describe("Full output file path (.aaf)"),
      mixdownAudio: z.boolean().optional().describe("Whether to mix down audio (default: false)"),
      explodeToMono: z.boolean().optional().describe("Whether to explode to mono (default: false)"),
      sampleRate: z.number().optional().describe("Sample rate in Hz (default: 48000)"),
      bitsPerSample: z.number().optional().describe("Bits per sample (default: 16)"),
    },
    async ({ outputPath, mixdownAudio, explodeToMono, sampleRate, bitsPerSample }) =>
      toolResult(await callPremiere("exportAAF", [
        outputPath, mixdownAudio || false, explodeToMono || false,
        sampleRate || 48000, bitsPerSample || 16
      ]))
  );

  server.tool(
    "export_omf",
    "Export the active sequence as an OMF file",
    {
      outputPath: z.string().describe("Full output file path (.omf)"),
      sampleRate: z.number().optional().describe("Sample rate in Hz (default: 48000)"),
      bitsPerSample: z.number().optional().describe("Bits per sample (default: 16)"),
      handleDuration: z.number().optional().describe("Handle duration in seconds"),
    },
    async ({ outputPath, sampleRate, bitsPerSample, handleDuration }) =>
      toolResult(await callPremiere("exportOMF", [
        outputPath, sampleRate || 48000, bitsPerSample || 16, handleDuration || 1
      ]))
  );

  server.tool(
    "export_edl",
    "Export the active sequence as an EDL file",
    {
      outputPath: z.string().describe("Full output file path (.edl)"),
      trackIndex: z.number().optional().describe("Video track index to export (default: 0)"),
    },
    async ({ outputPath, trackIndex }) =>
      toolResult(await callPremiere("exportEDL", [outputPath, trackIndex ?? 0]))
  );

  server.tool(
    "export_final_cut_xml",
    "Export the active sequence as Final Cut Pro XML",
    {
      outputPath: z.string().describe("Full output file path (.xml)"),
    },
    async ({ outputPath }) =>
      toolResult(await callPremiere("exportFinalCutXML", [outputPath]))
  );

  server.tool(
    "get_encoder_presets",
    "List available Adobe Media Encoder presets for export",
    {},
    async () => toolResult(await callPremiere("getEncoderPresets"))
  );

  server.tool(
    "render_sequence_preview",
    "Render preview files for the active sequence (or a range)",
    {
      startTime: z.number().optional().describe("Render range start in seconds"),
      endTime: z.number().optional().describe("Render range end in seconds"),
    },
    async ({ startTime, endTime }) =>
      toolResult(await callPremiere("renderSequencePreview", [startTime ?? -1, endTime ?? -1]))
  );

  server.tool(
    "export_direct",
    "Export/render the active sequence directly (synchronous, blocks Premiere until done - use for short sequences)",
    {
      outputPath: z.string().describe("Full output file path"),
      presetPath: z.string().describe("Path to an AME preset file (.epr)"),
    },
    async ({ outputPath, presetPath }) =>
      toolResult(await callPremiere("exportAsMediaDirect", [outputPath, presetPath]))
  );
}
