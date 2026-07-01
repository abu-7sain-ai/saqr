import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callPremiere, toolResult } from "../bridge.js";

export function registerSequenceTools(server: McpServer) {

  server.tool(
    "get_sequences",
    "List all sequences in the current project with their properties",
    {},
    async () => toolResult(await callPremiere("getSequences"))
  );

  server.tool(
    "get_active_sequence",
    "Get detailed info about the currently active sequence (tracks, position, settings)",
    {},
    async () => toolResult(await callPremiere("getActiveSequence"))
  );

  server.tool(
    "set_active_sequence",
    "Set a sequence as the active/open sequence by name or index",
    {
      sequenceName: z.string().optional().describe("Name of the sequence to activate"),
      sequenceIndex: z.number().optional().describe("Index of the sequence to activate"),
    },
    async ({ sequenceName, sequenceIndex }) =>
      toolResult(await callPremiere("setActiveSequence", [sequenceName || "", sequenceIndex ?? -1]))
  );

  server.tool(
    "create_sequence",
    "Create a new sequence",
    {
      name: z.string().describe("Name for the new sequence"),
      presetPath: z.string().optional().describe("Path to a .sqpreset file. Omit for default settings."),
    },
    async ({ name, presetPath }) =>
      toolResult(await callPremiere("createSequence", [name, presetPath || ""]))
  );

  server.tool(
    "create_sequence_from_clip",
    "Create a new sequence matching a clip's settings (resolution, frame rate, etc.)",
    {
      nodeId: z.string().describe("The nodeId of the project item to base the sequence on"),
    },
    async ({ nodeId }) => toolResult(await callPremiere("createSequenceFromClip", [nodeId]))
  );

  server.tool(
    "clone_sequence",
    "Duplicate an existing sequence",
    {
      sequenceName: z.string().optional().describe("Name of the sequence to clone"),
      newName: z.string().optional().describe("Name for the cloned sequence"),
    },
    async ({ sequenceName, newName }) =>
      toolResult(await callPremiere("cloneSequence", [sequenceName || "", newName || ""]))
  );

  server.tool(
    "delete_sequence",
    "Delete a sequence from the project",
    {
      sequenceId: z.string().describe("The sequence ID to delete"),
    },
    async ({ sequenceId }) => toolResult(await callPremiere("deleteSequence", [sequenceId]))
  );

  server.tool(
    "get_sequence_settings",
    "Get detailed settings of the active sequence (frame rate, resolution, pixel aspect ratio, field type, etc.)",
    {},
    async () => toolResult(await callPremiere("getSequenceSettings"))
  );

  server.tool(
    "set_sequence_in_out",
    "Set in and out points on the active sequence (for export range, etc.)",
    {
      inPoint: z.number().optional().describe("In point in seconds (-1 to clear)"),
      outPoint: z.number().optional().describe("Out point in seconds (-1 to clear)"),
    },
    async ({ inPoint, outPoint }) =>
      toolResult(await callPremiere("setSequenceInOut", [inPoint ?? -1, outPoint ?? -1]))
  );

  server.tool(
    "clear_sequence_in_out",
    "Clear in and out points on the active sequence",
    {},
    async () => toolResult(await callPremiere("clearSequenceInOut"))
  );

  server.tool(
    "nest_clips",
    "Nest selected clips into a new nested sequence",
    {
      trackType: z.enum(["video", "audio"]).describe("Track type of clips to nest"),
      trackIndex: z.number().describe("Track index"),
      clipIndices: z.array(z.number()).describe("Array of clip indices to nest"),
      nestedSequenceName: z.string().optional().describe("Name for the nested sequence"),
    },
    async ({ trackType, trackIndex, clipIndices, nestedSequenceName }) =>
      toolResult(await callPremiere("nestClips", [trackType, trackIndex, JSON.stringify(clipIndices), nestedSequenceName || ""]))
  );

  server.tool(
    "add_tracks",
    "Add new video or audio tracks to the active sequence",
    {
      videoTracks: z.number().optional().describe("Number of video tracks to add"),
      audioTracks: z.number().optional().describe("Number of audio tracks to add"),
      position: z.number().optional().describe("Position to insert tracks at (0-based, -1 for end)"),
    },
    async ({ videoTracks, audioTracks, position }) =>
      toolResult(await callPremiere("addTracks", [videoTracks || 0, audioTracks || 0, position ?? -1]))
  );

  server.tool(
    "remove_track",
    "Remove a track from the active sequence",
    {
      trackType: z.enum(["video", "audio"]).describe("Track type"),
      trackIndex: z.number().describe("Track index to remove"),
    },
    async ({ trackType, trackIndex }) =>
      toolResult(await callPremiere("removeTrack", [trackType, trackIndex]))
  );

  server.tool(
    "get_track_info",
    "Get detailed info about a specific track (name, locked, muted, clips count, target status)",
    {
      trackType: z.enum(["video", "audio"]).describe("Track type"),
      trackIndex: z.number().describe("Track index"),
    },
    async ({ trackType, trackIndex }) =>
      toolResult(await callPremiere("getTrackInfo", [trackType, trackIndex]))
  );

  server.tool(
    "set_track_muted",
    "Mute or unmute a track",
    {
      trackType: z.enum(["video", "audio"]).describe("Track type"),
      trackIndex: z.number().describe("Track index"),
      muted: z.boolean().describe("True to mute, false to unmute"),
    },
    async ({ trackType, trackIndex, muted }) =>
      toolResult(await callPremiere("setTrackMuted", [trackType, trackIndex, muted]))
  );

  server.tool(
    "set_track_locked",
    "Lock or unlock a track",
    {
      trackType: z.enum(["video", "audio"]).describe("Track type"),
      trackIndex: z.number().describe("Track index"),
      locked: z.boolean().describe("True to lock, false to unlock"),
    },
    async ({ trackType, trackIndex, locked }) =>
      toolResult(await callPremiere("setTrackLocked", [trackType, trackIndex, locked]))
  );

  server.tool(
    "rename_track",
    "Rename a track",
    {
      trackType: z.enum(["video", "audio"]).describe("Track type"),
      trackIndex: z.number().describe("Track index"),
      name: z.string().describe("New track name"),
    },
    async ({ trackType, trackIndex, name }) =>
      toolResult(await callPremiere("renameTrack", [trackType, trackIndex, name]))
  );

  server.tool(
    "auto_reframe_sequence",
    "Auto-reframe the active sequence to a new aspect ratio (AI-powered reframing)",
    {
      numerator: z.number().describe("Target aspect ratio numerator (e.g. 9 for 9:16 vertical)"),
      denominator: z.number().describe("Target aspect ratio denominator (e.g. 16 for 9:16 vertical)"),
      motionPreset: z.enum(["default", "faster", "slower"]).optional().describe("Motion tracking speed preset (default: 'default')"),
      newName: z.string().optional().describe("Name for the reframed sequence"),
      useNestedSequences: z.boolean().optional().describe("Whether to use nested sequences (default: false)"),
    },
    async ({ numerator, denominator, motionPreset, newName, useNestedSequences }) =>
      toolResult(await callPremiere("autoReframeSequence", [
        numerator, denominator, motionPreset || "default", newName || "", useNestedSequences || false
      ]))
  );

  server.tool(
    "scene_edit_detection",
    "Detect scene changes/cuts in selected clips and optionally apply cuts, create markers, or create subclips",
    {
      action: z.enum(["ApplyCuts", "CreateMarkers", "CreateSubclips"]).describe("What to do at detected cut points"),
      applyCutsToLinkedAudio: z.boolean().optional().describe("Apply cuts to linked audio too (default: true)"),
      sensitivity: z.string().optional().describe("Detection sensitivity ('low', 'medium', 'high'). Default: 'medium'"),
    },
    async ({ action, applyCutsToLinkedAudio, sensitivity }) =>
      toolResult(await callPremiere("sceneEditDetection", [action, applyCutsToLinkedAudio !== false, sensitivity || "medium"]))
  );

  server.tool(
    "create_subsequence",
    "Create a subsequence from the in/out range of the active sequence",
    {
      ignoreTrackTargeting: z.boolean().optional().describe("If true, include all tracks regardless of targeting (default: false)"),
    },
    async ({ ignoreTrackTargeting }) =>
      toolResult(await callPremiere("createSubsequence", [ignoreTrackTargeting || false]))
  );

  server.tool(
    "set_work_area",
    "Set the work area bar in/out points on the active sequence",
    {
      inPoint: z.number().optional().describe("Work area in point in seconds"),
      outPoint: z.number().optional().describe("Work area out point in seconds"),
    },
    async ({ inPoint, outPoint }) =>
      toolResult(await callPremiere("setWorkArea", [inPoint ?? -1, outPoint ?? -1]))
  );

  server.tool(
    "get_work_area",
    "Get the work area bar in/out points of the active sequence",
    {},
    async () => toolResult(await callPremiere("getWorkArea"))
  );

  server.tool(
    "get_selection",
    "Get all currently selected clips on the timeline",
    {},
    async () => toolResult(await callPremiere("getSelection"))
  );
}
