import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

export interface Config {
  port: number;
  elevenlabs: {
    api_key: string;
    default_voice_id: string;
    default_model: string;
  };
}

const defaults: Config = {
  port: 8097,
  elevenlabs: {
    api_key: "",
    default_voice_id: "21m00Tcm4TlvDq8ikWAM",
    default_model: "eleven_multilingual_v2",
  },
};

let _config: Config | null = null;

export function loadConfig(): Config {
  if (_config) return _config;

  // Try loading config.json from project root (one level up from dist/)
  const distDir = dirname(fileURLToPath(import.meta.url));
  const projectRoot = dirname(distDir);
  const configPath = join(projectRoot, "config.json");

  try {
    const raw = readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    _config = { ...defaults, ...parsed, elevenlabs: { ...defaults.elevenlabs, ...parsed.elevenlabs } };
  } catch {
    _config = { ...defaults };
  }

  // Environment variables override config file
  if (process.env.PPRO_MCP_PORT) _config!.port = Number(process.env.PPRO_MCP_PORT);
  if (process.env.ELEVENLABS_API_KEY) _config!.elevenlabs.api_key = process.env.ELEVENLABS_API_KEY;

  return _config!;
}
