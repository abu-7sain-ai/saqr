import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callPremiere, toolResult } from "../bridge.js";

export function registerAudioTools(server: McpServer) {

  server.tool(
    "set_clip_volume",
    "Set the audio volume (gain) of a clip in decibels",
    {
      trackIndex: z.number().describe("Audio track index"),
      clipIndex: z.number().describe("Clip index"),
      volumeDb: z.number().describe("Volume in decibels (0 = unity, -96 = silence, +15 max)"),
    },
    async ({ trackIndex, clipIndex, volumeDb }) =>
      toolResult(await callPremiere("setClipVolume", [trackIndex, clipIndex, volumeDb]))
  );

  server.tool(
    "get_clip_volume",
    "Get the current audio volume (gain) of a clip",
    {
      trackIndex: z.number().describe("Audio track index"),
      clipIndex: z.number().describe("Clip index"),
    },
    async ({ trackIndex, clipIndex }) =>
      toolResult(await callPremiere("getClipVolume", [trackIndex, clipIndex]))
  );

  server.tool(
    "set_clip_mute",
    "Mute or unmute a specific audio clip",
    {
      trackIndex: z.number().describe("Audio track index"),
      clipIndex: z.number().describe("Clip index"),
      muted: z.boolean().describe("True to mute, false to unmute"),
    },
    async ({ trackIndex, clipIndex, muted }) =>
      toolResult(await callPremiere("setClipMute", [trackIndex, clipIndex, muted]))
  );

  server.tool(
    "set_audio_channel_mapping",
    "Set the audio channel mapping for a project item (mono, stereo, 5.1, etc.)",
    {
      nodeId: z.string().describe("The nodeId of the project item"),
      channelType: z.enum(["mono", "stereo", "5.1", "adaptive"]).describe("Channel mapping type"),
    },
    async ({ nodeId, channelType }) =>
      toolResult(await callPremiere("setAudioChannelMapping", [nodeId, channelType]))
  );

  server.tool(
    "get_audio_channel_mapping",
    "Get the audio channel mapping of a project item",
    {
      nodeId: z.string().describe("The nodeId of the project item"),
    },
    async ({ nodeId }) =>
      toolResult(await callPremiere("getAudioChannelMapping", [nodeId]))
  );

  server.tool(
    "set_track_volume",
    "Set the volume level of an entire audio track",
    {
      trackIndex: z.number().describe("Audio track index"),
      volumeDb: z.number().describe("Volume in decibels"),
    },
    async ({ trackIndex, volumeDb }) =>
      toolResult(await callPremiere("setTrackVolume", [trackIndex, volumeDb]))
  );

  server.tool(
    "set_track_pan",
    "Set the pan position of an audio track",
    {
      trackIndex: z.number().describe("Audio track index"),
      pan: z.number().min(-100).max(100).describe("Pan position (-100 = full left, 0 = center, 100 = full right)"),
    },
    async ({ trackIndex, pan }) =>
      toolResult(await callPremiere("setTrackPan", [trackIndex, pan]))
  );

  server.tool(
    "solo_track",
    "Solo or unsolo an audio track",
    {
      trackIndex: z.number().describe("Audio track index"),
      solo: z.boolean().describe("True to solo, false to unsolo"),
    },
    async ({ trackIndex, solo }) =>
      toolResult(await callPremiere("soloTrack", [trackIndex, solo]))
  );

  server.tool(
    "add_audio_keyframe",
    "Add an audio volume keyframe to a clip at a specific time",
    {
      trackIndex: z.number().describe("Audio track index"),
      clipIndex: z.number().describe("Clip index"),
      time: z.number().describe("Time in seconds relative to clip start"),
      volumeDb: z.number().describe("Volume in decibels at this keyframe"),
    },
    async ({ trackIndex, clipIndex, time, volumeDb }) =>
      toolResult(await callPremiere("addAudioKeyframe", [trackIndex, clipIndex, time, volumeDb]))
  );

  server.tool(
    "apply_audio_crossfade",
    "Apply an audio crossfade between two adjacent clips",
    {
      trackIndex: z.number().describe("Audio track index"),
      clipIndex: z.number().describe("Index of the first clip (crossfade goes between this and next)"),
      type: z.enum(["constant_gain", "constant_power", "exponential_fade"]).optional().describe("Crossfade type (default: constant_power)"),
      duration: z.number().optional().describe("Crossfade duration in seconds"),
    },
    async ({ trackIndex, clipIndex, type, duration }) =>
      toolResult(await callPremiere("applyAudioCrossfade", [trackIndex, clipIndex, type || "constant_power", duration ?? -1]))
  );
}
