import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callPremiere, toolResult } from "../bridge.js";

export function registerProjectTools(server: McpServer) {

  server.tool(
    "get_project_info",
    "Get information about the currently open Premiere Pro project (name, path, sequences count, items count, scratch disk paths)",
    {},
    async () => toolResult(await callPremiere("getProjectInfo"))
  );

  server.tool(
    "save_project",
    "Save the current Premiere Pro project",
    {},
    async () => toolResult(await callPremiere("saveProject"))
  );

  server.tool(
    "save_project_as",
    "Save the current project to a new location",
    { path: z.string().describe("Full file path for the new project file (.prproj)") },
    async ({ path }) => toolResult(await callPremiere("saveProjectAs", [path]))
  );

  server.tool(
    "open_project",
    "Open an existing Premiere Pro project",
    { path: z.string().describe("Full path to the .prproj file") },
    async ({ path }) => toolResult(await callPremiere("openProject", [path]))
  );

  server.tool(
    "close_project",
    "Close the current project (with optional save)",
    {
      save: z.boolean().optional().describe("Whether to save before closing (default: true)"),
    },
    async ({ save }) => toolResult(await callPremiere("closeProject", [save !== false]))
  );

  server.tool(
    "import_media",
    "Import media files into the project",
    {
      filePaths: z.array(z.string()).describe("Array of absolute file paths to import"),
      targetBinPath: z.string().optional().describe("Target bin/folder path (e.g. 'Footage/Interviews')"),
      importAsNumberedStills: z.boolean().optional().describe("Import image sequences as numbered stills"),
    },
    async ({ filePaths, targetBinPath, importAsNumberedStills }) =>
      toolResult(await callPremiere("importMedia", [JSON.stringify(filePaths), targetBinPath || "", importAsNumberedStills || false]))
  );

  server.tool(
    "import_sequences",
    "Import sequences from another Premiere Pro project",
    {
      projectPath: z.string().describe("Path to the source .prproj file"),
      sequenceIds: z.array(z.string()).optional().describe("Specific sequence IDs to import (omit for all)"),
    },
    async ({ projectPath, sequenceIds }) =>
      toolResult(await callPremiere("importSequences", [projectPath, JSON.stringify(sequenceIds || [])]))
  );

  server.tool(
    "get_project_items",
    "List all items (clips, bins, sequences) in the project panel",
    {
      binPath: z.string().optional().describe("Path to a specific bin, or empty for root"),
      recursive: z.boolean().optional().describe("Whether to list items recursively (default: false)"),
    },
    async ({ binPath, recursive }) =>
      toolResult(await callPremiere("getProjectItems", [binPath || "", recursive || false]))
  );

  server.tool(
    "get_project_item_info",
    "Get detailed info about a specific project item (duration, frame rate, codec, dimensions, media path, etc.)",
    {
      nodeId: z.string().describe("The nodeId of the project item"),
    },
    async ({ nodeId }) => toolResult(await callPremiere("getProjectItemInfo", [nodeId]))
  );

  server.tool(
    "create_bin",
    "Create a new bin (folder) in the project panel",
    {
      name: z.string().describe("Name for the new bin"),
      parentBinPath: z.string().optional().describe("Parent bin path (empty for root)"),
    },
    async ({ name, parentBinPath }) =>
      toolResult(await callPremiere("createBin", [name, parentBinPath || ""]))
  );

  server.tool(
    "rename_project_item",
    "Rename a project item (clip, bin, sequence)",
    {
      nodeId: z.string().describe("The nodeId of the item to rename"),
      newName: z.string().describe("New name"),
    },
    async ({ nodeId, newName }) =>
      toolResult(await callPremiere("renameProjectItem", [nodeId, newName]))
  );

  server.tool(
    "delete_project_items",
    "Delete project items from the project panel",
    {
      nodeIds: z.array(z.string()).describe("Array of nodeIds to delete"),
    },
    async ({ nodeIds }) =>
      toolResult(await callPremiere("deleteProjectItems", [JSON.stringify(nodeIds)]))
  );

  server.tool(
    "move_project_item",
    "Move a project item to a different bin",
    {
      nodeId: z.string().describe("The nodeId of the item to move"),
      targetBinPath: z.string().describe("Target bin path"),
    },
    async ({ nodeId, targetBinPath }) =>
      toolResult(await callPremiere("moveProjectItem", [nodeId, targetBinPath]))
  );

  server.tool(
    "set_project_item_in_out",
    "Set in and out points on a project item (source clip)",
    {
      nodeId: z.string().describe("The nodeId of the project item"),
      inPoint: z.number().describe("In point in seconds"),
      outPoint: z.number().describe("Out point in seconds"),
    },
    async ({ nodeId, inPoint, outPoint }) =>
      toolResult(await callPremiere("setProjectItemInOut", [nodeId, inPoint, outPoint]))
  );

  server.tool(
    "clear_project_item_in_out",
    "Clear in/out points on a project item",
    {
      nodeId: z.string().describe("The nodeId of the project item"),
    },
    async ({ nodeId }) => toolResult(await callPremiere("clearProjectItemInOut", [nodeId]))
  );

  server.tool(
    "create_proxy",
    "Create proxy media for a project item",
    {
      nodeId: z.string().describe("The nodeId of the project item"),
      presetPath: z.string().describe("Path to proxy preset (.epr)"),
    },
    async ({ nodeId, presetPath }) =>
      toolResult(await callPremiere("createProxy", [nodeId, presetPath]))
  );

  server.tool(
    "attach_proxy",
    "Attach existing proxy media to a project item",
    {
      nodeId: z.string().describe("The nodeId of the original project item"),
      proxyPath: z.string().describe("Path to the proxy media file"),
    },
    async ({ nodeId, proxyPath }) =>
      toolResult(await callPremiere("attachProxy", [nodeId, proxyPath]))
  );

  server.tool(
    "toggle_proxy_mode",
    "Toggle between proxy and full-resolution media globally",
    {
      enable: z.boolean().describe("True to enable proxies, false to use full-res"),
    },
    async ({ enable }) => toolResult(await callPremiere("toggleProxyMode", [enable]))
  );

  server.tool(
    "refresh_media",
    "Refresh/relink media for a project item (useful after media files are updated on disk)",
    {
      nodeId: z.string().describe("The nodeId of the project item"),
    },
    async ({ nodeId }) => toolResult(await callPremiere("refreshMedia", [nodeId]))
  );

  server.tool(
    "find_project_items",
    "Search project items by name pattern",
    {
      query: z.string().describe("Search query (matches against item name)"),
      type: z.enum(["all", "clip", "bin", "sequence"]).optional().describe("Filter by item type"),
    },
    async ({ query, type }) =>
      toolResult(await callPremiere("findProjectItems", [query, type || "all"]))
  );

  server.tool(
    "set_project_settings",
    "Modify project settings (scratch disks, etc.)",
    {
      scratchDiskPath: z.string().optional().describe("Path for scratch disk / cache files"),
      gpuRenderer: z.enum(["Mercury Playback Engine GPU Acceleration (CUDA)", "Mercury Playback Engine GPU Acceleration (OpenCL)", "Mercury Playback Engine Software Only"]).optional().describe("GPU renderer to use"),
    },
    async ({ scratchDiskPath, gpuRenderer }) =>
      toolResult(await callPremiere("setProjectSettings", [scratchDiskPath || "", gpuRenderer || ""]))
  );

  server.tool(
    "create_sub_clip",
    "Create a sub-clip from a project item with specific in/out points",
    {
      nodeId: z.string().describe("The nodeId of the source project item"),
      name: z.string().describe("Name for the sub-clip"),
      inPoint: z.number().describe("In point in seconds"),
      outPoint: z.number().describe("Out point in seconds"),
      hardBoundaries: z.boolean().optional().describe("Lock sub-clip boundaries (default: true)"),
    },
    async ({ nodeId, name, inPoint, outPoint, hardBoundaries }) =>
      toolResult(await callPremiere("createSubClip", [nodeId, name, inPoint, outPoint, hardBoundaries !== false]))
  );

  server.tool(
    "relink_media",
    "Relink a project item to a different media file on disk",
    {
      nodeId: z.string().describe("The nodeId of the project item to relink"),
      newPath: z.string().describe("New media file path"),
    },
    async ({ nodeId, newPath }) =>
      toolResult(await callPremiere("relinkMedia", [nodeId, newPath]))
  );

  server.tool(
    "import_ae_comps",
    "Import After Effects compositions into the project",
    {
      aepPath: z.string().describe("Path to the After Effects project (.aep)"),
      compNames: z.array(z.string()).optional().describe("Specific composition names to import (omit for all)"),
      targetBinPath: z.string().optional().describe("Target bin path"),
    },
    async ({ aepPath, compNames, targetBinPath }) =>
      toolResult(await callPremiere("importAEComps", [aepPath, JSON.stringify(compNames || []), targetBinPath || ""]))
  );

  server.tool(
    "consolidate_duplicates",
    "Consolidate duplicate media in the project",
    {},
    async () => toolResult(await callPremiere("consolidateDuplicates"))
  );

  server.tool(
    "get_project_item_type_info",
    "Check if a project item is an adjustment layer, sequence, merged clip, or multicam clip",
    {
      nodeId: z.string().describe("The nodeId of the project item"),
    },
    async ({ nodeId }) => toolResult(await callPremiere("getProjectItemTypeInfo", [nodeId]))
  );

  server.tool(
    "set_scale_to_frame_size",
    "Enable 'Scale to Frame Size' on a project item",
    {
      nodeId: z.string().describe("The nodeId of the project item"),
    },
    async ({ nodeId }) => toolResult(await callPremiere("setScaleToFrameSize", [nodeId]))
  );

  server.tool(
    "flush_cache",
    "Flush the media cache (useful to free disk space or resolve cache issues)",
    {},
    async () => toolResult(await callPremiere("flushCache"))
  );
}
