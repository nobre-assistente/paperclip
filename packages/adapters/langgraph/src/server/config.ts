import type { AdapterConfigSchema } from "@paperclipai/adapter-utils";
import type { LangGraphAdapterConfig } from "../types.js";

export const DEFAULT_BASE_URL = "http://localhost:2024";
export const DEFAULT_RUN_TIMEOUT_MS = 120_000;

export function parseLangGraphAdapterConfig(raw: Record<string, unknown> | null | undefined): LangGraphAdapterConfig {
  if (!raw || typeof raw !== "object") {
    return {
      baseUrl: DEFAULT_BASE_URL,
      assistantId: "",
      runTimeoutMs: DEFAULT_RUN_TIMEOUT_MS,
    };
  }

  const rawBaseUrl = typeof raw.baseUrl === "string" && raw.baseUrl.trim().length > 0
    ? raw.baseUrl.trim().replace(/\/+$/, "")
    : DEFAULT_BASE_URL;

  const assistantId = typeof raw.assistantId === "string"
    ? raw.assistantId.trim()
    : "";

  let runTimeoutMs = DEFAULT_RUN_TIMEOUT_MS;
  if (typeof raw.runTimeoutMs === "number" && Number.isFinite(raw.runTimeoutMs) && raw.runTimeoutMs > 0) {
    runTimeoutMs = Math.floor(raw.runTimeoutMs);
  } else if (typeof raw.runTimeoutMs === "string" && raw.runTimeoutMs.trim().length > 0) {
    const parsed = Number.parseInt(raw.runTimeoutMs.trim(), 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      runTimeoutMs = parsed;
    }
  }

  return {
    baseUrl: rawBaseUrl,
    assistantId,
    runTimeoutMs,
  };
}

export function getConfigSchema(): AdapterConfigSchema {
  return {
    fields: [
      {
        key: "baseUrl",
        label: "Base URL",
        type: "text",
        required: true,
        default: DEFAULT_BASE_URL,
        hint: "LangGraph Server base URL (e.g. http://localhost:2024)",
      },
      {
        key: "assistantId",
        label: "Assistant ID",
        type: "text",
        required: true,
        hint: "Target assistant or graph ID on the LangGraph server",
      },
      {
        key: "runTimeoutMs",
        label: "Run Timeout (ms)",
        type: "number",
        default: DEFAULT_RUN_TIMEOUT_MS,
        hint: "Maximum execution timeout in milliseconds for the blocking wait call",
      },
    ],
  };
}
