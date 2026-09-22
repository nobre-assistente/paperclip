export type JsonPrimitive = string | number | boolean | null;
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export interface LangGraphAdapterConfig {
  baseUrl: string;
  assistantId: string;
  runTimeoutMs: number;
}

export interface LangGraphSessionParams {
  threadId: string;
  assistantId: string;
  tenantId: string;
}

export interface LangGraphRunConfig {
  configurable: Record<string, JsonValue>;
}

export interface LangGraphRunRequest {
  assistant_id: string;
  input: Record<string, JsonValue>;
  config: LangGraphRunConfig;
}

export interface LangGraphThreadResponse {
  thread_id: string;
  created_at?: string;
  metadata?: Record<string, JsonValue>;
  status?: string;
  values?: Record<string, JsonValue>;
}

export interface LangGraphRunUsage {
  input_tokens?: number;
  output_tokens?: number;
  cached_input_tokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  cachedInputTokens?: number;
}

export interface LangGraphRunResponse {
  run_id?: string;
  thread_id?: string;
  assistant_id?: string;
  status?: "success" | "error" | "interrupted" | "timeout" | string;
  values?: Record<string, JsonValue>;
  error?: string | Record<string, JsonValue>;
  message?: string;
  detail?: string | Record<string, JsonValue>;
  usage?: LangGraphRunUsage;
}
