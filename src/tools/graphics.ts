import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callPremiere, toolResult } from "../bridge.js";

export function registerGraphicsTools(server: McpServer) {

  server.tool(
    "import_mogrt",
    "Import a Motion Graphics Template (.mogrt) file into the project",
    {
      mogrtPath: z.string().describe("Full path to the .mogrt file"),
    },
    async ({ mogrtPath }) =>
      toolResult(await callPremiere("importMogrt", [mogrtPath]))
  );

  server.tool(
    "add_mogrt_to_timeline",
    "Add a Motion Graphics Template (.mogrt) to the timeline",
    {
      mogrtPath: z.string().describe("Full path to the .mogrt file"),
      trackIndex: z.number().describe("Video track index"),
      startTime: z.number().describe("Start time in seconds"),
      duration: z.number().describe("Duration in seconds"),
    },
    async ({ mogrtPath, trackIndex, startTime, duration }) =>
      toolResult(await callPremiere("addMogrtToTimeline", [mogrtPath, trackIndex, startTime, duration]))
  );

  server.tool(
    "get_mogrt_properties",
    "Get the editable properties of a Motion Graphics clip on the timeline",
    {
      trackIndex: z.number().describe("Video track index"),
      clipIndex: z.number().describe("Clip index"),
    },
    async ({ trackIndex, clipIndex }) =>
      toolResult(await callPremiere("getMogrtProperties", [trackIndex, clipIndex]))
  );

  server.tool(
    "set_mogrt_property",
    "Set an editable property on a Motion Graphics clip (text, colors, etc.)",
    {
      trackIndex: z.number().describe("Video track index"),
      clipIndex: z.number().describe("Clip index"),
      propertyName: z.string().describe("Property name"),
      value: z.any().describe("Property value (string for text, number for numeric, etc.)"),
    },
    async ({ trackIndex, clipIndex, propertyName, value }) =>
      toolResult(await callPremiere("setMogrtProperty", [trackIndex, clipIndex, propertyName, value]))
  );

  server.tool(
    "add_text_graphic",
    "Add a text graphic (Essential Graphics) to the timeline",
    {
      text: z.string().describe("Text content"),
      trackIndex: z.number().describe("Video track index"),
      startTime: z.number().describe("Start time in seconds"),
      duration: z.number().describe("Duration in seconds"),
      fontSize: z.number().optional().describe("Font size in pixels"),
      fontFamily: z.string().optional().describe("Font family name"),
      color: z.string().optional().describe("Text color as hex (e.g. '#FFFFFF')"),
      positionX: z.number().optional().describe("X position (0-1 normalized, 0.5 = center)"),
      positionY: z.number().optional().describe("Y position (0-1 normalized, 0.5 = center)"),
      alignment: z.enum(["left", "center", "right"]).optional().describe("Text alignment"),
    },
    async (params) =>
      toolResult(await callPremiere("addTextGraphic", [
        params.text, params.trackIndex, params.startTime, params.duration,
        params.fontSize ?? 72, params.fontFamily || "Arial",
        params.color || "#FFFFFF", params.positionX ?? 0.5, params.positionY ?? 0.5,
        params.alignment || "center"
      ]))
  );

  server.tool(
    "add_color_matte",
    "Add a color matte (solid color) to the timeline",
    {
      trackIndex: z.number().describe("Video track index"),
      startTime: z.number().describe("Start time in seconds"),
      duration: z.number().describe("Duration in seconds"),
      color: z.string().optional().describe("Color as hex (e.g. '#000000' for black). Default: black"),
      name: z.string().optional().describe("Name for the color matte"),
    },
    async ({ trackIndex, startTime, duration, color, name }) =>
      toolResult(await callPremiere("addColorMatte", [
        trackIndex, startTime, duration, color || "#000000", name || "Color Matte"
      ]))
  );

  server.tool(
    "add_bars_and_tone",
    "Add color bars and tone to the timeline",
    {
      trackIndex: z.number().describe("Video track index"),
      startTime: z.number().describe("Start time in seconds"),
      duration: z.number().describe("Duration in seconds"),
    },
    async ({ trackIndex, startTime, duration }) =>
      toolResult(await callPremiere("addBarsAndTone", [trackIndex, startTime, duration]))
  );

  server.tool(
    "add_black_video",
    "Add black video (slug) to the timeline",
    {
      trackIndex: z.number().describe("Video track index"),
      startTime: z.number().describe("Start time in seconds"),
      duration: z.number().describe("Duration in seconds"),
    },
    async ({ trackIndex, startTime, duration }) =>
      toolResult(await callPremiere("addBlackVideo", [trackIndex, startTime, duration]))
  );

  server.tool(
    "add_universal_counting_leader",
    "Add a universal counting leader to the timeline",
    {
      trackIndex: z.number().describe("Video track index"),
      startTime: z.number().describe("Start time in seconds"),
    },
    async ({ trackIndex, startTime }) =>
      toolResult(await callPremiere("addUniversalCountingLeader", [trackIndex, startTime]))
  );

  const templateEnum = z.enum(["basic", "bold", "classic", "modern", "film", "lower_third"]).optional()
    .describe("MOGRT template style (default: bold). Options: basic, bold, classic, modern, film, lower_third");

  server.tool(
    "add_tiktok_caption",
    "Add a TikTok-style text caption to the timeline. Uses built-in Premiere Pro title MOGRTs. Great for adding big bold text overlays, word highlights, or captions.",
    {
      text: z.string().describe("Caption text to display"),
      trackIndex: z.number().describe("Video track index (use a track above your video, e.g. 1 or 2)"),
      startTime: z.number().describe("Start time in seconds"),
      duration: z.number().describe("Duration in seconds"),
      positionX: z.number().optional().describe("X position (0-1, default 0.5 = center)"),
      positionY: z.number().optional().describe("Y position (0-1, default 0.5 = center). Use 0.25 for top, 0.5 for middle, 0.75 for lower"),
      scale: z.number().optional().describe("Scale percentage (default 100). Use higher values like 150-200 for big TikTok-style text"),
      template: templateEnum,
    },
    async (params) =>
      toolResult(await callPremiere("addTikTokCaption", [
        params.text, params.trackIndex, params.startTime, params.duration,
        params.positionX ?? 0.5, params.positionY ?? 0.5, params.scale ?? 100,
        params.template || "bold"
      ]))
  );

  server.tool(
    "add_caption_sequence",
    "Add multiple timed text captions in sequence — perfect for word-by-word TikTok-style captions, lyrics sync, or subtitle-like overlays. Each caption has its own text, start time, and duration.",
    {
      captions: z.array(z.object({
        text: z.string().describe("Caption text"),
        start: z.number().describe("Start time in seconds"),
        duration: z.number().describe("Duration in seconds"),
      })).describe("Array of caption objects with text, start time, and duration"),
      trackIndex: z.number().describe("Video track index for all captions"),
      positionX: z.number().optional().describe("X position for all captions (0-1, default 0.5)"),
      positionY: z.number().optional().describe("Y position for all captions (0-1, default 0.75 = lower third area)"),
      scale: z.number().optional().describe("Scale percentage for all captions (default 100)"),
      template: templateEnum,
    },
    async (params) =>
      toolResult(await callPremiere("addCaptionSequence", [
        JSON.stringify(params.captions), params.trackIndex,
        params.template || "bold",
        params.positionX ?? 0.5, params.positionY ?? 0.75, params.scale ?? 100
      ]))
  );

  server.tool(
    "style_text_graphic",
    "Modify the text, position, scale, and opacity of an existing text/graphic clip on the timeline",
    {
      trackIndex: z.number().describe("Video track index"),
      clipIndex: z.number().describe("Clip index"),
      text: z.string().optional().describe("New text content"),
      positionX: z.number().optional().describe("X position (0-1)"),
      positionY: z.number().optional().describe("Y position (0-1)"),
      scale: z.number().optional().describe("Scale percentage"),
      opacity: z.number().optional().describe("Opacity (0-100)"),
    },
    async (params) =>
      toolResult(await callPremiere("styleTextGraphic", [
        params.trackIndex, params.clipIndex,
        params.text ?? null, params.positionX ?? null, params.positionY ?? null,
        params.scale ?? null, params.opacity ?? null
      ]))
  );

  server.tool(
    "get_available_mogrts",
    "List the built-in MOGRT text templates available for captions and titles",
    {},
    async () => toolResult(await callPremiere("getAvailableMogrts"))
  );
}
