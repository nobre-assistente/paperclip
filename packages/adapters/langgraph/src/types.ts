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

export interface PendingResumeInfo {
  interruptId: string;
  requestId: string;
}

export interface LangGraphSessionParams {
  threadId: string;
  assistantId: string;
  tenantId: string;
  interruptId?: string;
  pendingResume?: PendingResumeInfo;
}

export interface LangGraphRunConfig {
  configurable?: Record<string, JsonValue>;
}

export interface LangGraphResumeCommand {
  resume: Record<string, unknown> | JsonValue;
}

export interface LangGraphRunRequest {
  assistant_id: string;
  input?: Record<string, JsonValue>;
  command?: LangGraphResumeCommand;
  config?: LangGraphRunConfig;
  context?: Record<string, JsonValue>;
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

export type LangGraphInterruptKind = "approval" | "input" | "elicitation";

export interface InterruptOption {
  id: string;
  label: string;
  description?: string | null;
}

export interface LangGraphInterrupt {
  interrupt_id: string;
  kind: LangGraphInterruptKind;
  prompt: string;
  options: InterruptOption[] | readonly InterruptOption[];
}

export interface LangGraphInterruptItem {
  value?: LangGraphInterrupt | unknown;
  id?: string;
  name?: string;
}

export interface LangGraphTaskItem {
  id?: string;
  name?: string;
  interrupts?: Array<LangGraphInterruptItem | LangGraphInterrupt>;
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
  interrupts?: Array<LangGraphInterruptItem | LangGraphInterrupt>;
  interrupt?: LangGraphInterruptItem | LangGraphInterrupt;
  __interrupt__?: Array<LangGraphInterruptItem | LangGraphInterrupt>;
  tasks?: LangGraphTaskItem[];
}

