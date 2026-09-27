import type { LangGraphNode } from "@/api/langgraph-topology";

export type CanvasNodeType = "executor" | "conditional" | "interrupt" | "terminal";

export interface NodeTokensConsumed {
  prompt?: number;
  completion?: number;
  total?: number;
}

export interface NodeDetail {
  id: string;
  type: CanvasNodeType;
  fields: Array<{ label: string; value: string }>;
  state?: string;
  status?: string;
  tokensConsumed?: NodeTokensConsumed | number | string;
  executionLogs?: Array<string> | string;
}

export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  nodeType: string;
  canvasType: CanvasNodeType;
  nodeData: Record<string, unknown>;
  originalNode: LangGraphNode;
  [key: string]: unknown;
}
