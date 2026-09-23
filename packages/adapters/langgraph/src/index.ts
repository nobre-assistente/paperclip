import type { AdapterModel } from "@paperclipai/adapter-utils";

export const type = "langgraph";
export const label = "LangGraph";

export const models: AdapterModel[] = [];

export const agentConfigurationDoc = `# LangGraph Agent Configuration

Adapter: langgraph

Use when:
- Orchestrating tasks using LangGraph graphs and workflows.
- Mapping Paperclip heartbeats directly to LangGraph runs over persistent threads.
- Requiring company-level tenant isolation directly on the LangGraph execution runtime.

Don't use when:
- Executing local CLI processes (use process or claude_local / codex_local adapters instead).
- Direct unmanaged LLM API calls without a LangGraph server.

Core fields:
- baseUrl (string, required): LangGraph Server base URL (e.g. "http://localhost:2024").
- assistantId (string, required): Identifier of the assistant or graph on the LangGraph server.
- runTimeoutMs (number, optional): Run timeout in milliseconds (default: 120000).
`;

export * from "./types.js";
export { buildResumePayload } from "./server/interrupt.js";
