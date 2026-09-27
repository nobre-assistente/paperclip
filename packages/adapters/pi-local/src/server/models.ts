import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { AdapterModel } from "@paperclipai/adapter-utils";
import { asString, runChildProcess } from "@paperclipai/adapter-utils/server-utils";
const MODELS_CACHE_TTL_MS = 60_000;

function firstNonEmptyLine(text: string): string {
  return (
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) ?? ""
  );
}

function parseModelsOutput(stdout: string): AdapterModel[] {
  const parsed: AdapterModel[] = [];
  const lines = stdout.split(/\r?\n/);
  
  // Skip header line if present
  let startIndex = 0;
  if (lines.length > 0 && (lines[0].includes("provider") || lines[0].includes("model"))) {
    startIndex = 1;
  }
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse format: "provider   model   context  max-out  thinking  images"
    // Split by 2+ spaces to handle the columnar format
    const parts = line.split(/\s{2,}/);
    if (parts.length < 2) continue;
    
    const provider = parts[0].trim();
    const model = parts[1].trim();
    
    if (!provider || !model) continue;
    if (provider === "provider" && model === "model") continue; // Skip header
    
    const id = `${provider}/${model}`;
    parsed.push({ id, label: id });
  }
  
  return parsed;
}

function dedupeModels(models: AdapterModel[]): AdapterModel[] {
  const seen = new Set<string>();
  const deduped: AdapterModel[] = [];
  for (const model of models) {
    const id = model.id.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    deduped.push({ id, label: model.label.trim() || id });
  }
  return deduped;
}

function sortModels(models: AdapterModel[]): AdapterModel[] {
  return [...models].sort((a, b) =>
    a.id.localeCompare(b.id, "en", { numeric: true, sensitivity: "base" }),
  );
}

export const ANTIGRAVITY_CATALOG_MODELS: AdapterModel[] = [
  { id: "google-antigravity/gemini-3.8-flash", label: "google-antigravity/gemini-3.8-flash" },
  { id: "google-antigravity/gemini-3.8-pro", label: "google-antigravity/gemini-3.8-pro" },
  { id: "google-antigravity/claude-sonnet-4-5", label: "google-antigravity/claude-sonnet-4-5" },
];

export function isCommandAvailable(cmd: string): boolean {
  if (path.isAbsolute(cmd)) {
    try {
      return fs.existsSync(cmd) && (fs.statSync(cmd).mode & 0o111) !== 0;
    } catch {
      return false;
    }
  }
  const pathEnv = process.env.PATH ?? "";
  const dirs = pathEnv.split(path.delimiter);
  for (const dir of dirs) {
    if (!dir) continue;
    const fullPath = path.join(dir, cmd);
    try {
      if (fs.existsSync(fullPath) && (fs.statSync(fullPath).mode & 0o111) !== 0) {
        return true;
      }
    } catch {
      // ignore
    }
  }
  return false;
}

export function resolvePiCommand(input?: unknown): string {
  const custom = typeof input === "string" ? input.trim() : "";
  if (custom && custom !== "pi") {
    return custom;
  }
  const envOverride =
    typeof process.env.PAPERCLIP_PI_COMMAND === "string" &&
    process.env.PAPERCLIP_PI_COMMAND.trim().length > 0
      ? process.env.PAPERCLIP_PI_COMMAND.trim()
      : undefined;
  if (envOverride) {
    if (envOverride !== "pi" || isCommandAvailable("pi")) {
      return envOverride;
    }
  }
  if (custom === "pi" && isCommandAvailable("pi")) {
    return "pi";
  }
  if (isCommandAvailable("pi")) {
    return "pi";
  }
  if (isCommandAvailable("omp")) {
    return "omp";
  }
  if (fs.existsSync("/home/orca/.local/bin/omp")) {
    return "/home/orca/.local/bin/omp";
  }
  const userHomeOmp = path.join(os.homedir(), ".local", "bin", "omp");
  if (fs.existsSync(userHomeOmp)) {
    return userHomeOmp;
  }
  return "omp";
}

const discoveryCache = new Map<string, { expiresAt: number; models: AdapterModel[] }>();
const VOLATILE_ENV_KEY_PREFIXES = ["PAPERCLIP_", "npm_", "NPM_"] as const;
const VOLATILE_ENV_KEY_EXACT = new Set(["PWD", "OLDPWD", "SHLVL", "_", "TERM_SESSION_ID"]);

function isVolatileEnvKey(key: string): boolean {
  if (VOLATILE_ENV_KEY_EXACT.has(key)) return true;
  return VOLATILE_ENV_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function discoveryCacheKey(command: string, cwd: string, env: Record<string, string>) {
  const envKey = Object.entries(env)
    .filter(([key]) => !isVolatileEnvKey(key))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${hashValue(value)}`)
    .join("\n");
  return `${command}\n${cwd}\n${envKey}`;
}

function pruneExpiredDiscoveryCache(now: number) {
  for (const [key, value] of discoveryCache.entries()) {
    if (value.expiresAt <= now) discoveryCache.delete(key);
  }
}

export async function discoverPiModels(input: {
  command?: unknown;
  cwd?: unknown;
  env?: unknown;
} = {}): Promise<AdapterModel[]> {
  const command = resolvePiCommand(input.command);
  const cwd = asString(input.cwd, process.cwd());
  const env = normalizeEnv(input.env);
  const runtimeEnv = normalizeEnv({ ...process.env, ...env });

  const isOmp = command === "omp" || command.endsWith("/omp");

  if (isOmp) {
    // 1. Try omp --list-models first as per specification
    try {
      const result = await runChildProcess(
        `pi-models-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        command,
        ["--list-models"],
        {
          cwd,
          env: runtimeEnv,
          timeoutSec: 20,
          graceSec: 3,
          onLog: async () => {},
        },
      );
      if (!result.timedOut && (result.exitCode ?? 1) === 0) {
        const output = result.stderr || result.stdout;
        const parsed = parseModelsOutput(output);
        if (parsed.length > 0) {
          return sortModels(dedupeModels([...ANTIGRAVITY_CATALOG_MODELS, ...parsed]));
        }
      }
    } catch {
      // Fall through to omp models --json or static catalog
    }

    // 2. Try omp models --json
    try {
      const resultJson = await runChildProcess(
        `omp-models-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        command,
        ["models", "--json"],
        {
          cwd,
          env: runtimeEnv,
          timeoutSec: 20,
          graceSec: 3,
          onLog: async () => {},
        },
      );
      if (!resultJson.timedOut && (resultJson.exitCode ?? 1) === 0) {
        const data = JSON.parse(resultJson.stdout) as {
          models?: Array<{ id: string; provider: string; selector?: string }>;
        };
        if (Array.isArray(data?.models)) {
          const discovered: AdapterModel[] = data.models.map((m) => {
            const id = m.selector || `${m.provider}/${m.id}`;
            return { id, label: id };
          });
          return sortModels(dedupeModels([...ANTIGRAVITY_CATALOG_MODELS, ...discovered]));
        }
      }
    } catch {
      // Fall through to static catalog
    }

    // 3. Fallback to static catalog models
    return sortModels(dedupeModels([...ANTIGRAVITY_CATALOG_MODELS]));
  }

  const result = await runChildProcess(
    `pi-models-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    command,
    ["--list-models"],
    {
      cwd,
      env: runtimeEnv,
      timeoutSec: 20,
      graceSec: 3,
      onLog: async () => {},
    },
  );

  if (result.timedOut) {
    throw new Error("`pi --list-models` timed out.");
  }
  if ((result.exitCode ?? 1) !== 0) {
    const detail = firstNonEmptyLine(result.stderr) || firstNonEmptyLine(result.stdout);
    throw new Error(detail ? `\`pi --list-models\` failed: ${detail}` : "`pi --list-models` failed.");
  }

  // Pi outputs model list to stderr, but fall back to stdout for older versions
  const output = result.stderr || result.stdout;
  return sortModels(dedupeModels(parseModelsOutput(output)));
}

function normalizeEnv(input: unknown): Record<string, string> {
  const envInput = typeof input === "object" && input !== null && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : {};
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(envInput)) {
    if (typeof value === "string") env[key] = value;
  }
  return env;
}

export async function discoverPiModelsCached(input: {
  command?: unknown;
  cwd?: unknown;
  env?: unknown;
} = {}): Promise<AdapterModel[]> {
  const command = resolvePiCommand(input.command);
  const cwd = asString(input.cwd, process.cwd());
  const env = normalizeEnv(input.env);
  const key = discoveryCacheKey(command, cwd, env);
  const now = Date.now();
  pruneExpiredDiscoveryCache(now);
  const cached = discoveryCache.get(key);
  if (cached && cached.expiresAt > now) return cached.models;

  const models = await discoverPiModels({ command, cwd, env });
  discoveryCache.set(key, { expiresAt: now + MODELS_CACHE_TTL_MS, models });
  return models;
}

export async function ensurePiModelConfiguredAndAvailable(input: {
  model?: unknown;
  command?: unknown;
  cwd?: unknown;
  env?: unknown;
}): Promise<AdapterModel[]> {
  const model = asString(input.model, "").trim();
  if (!model) {
    throw new Error("Pi requires `adapterConfig.model` in provider/model format.");
  }

  const models = await discoverPiModelsCached({
    command: input.command,
    cwd: input.cwd,
    env: input.env,
  });

  if (models.length === 0) {
    throw new Error("Pi returned no models. Run `pi --list-models` and verify provider auth.");
  }

  if (!models.some((entry) => entry.id === model)) {
    const sample = models.slice(0, 12).map((entry) => entry.id).join(", ");
    throw new Error(
      `Configured Pi model is unavailable: ${model}. Available models: ${sample}${models.length > 12 ? ", ..." : ""}`,
    );
  }

  return models;
}

export async function listPiModels(): Promise<AdapterModel[]> {
  try {
    return await discoverPiModelsCached();
  } catch {
    return [];
  }
}

export function resetPiModelsCacheForTests() {
  discoveryCache.clear();
}
