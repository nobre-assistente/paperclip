import type { LangGraphNode } from "@/api/langgraph-topology";

export type CanvasNodeType = "executor" | "conditional" | "interrupt" | "terminal";

export interface NodeTokensConsumed {
  prompt?: number;
  completion?: number;
  total?: number;
}

export interface NodeRuntimeControls {
  bypass: boolean;
  forceHitl: boolean;
  mockOutput?: string;
}

export interface NodeConfigParameters {
  assistantId: string;
  model: string;
  temperature: number;
  systemPrompt: string;
  timeoutMs: number;
  specialistRole?: string;
  specialistContract: Record<string, unknown>;
  [key: string]: unknown;
}

export interface NodeArtifactInspection {
  name: string;
  type: string;
  size?: number | string;
  content: unknown;
}

export interface NodeExecutionRecord {
  id: string;
  nodeId: string;
  timestamp: string;
  status: "success" | "failed" | "running" | "bypassed" | "interrupted";
  durationMs: number;
  tokensConsumed: NodeTokensConsumed;
  inputs?: Record<string, unknown> | unknown;
  outputs?: Record<string, unknown> | unknown;
  artifacts?: NodeArtifactInspection[];
  logs?: string[];
}

export interface NodeDetail {
  id: string;
  type: CanvasNodeType;
  fields: Array<{ label: string; value: string }>;
  state?: string;
  status?: string;
  tokensConsumed?: NodeTokensConsumed | number | string;
  executionLogs?: Array<string> | string;
  durationMs?: number;
  controls?: NodeRuntimeControls;
  parameters?: NodeConfigParameters;
  history?: NodeExecutionRecord[];
  agentId?: string;
  agentName?: string;
}

export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  nodeType: string;
  canvasType: CanvasNodeType;
  nodeData: Record<string, unknown>;
  originalNode: LangGraphNode;
  controls?: NodeRuntimeControls;
  parameters?: Partial<NodeConfigParameters>;
  isRunning?: boolean;
  agentId?: string;
  agentName?: string;
  [key: string]: unknown;
}
