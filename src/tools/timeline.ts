import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callPremiere, toolResult } from "../bridge.js";

const trackTypeSchema = z.enum(["video", "audio"]).describe("Track type");

export function registerTimelineTools(server: McpServer) {

  server.tool(
    "get_timeline_clips",
    "Get all clips on the active sequence timeline with their properties",
    {
      trackType: z.enum(["video", "audio", "all"]).optional().describe("Filter by track type (default: all)"),
      trackIndex: z.number().optional().describe("Filter by specific track index (-1 for all)"),
    },
    async ({ trackType, trackIndex }) =>
      toolResult(await callPremiere("getTimelineClips", [trackType || "all", trackIndex ?? -1]))
  );

  server.tool(
    "add_clip_to_timeline",
    "Add a project item (clip) to the timeline via insert edit",
    {
      projectItemId: z.string().describe("The nodeId of the project item to add"),
      trackIndex: z.number().describe("Track index (0-based)"),
      startTime: z.number().describe("Start time in seconds on the timeline"),
      trackType: trackTypeSchema.optional().describe("Track type (default: video)"),
      inPoint: z.number().optional().describe("Source in-point in seconds"),
      outPoint: z.number().optional().describe("Source out-point in seconds"),
    },
    async ({ projectItemId, trackIndex, startTime, trackType, inPoint, outPoint }) =>
      toolResult(await callPremiere("addClipToTimeline", [
        projectItemId, trackIndex, startTime, trackType || "video", inPoint ?? -1, outPoint ?? -1
      ]))
  );

  server.tool(
    "overwrite_clip_to_timeline",
    "Add a clip to the timeline via overwrite edit (replaces existing content)",
    {
      projectItemId: z.string().describe("The nodeId of the project item"),
      trackIndex: z.number().describe("Track index (0-based)"),
      startTime: z.number().describe("Start time in seconds"),
      trackType: trackTypeSchema.optional().describe("Track type (default: video)"),
      inPoint: z.number().optional().describe("Source in-point in seconds"),
      outPoint: z.number().optional().describe("Source out-point in seconds"),
    },
    async ({ projectItemId, trackIndex, startTime, trackType, inPoint, outPoint }) =>
      toolResult(await callPremiere("overwriteClipToTimeline", [
        projectItemId, trackIndex, startTime, trackType || "video", inPoint ?? -1, outPoint ?? -1
      ]))
  );

  server.tool(
    "set_clip_position",
    "Move a clip to a new position on the timeline",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index on that track"),
      startTime: z.number().optional().describe("New start time in seconds"),
      endTime: z.number().optional().describe("New end time in seconds"),
    },
    async ({ trackType, trackIndex, clipIndex, startTime, endTime }) =>
      toolResult(await callPremiere("setClipPosition", [
        trackType, trackIndex, clipIndex, startTime ?? -1, endTime ?? -1
      ]))
  );

  server.tool(
    "set_clip_in_out",
    "Trim a clip by setting its source in/out points",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
      inPoint: z.number().optional().describe("New source in-point in seconds"),
      outPoint: z.number().optional().describe("New source out-point in seconds"),
    },
    async ({ trackType, trackIndex, clipIndex, inPoint, outPoint }) =>
      toolResult(await callPremiere("setClipInOut", [
        trackType, trackIndex, clipIndex, inPoint ?? -1, outPoint ?? -1
      ]))
  );

  server.tool(
    "remove_clip",
    "Remove a clip from the timeline (lift edit)",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
      ripple: z.boolean().optional().describe("If true, ripple delete (close the gap). Default: false"),
    },
    async ({ trackType, trackIndex, clipIndex, ripple }) =>
      toolResult(await callPremiere("removeClip", [trackType, trackIndex, clipIndex, ripple || false]))
  );

  server.tool(
    "razor_clip",
    "Split/razor a clip at a specific time",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      time: z.number().describe("Time in seconds to split the clip"),
    },
    async ({ trackType, trackIndex, time }) =>
      toolResult(await callPremiere("razorClip", [trackType, trackIndex, time]))
  );

  server.tool(
    "razor_all_tracks",
    "Split all clips on all tracks at a specific time (like pressing C at playhead)",
    {
      time: z.number().describe("Time in seconds to split all clips"),
    },
    async ({ time }) => toolResult(await callPremiere("razorAllTracks", [time]))
  );

  server.tool(
    "set_clip_speed",
    "Change the speed/duration of a clip (speed ramp, slow-mo, etc.)",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
      speed: z.number().describe("Speed multiplier (1.0 = normal, 0.5 = half speed, 2.0 = double speed)"),
      reverse: z.boolean().optional().describe("Reverse the clip playback"),
      ripple: z.boolean().optional().describe("Adjust subsequent clips to account for duration change"),
      maintainPitch: z.boolean().optional().describe("Maintain audio pitch when changing speed"),
    },
    async ({ trackType, trackIndex, clipIndex, speed, reverse, ripple, maintainPitch }) =>
      toolResult(await callPremiere("setClipSpeed", [
        trackType, trackIndex, clipIndex, speed, reverse || false, ripple || false, maintainPitch || false
      ]))
  );

  server.tool(
    "enable_disable_clip",
    "Enable or disable a clip on the timeline",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
      enabled: z.boolean().describe("True to enable, false to disable"),
    },
    async ({ trackType, trackIndex, clipIndex, enabled }) =>
      toolResult(await callPremiere("enableDisableClip", [trackType, trackIndex, clipIndex, enabled]))
  );

  server.tool(
    "set_timeline_clip_label",
    "Set the label color of a clip on the timeline",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
      colorIndex: z.number().min(0).max(15).describe("Label color index (0-15): 0=Violet, 1=Iris, 2=Caribbean, 3=Lavender, 4=Cerulean, 5=Forest, 6=Rose, 7=Mango, 8=Purple, 9=Blue, 10=Teal, 11=Magenta, 12=Tan, 13=Green, 14=Brown, 15=Yellow"),
    },
    async ({ trackType, trackIndex, clipIndex, colorIndex }) =>
      toolResult(await callPremiere("setClipLabel", [trackType, trackIndex, clipIndex, colorIndex]))
  );

  server.tool(
    "rename_clip",
    "Rename a clip on the timeline",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
      newName: z.string().describe("New clip name"),
    },
    async ({ trackType, trackIndex, clipIndex, newName }) =>
      toolResult(await callPremiere("renameClip", [trackType, trackIndex, clipIndex, newName]))
  );

  server.tool(
    "link_clips",
    "Link video and audio clips together",
    {
      videoTrackIndex: z.number().describe("Video track index"),
      videoClipIndex: z.number().describe("Video clip index"),
      audioTrackIndex: z.number().describe("Audio track index"),
      audioClipIndex: z.number().describe("Audio clip index"),
    },
    async ({ videoTrackIndex, videoClipIndex, audioTrackIndex, audioClipIndex }) =>
      toolResult(await callPremiere("linkClips", [videoTrackIndex, videoClipIndex, audioTrackIndex, audioClipIndex]))
  );

  server.tool(
    "unlink_clip",
    "Unlink a clip from its linked audio/video counterpart",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
    },
    async ({ trackType, trackIndex, clipIndex }) =>
      toolResult(await callPremiere("unlinkClip", [trackType, trackIndex, clipIndex]))
  );

  server.tool(
    "get_clip_info",
    "Get detailed information about a specific clip on the timeline (effects, properties, linked clips, etc.)",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
    },
    async ({ trackType, trackIndex, clipIndex }) =>
      toolResult(await callPremiere("getClipInfo", [trackType, trackIndex, clipIndex]))
  );

  server.tool(
    "add_adjustment_layer",
    "Add an adjustment layer to a video track",
    {
      trackIndex: z.number().describe("Video track index"),
      startTime: z.number().describe("Start time in seconds"),
      duration: z.number().describe("Duration in seconds"),
      name: z.string().optional().describe("Name for the adjustment layer"),
    },
    async ({ trackIndex, startTime, duration, name }) =>
      toolResult(await callPremiere("addAdjustmentLayer", [trackIndex, startTime, duration, name || "Adjustment Layer"]))
  );

  server.tool(
    "select_clips",
    "Select specific clips on the timeline (for use with other operations)",
    {
      clips: z.array(z.object({
        trackType: trackTypeSchema,
        trackIndex: z.number(),
        clipIndex: z.number(),
      })).describe("Array of clip locations to select"),
    },
    async ({ clips }) =>
      toolResult(await callPremiere("selectClips", [JSON.stringify(clips)]))
  );

  server.tool(
    "deselect_all",
    "Deselect all clips on the timeline",
    {},
    async () => toolResult(await callPremiere("deselectAll"))
  );

  server.tool(
    "slip_clip",
    "Slip a clip (change its source in/out without moving it on the timeline)",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
      offsetSeconds: z.number().describe("Offset in seconds (positive = slip forward, negative = slip backward)"),
    },
    async ({ trackType, trackIndex, clipIndex, offsetSeconds }) =>
      toolResult(await callPremiere("slipClip", [trackType, trackIndex, clipIndex, offsetSeconds]))
  );

  server.tool(
    "slide_clip",
    "Slide a clip (move it between adjacent clips, adjusting their in/out points)",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
      offsetSeconds: z.number().describe("Offset in seconds (positive = slide right, negative = slide left)"),
    },
    async ({ trackType, trackIndex, clipIndex, offsetSeconds }) =>
      toolResult(await callPremiere("slideClip", [trackType, trackIndex, clipIndex, offsetSeconds]))
  );

  server.tool(
    "ripple_delete",
    "Ripple delete a clip (remove and close the gap)",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
    },
    async ({ trackType, trackIndex, clipIndex }) =>
      toolResult(await callPremiere("rippleDelete", [trackType, trackIndex, clipIndex]))
  );

  server.tool(
    "move_clip_to_track",
    "Move a clip to a different track",
    {
      trackType: trackTypeSchema,
      sourceTrackIndex: z.number().describe("Source track index"),
      clipIndex: z.number().describe("Clip index"),
      targetTrackIndex: z.number().describe("Target track index"),
    },
    async ({ trackType, sourceTrackIndex, clipIndex, targetTrackIndex }) =>
      toolResult(await callPremiere("moveClipToTrack", [trackType, sourceTrackIndex, clipIndex, targetTrackIndex]))
  );

  server.tool(
    "duplicate_clip",
    "Duplicate a clip on the timeline",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
      targetTime: z.number().describe("Where to place the duplicate (in seconds)"),
      targetTrackIndex: z.number().optional().describe("Target track index (same track if omitted)"),
    },
    async ({ trackType, trackIndex, clipIndex, targetTime, targetTrackIndex }) =>
      toolResult(await callPremiere("duplicateClip", [trackType, trackIndex, clipIndex, targetTime, targetTrackIndex ?? trackIndex]))
  );

  server.tool(
    "get_clip_speed",
    "Get the playback speed and reverse status of a clip",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
    },
    async ({ trackType, trackIndex, clipIndex }) =>
      toolResult(await callPremiere("getClipSpeed", [trackType, trackIndex, clipIndex]))
  );

  server.tool(
    "freeze_frame",
    "Apply a freeze frame (hold frame) at a specific point in a clip",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
      time: z.number().describe("Time in seconds (relative to clip start) to freeze at"),
      duration: z.number().describe("Duration of the freeze frame in seconds"),
    },
    async ({ trackType, trackIndex, clipIndex, time, duration }) =>
      toolResult(await callPremiere("freezeFrame", [trackType, trackIndex, clipIndex, time, duration]))
  );
}
