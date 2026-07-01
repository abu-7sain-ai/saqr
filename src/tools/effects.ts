import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callPremiere, toolResult } from "../bridge.js";

const trackTypeSchema = z.enum(["video", "audio"]).describe("Track type");

export function registerEffectsTools(server: McpServer) {

  // --- Effect Application ---

  server.tool(
    "apply_effect",
    "Apply a video or audio effect to a clip on the timeline",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
      effectName: z.string().describe("Name of the effect (e.g. 'Gaussian Blur', 'Lumetri Color', 'Warp Stabilizer')"),
    },
    async ({ trackType, trackIndex, clipIndex, effectName }) =>
      toolResult(await callPremiere("applyEffect", [trackType, trackIndex, clipIndex, effectName]))
  );

  server.tool(
    "remove_effect",
    "Remove an effect from a clip",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
      effectIndex: z.number().describe("Effect/component index on the clip"),
    },
    async ({ trackType, trackIndex, clipIndex, effectIndex }) =>
      toolResult(await callPremiere("removeEffect", [trackType, trackIndex, clipIndex, effectIndex]))
  );

  server.tool(
    "get_clip_effects",
    "List all effects (components) applied to a clip, with their properties",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
    },
    async ({ trackType, trackIndex, clipIndex }) =>
      toolResult(await callPremiere("getClipEffects", [trackType, trackIndex, clipIndex]))
  );

  server.tool(
    "set_effect_property",
    "Set a property value on an effect applied to a clip",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
      effectIndex: z.number().describe("Effect/component index"),
      propertyName: z.string().describe("Display name of the property"),
      value: z.any().describe("Value to set (number, boolean, or array for multi-dimensional)"),
    },
    async ({ trackType, trackIndex, clipIndex, effectIndex, propertyName, value }) =>
      toolResult(await callPremiere("setEffectProperty", [
        trackType, trackIndex, clipIndex, effectIndex, propertyName, value
      ]))
  );

  server.tool(
    "get_effect_property",
    "Get the current value of a specific effect property",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
      effectIndex: z.number().describe("Effect/component index"),
      propertyName: z.string().describe("Display name of the property"),
    },
    async ({ trackType, trackIndex, clipIndex, effectIndex, propertyName }) =>
      toolResult(await callPremiere("getEffectProperty", [
        trackType, trackIndex, clipIndex, effectIndex, propertyName
      ]))
  );

  server.tool(
    "set_effect_enabled",
    "Enable or disable (bypass) an effect on a clip",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
      effectIndex: z.number().describe("Effect/component index"),
      enabled: z.boolean().describe("True to enable, false to disable/bypass"),
    },
    async ({ trackType, trackIndex, clipIndex, effectIndex, enabled }) =>
      toolResult(await callPremiere("setEffectEnabled", [
        trackType, trackIndex, clipIndex, effectIndex, enabled
      ]))
  );

  // --- Effect Lists ---

  server.tool(
    "get_video_effects_list",
    "Get a list of all available video effects in Premiere Pro",
    {},
    async () => toolResult(await callPremiere("getVideoEffectsList"))
  );

  server.tool(
    "get_audio_effects_list",
    "Get a list of all available audio effects in Premiere Pro",
    {},
    async () => toolResult(await callPremiere("getAudioEffectsList"))
  );

  server.tool(
    "get_video_transitions_list",
    "Get a list of all available video transitions",
    {},
    async () => toolResult(await callPremiere("getVideoTransitionsList"))
  );

  server.tool(
    "get_audio_transitions_list",
    "Get a list of all available audio transitions/crossfades",
    {},
    async () => toolResult(await callPremiere("getAudioTransitionsList"))
  );

  // --- Transitions ---

  server.tool(
    "apply_transition",
    "Apply a video or audio transition between two adjacent clips or at a clip edge",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index (transition applied at the END of this clip)"),
      transitionName: z.string().describe("Name of the transition (e.g. 'Cross Dissolve', 'Dip to Black', 'Film Dissolve')"),
      duration: z.number().optional().describe("Transition duration in seconds"),
      position: z.enum(["start", "end", "center"]).optional().describe("Where to position the transition relative to the cut (default: center)"),
    },
    async ({ trackType, trackIndex, clipIndex, transitionName, duration, position }) =>
      toolResult(await callPremiere("applyTransition", [
        trackType, trackIndex, clipIndex, transitionName, duration ?? -1, position || "center"
      ]))
  );

  server.tool(
    "remove_transition",
    "Remove a transition from a clip edge",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
      position: z.enum(["start", "end"]).describe("Which edge to remove the transition from"),
    },
    async ({ trackType, trackIndex, clipIndex, position }) =>
      toolResult(await callPremiere("removeTransition", [trackType, trackIndex, clipIndex, position]))
  );

  server.tool(
    "set_default_transition",
    "Set the default video or audio transition",
    {
      transitionType: z.enum(["video", "audio"]).describe("Transition type"),
      transitionName: z.string().describe("Name of the transition to set as default"),
      duration: z.number().optional().describe("Default transition duration in seconds"),
    },
    async ({ transitionType, transitionName, duration }) =>
      toolResult(await callPremiere("setDefaultTransition", [transitionType, transitionName, duration ?? -1]))
  );

  // --- Keyframes ---

  server.tool(
    "add_keyframe",
    "Add a keyframe to an effect property at a specific time",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
      effectIndex: z.number().describe("Effect/component index"),
      propertyName: z.string().describe("Property display name"),
      time: z.number().describe("Time in seconds (relative to clip start)"),
      value: z.any().describe("Value at this keyframe"),
    },
    async ({ trackType, trackIndex, clipIndex, effectIndex, propertyName, time, value }) =>
      toolResult(await callPremiere("addKeyframe", [
        trackType, trackIndex, clipIndex, effectIndex, propertyName, time, value
      ]))
  );

  server.tool(
    "remove_keyframe",
    "Remove a keyframe from an effect property",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
      effectIndex: z.number().describe("Effect/component index"),
      propertyName: z.string().describe("Property display name"),
      keyframeIndex: z.number().describe("Index of the keyframe to remove"),
    },
    async ({ trackType, trackIndex, clipIndex, effectIndex, propertyName, keyframeIndex }) =>
      toolResult(await callPremiere("removeKeyframe", [
        trackType, trackIndex, clipIndex, effectIndex, propertyName, keyframeIndex
      ]))
  );

  server.tool(
    "get_keyframes",
    "Get all keyframes for a specific effect property",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
      effectIndex: z.number().describe("Effect/component index"),
      propertyName: z.string().describe("Property display name"),
    },
    async ({ trackType, trackIndex, clipIndex, effectIndex, propertyName }) =>
      toolResult(await callPremiere("getKeyframes", [
        trackType, trackIndex, clipIndex, effectIndex, propertyName
      ]))
  );

  server.tool(
    "set_keyframe_interpolation",
    "Set the interpolation type for a keyframe (linear, bezier, hold, etc.)",
    {
      trackType: trackTypeSchema,
      trackIndex: z.number().describe("Track index"),
      clipIndex: z.number().describe("Clip index"),
      effectIndex: z.number().describe("Effect/component index"),
      propertyName: z.string().describe("Property display name"),
      keyframeIndex: z.number().describe("Keyframe index"),
      interpolation: z.enum(["linear", "bezier", "hold", "ease_in", "ease_out", "ease_in_out"]).describe("Interpolation type"),
    },
    async ({ trackType, trackIndex, clipIndex, effectIndex, propertyName, keyframeIndex, interpolation }) =>
      toolResult(await callPremiere("setKeyframeInterpolation", [
        trackType, trackIndex, clipIndex, effectIndex, propertyName, keyframeIndex, interpolation
      ]))
  );

  // --- Motion/Transform (shorthand for common effect properties) ---

  server.tool(
    "set_clip_transform",
    "Set the motion/transform properties of a video clip (position, scale, rotation, opacity, anchor point)",
    {
      trackIndex: z.number().describe("Video track index"),
      clipIndex: z.number().describe("Clip index"),
      positionX: z.number().optional().describe("X position in pixels"),
      positionY: z.number().optional().describe("Y position in pixels"),
      scaleX: z.number().optional().describe("Horizontal scale percentage (100 = normal)"),
      scaleY: z.number().optional().describe("Vertical scale percentage (100 = normal, null = uniform with scaleX)"),
      rotation: z.number().optional().describe("Rotation in degrees"),
      opacity: z.number().optional().describe("Opacity percentage (0-100)"),
      anchorPointX: z.number().optional().describe("Anchor point X"),
      anchorPointY: z.number().optional().describe("Anchor point Y"),
      antiFlicker: z.number().optional().describe("Anti-flicker filter (0-1)"),
    },
    async (params) =>
      toolResult(await callPremiere("setClipTransform", [
        params.trackIndex, params.clipIndex,
        params.positionX ?? -1, params.positionY ?? -1,
        params.scaleX ?? -1, params.scaleY ?? -1,
        params.rotation ?? -99999, params.opacity ?? -1,
        params.anchorPointX ?? -1, params.anchorPointY ?? -1,
        params.antiFlicker ?? -1
      ]))
  );

  server.tool(
    "get_clip_transform",
    "Get the current motion/transform properties of a video clip",
    {
      trackIndex: z.number().describe("Video track index"),
      clipIndex: z.number().describe("Clip index"),
    },
    async ({ trackIndex, clipIndex }) =>
      toolResult(await callPremiere("getClipTransform", [trackIndex, clipIndex]))
  );
}
