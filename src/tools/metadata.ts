import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callPremiere, toolResult } from "../bridge.js";

export function registerMetadataTools(server: McpServer) {

  server.tool(
    "get_clip_metadata",
    "Get all metadata (XMP) properties of a project item",
    {
      nodeId: z.string().describe("The nodeId of the project item"),
    },
    async ({ nodeId }) => toolResult(await callPremiere("getClipMetadata", [nodeId]))
  );

  server.tool(
    "set_clip_metadata",
    "Set a metadata (XMP) property on a project item",
    {
      nodeId: z.string().describe("The nodeId of the project item"),
      property: z.string().describe("XMP property name/path (e.g. 'dc:description', 'xmp:Label')"),
      value: z.string().describe("Value to set"),
    },
    async ({ nodeId, property, value }) =>
      toolResult(await callPremiere("setClipMetadata", [nodeId, property, value]))
  );

  server.tool(
    "get_xmp_metadata",
    "Get the raw XMP metadata XML of a project item",
    {
      nodeId: z.string().describe("The nodeId of the project item"),
    },
    async ({ nodeId }) => toolResult(await callPremiere("getXMPMetadata", [nodeId]))
  );

  server.tool(
    "set_xmp_metadata",
    "Set raw XMP metadata XML on a project item",
    {
      nodeId: z.string().describe("The nodeId of the project item"),
      xmpXml: z.string().describe("XMP metadata as XML string"),
    },
    async ({ nodeId, xmpXml }) =>
      toolResult(await callPremiere("setXMPMetadata", [nodeId, xmpXml]))
  );

  server.tool(
    "get_file_metadata",
    "Get technical file metadata (codec, resolution, frame rate, duration, file size, etc.)",
    {
      nodeId: z.string().describe("The nodeId of the project item"),
    },
    async ({ nodeId }) => toolResult(await callPremiere("getFileMetadata", [nodeId]))
  );

  server.tool(
    "set_clip_description",
    "Set the description/notes for a project item",
    {
      nodeId: z.string().describe("The nodeId of the project item"),
      description: z.string().describe("Description text"),
    },
    async ({ nodeId, description }) =>
      toolResult(await callPremiere("setClipDescription", [nodeId, description]))
  );

  server.tool(
    "set_project_item_label",
    "Set the label color on a project item",
    {
      nodeId: z.string().describe("The nodeId of the project item"),
      colorIndex: z.number().min(0).max(15).describe("Label color index (0-15)"),
    },
    async ({ nodeId, colorIndex }) =>
      toolResult(await callPremiere("setProjectItemLabel", [nodeId, colorIndex]))
  );

  server.tool(
    "get_clip_color_space",
    "Get the color space information of a project item",
    {
      nodeId: z.string().describe("The nodeId of the project item"),
    },
    async ({ nodeId }) => toolResult(await callPremiere("getClipColorSpace", [nodeId]))
  );

  server.tool(
    "set_override_frame_rate",
    "Override the interpreted frame rate of a project item",
    {
      nodeId: z.string().describe("The nodeId of the project item"),
      frameRate: z.number().describe("Frame rate to set (e.g. 23.976, 24, 29.97, 30, 60)"),
    },
    async ({ nodeId, frameRate }) =>
      toolResult(await callPremiere("setOverrideFrameRate", [nodeId, frameRate]))
  );

  server.tool(
    "set_override_pixel_aspect_ratio",
    "Override the pixel aspect ratio of a project item",
    {
      nodeId: z.string().describe("The nodeId of the project item"),
      numerator: z.number().describe("Pixel aspect ratio numerator"),
      denominator: z.number().describe("Pixel aspect ratio denominator"),
    },
    async ({ nodeId, numerator, denominator }) =>
      toolResult(await callPremiere("setOverridePixelAspectRatio", [nodeId, numerator, denominator]))
  );
}
