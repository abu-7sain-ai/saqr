import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callPremiere, toolResult, isConnected } from "../bridge.js";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import { loadConfig } from "../config.js";

const ELEVENLABS_API = "https://api.elevenlabs.io/v1";

function getApiKey(): string | null {
  const cfg = loadConfig();
  return cfg.elevenlabs.api_key || process.env.ELEVENLABS_API_KEY || null;
}

function getDefaultVoice(): string {
  return loadConfig().elevenlabs.default_voice_id;
}

function getDefaultModel(): string {
  return loadConfig().elevenlabs.default_model;
}

async function ensureOutputDir(): Promise<string> {
  const dir = join(homedir(), "Documents", "Premiere Pro MCP", "ai_audio");
  await mkdir(dir, { recursive: true });
  return dir;
}

export function registerAiTools(server: McpServer) {

  server.tool(
    "elevenlabs_list_voices",
    "List available ElevenLabs voices. Requires ELEVENLABS_API_KEY environment variable.",
    {},
    async () => {
      const key = getApiKey();
      if (!key) return toolResult({ error: "ELEVENLABS_API_KEY environment variable not set. Get your key from https://elevenlabs.io" });

      const res = await fetch(`${ELEVENLABS_API}/voices`, {
        headers: { "xi-api-key": key },
      });
      if (!res.ok) return toolResult({ error: `ElevenLabs API error: ${res.status} ${res.statusText}` });

      const data = await res.json() as any;
      const voices = data.voices.map((v: any) => ({
        voice_id: v.voice_id,
        name: v.name,
        category: v.category,
        labels: v.labels,
      }));
      return toolResult({ voices, count: voices.length });
    }
  );

  server.tool(
    "elevenlabs_generate_speech",
    "Generate speech audio from text using ElevenLabs AI. Saves the audio file and optionally imports it into Premiere Pro and places it on the timeline. Requires ELEVENLABS_API_KEY environment variable.",
    {
      text: z.string().describe("Text to convert to speech"),
      voice_id: z.string().optional().describe("ElevenLabs voice ID (default: Rachel - 21m00Tcm4TlvDq8ikWAM). Use elevenlabs_list_voices to see options."),
      model_id: z.string().optional().describe("Model ID (default: eleven_multilingual_v2). Options: eleven_multilingual_v2, eleven_turbo_v2, eleven_monolingual_v1"),
      stability: z.number().optional().describe("Voice stability 0-1 (default: 0.5). Lower = more expressive, higher = more consistent"),
      similarity_boost: z.number().optional().describe("Similarity boost 0-1 (default: 0.75). Higher = closer to original voice"),
      style: z.number().optional().describe("Style exaggeration 0-1 (default: 0). Higher = more expressive"),
      speed: z.number().optional().describe("Speaking speed 0.25-4.0 (default: 1.0)"),
      filename: z.string().optional().describe("Output filename (without extension). Default: auto-generated from text"),
      import_to_premiere: z.boolean().optional().describe("Import the generated audio into the Premiere Pro project (default: true)"),
      add_to_timeline: z.boolean().optional().describe("Also add the audio to the active sequence timeline (default: false)"),
      audio_track: z.number().optional().describe("Audio track index when adding to timeline (default: 1)"),
      timeline_start: z.number().optional().describe("Start time in seconds when adding to timeline (default: 0)"),
    },
    async (params) => {
      const key = getApiKey();
      if (!key) return toolResult({ error: "ELEVENLABS_API_KEY environment variable not set. Get your key from https://elevenlabs.io" });

      const voiceId = params.voice_id || getDefaultVoice();
      const modelId = params.model_id || getDefaultModel();

      const body: any = {
        text: params.text,
        model_id: modelId,
        voice_settings: {
          stability: params.stability ?? 0.5,
          similarity_boost: params.similarity_boost ?? 0.75,
          style: params.style ?? 0,
          use_speaker_boost: true,
        },
      };
      if (params.speed !== undefined) {
        body.voice_settings.speed = params.speed;
      }

      const res = await fetch(`${ELEVENLABS_API}/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": key,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        return toolResult({ error: `ElevenLabs API error: ${res.status} - ${err}` });
      }

      const audioBuffer = Buffer.from(await res.arrayBuffer());
      const outputDir = await ensureOutputDir();
      const safeName = (params.filename || params.text.slice(0, 40).replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "_")) + ".mp3";
      const outputPath = join(outputDir, safeName);
      await writeFile(outputPath, audioBuffer);

      const result: any = {
        file: outputPath,
        size: audioBuffer.length,
        text: params.text,
        voice_id: voiceId,
        model_id: modelId,
      };

      // Import into Premiere Pro
      const shouldImport = params.import_to_premiere !== false;
      if (shouldImport && isConnected()) {
        try {
          const filePath = outputPath.replace(/\\/g, "/");
          await callPremiere("importMedia", [JSON.stringify([filePath]), "", false]);
          result.imported = true;

          // Add to timeline if requested
          if (params.add_to_timeline) {
            const trackIdx = params.audio_track ?? 1;
            const startTime = params.timeline_start ?? 0;
            const findResult = await callPremiere("findProjectItems", [safeName, "all"]);
            if (findResult && findResult.items && findResult.items.length > 0) {
              const nodeId = findResult.items[0].nodeId;
              await callPremiere("addClipToTimeline", [nodeId, trackIdx, startTime, "audio"]);
              result.added_to_timeline = true;
              result.audio_track = trackIdx;
              result.timeline_start = startTime;
            }
          }
        } catch (e: any) {
          result.import_error = e.message;
        }
      }

      return toolResult(result);
    }
  );

  server.tool(
    "elevenlabs_generate_captions_voice",
    "Generate AI voiceover for multiple caption texts. Creates individual audio files for each caption and optionally places them on the timeline at the correct times.",
    {
      captions: z.array(z.object({
        text: z.string().describe("Caption/line text to speak"),
        start: z.number().describe("Start time in seconds on the timeline"),
      })).describe("Array of captions with text and start times"),
      voice_id: z.string().optional().describe("ElevenLabs voice ID"),
      model_id: z.string().optional().describe("Model ID (default: eleven_multilingual_v2)"),
      speed: z.number().optional().describe("Speaking speed 0.25-4.0 (default: 1.0)"),
      add_to_timeline: z.boolean().optional().describe("Add all generated audio clips to the timeline (default: true)"),
      audio_track: z.number().optional().describe("Audio track index (default: 2)"),
    },
    async (params) => {
      const key = getApiKey();
      if (!key) return toolResult({ error: "ELEVENLABS_API_KEY environment variable not set." });

      const voiceId = params.voice_id || getDefaultVoice();
      const modelId = params.model_id || getDefaultModel();
      const trackIdx = params.audio_track ?? 2;
      const outputDir = await ensureOutputDir();
      const results: any[] = [];

      for (let i = 0; i < params.captions.length; i++) {
        const cap = params.captions[i];
        try {
          const body: any = {
            text: cap.text,
            model_id: modelId,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.2,
              use_speaker_boost: true,
            },
          };
          if (params.speed !== undefined) body.voice_settings.speed = params.speed;

          const res = await fetch(`${ELEVENLABS_API}/text-to-speech/${voiceId}`, {
            method: "POST",
            headers: {
              "xi-api-key": key,
              "Content-Type": "application/json",
              "Accept": "audio/mpeg",
            },
            body: JSON.stringify(body),
          });

          if (!res.ok) {
            results.push({ text: cap.text, error: `API ${res.status}` });
            continue;
          }

          const audioBuffer = Buffer.from(await res.arrayBuffer());
          const safeName = `voice_${String(i + 1).padStart(2, "0")}_${cap.text.slice(0, 20).replace(/[^a-zA-Z0-9]/g, "_")}.mp3`;
          const outputPath = join(outputDir, safeName);
          await writeFile(outputPath, audioBuffer);

          const entry: any = { text: cap.text, file: outputPath, start: cap.start };

          // Import and place on timeline
          if (params.add_to_timeline !== false && isConnected()) {
            try {
              const filePath = outputPath.replace(/\\/g, "/");
              await callPremiere("importMedia", [JSON.stringify([filePath]), "", false]);
              const findResult = await callPremiere("findProjectItems", [safeName, "all"]);
              if (findResult?.items?.length > 0) {
                await callPremiere("addClipToTimeline", [findResult.items[0].nodeId, trackIdx, cap.start, "audio"]);
                entry.placed = true;
              }
            } catch (e: any) {
              entry.place_error = e.message;
            }
          }

          results.push(entry);
        } catch (e: any) {
          results.push({ text: cap.text, error: e.message });
        }
      }

      return toolResult({ generated: results.length, audio_track: trackIdx, results });
    }
  );
}
