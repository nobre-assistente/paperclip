import { MarkerType, type Node, type Edge } from "@xyflow/react";
import type { LangGraphTopology, LangGraphNode, LangGraphEdge } from "@/api/langgraph-topology";
import { resolveSpecialistRole, getSpecialistDefaultContract } from "@paperclipai/shared";
import type {
  CanvasNodeType,
  NodeDetail,
  CanvasNodeData,
  NodeRuntimeControls,
  NodeConfigParameters,
  NodeExecutionRecord,
} from "./types";

export function resolveCanvasNodeType(
  node: LangGraphNode,
  edges: LangGraphEdge[] = [],
): CanvasNodeType {
  const typeStr = (node.type || "").toLowerCase().trim();
  const idStr = (node.id || "").toLowerCase().trim();

  // 1. Terminal: start or end nodes
  if (
    idStr === "__start__" ||
    idStr === "__end__" ||
    typeStr === "start" ||
    typeStr === "end" ||
    typeStr === "terminal" ||
    node.data?.terminal === true
  ) {
    return "terminal";
  }

  // 2. Interrupt: human-in-the-loop, approval, or breakpoints
  if (
    typeStr === "interrupt" ||
    typeStr === "human" ||
    typeStr === "hitl" ||
    idStr.includes("interrupt") ||
    node.data?.interrupt === true ||
    node.data?.is_interrupt === true
  ) {
    return "interrupt";
  }

  // 3. Conditional: branch / router / decision logic
  if (
    typeStr === "conditional" ||
    typeStr === "router" ||
    typeStr === "branch" ||
    typeStr === "decision" ||
    idStr.includes("conditional") ||
    idStr.includes("router") ||
    node.data?.conditional === true
  ) {
    return "conditional";
  }

  if (
    (typeStr === "" || typeStr === "node") &&
    edges.some((e) => e.source === node.id && e.conditional)
  ) {
    return "conditional";
  }

  // 4. Default: executor (agents, tools, llms, actions)
  return "executor";
}

export interface ToReactFlowOptions {
  controls?: Record<string, NodeRuntimeControls>;
  parameters?: Record<string, Partial<NodeConfigParameters>>;
  runningNodeIds?: Set<string> | string[];
}

export function toReactFlow(
  topology: LangGraphTopology,
  options?: ToReactFlowOptions,
): {
  nodes: Node<CanvasNodeData>[];
  edges: Edge[];
} {
  const { nodes: lgNodes, edges: lgEdges } = topology;

  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const node of lgNodes) {
    inDegree.set(node.id, 0);
    adj.set(node.id, []);
  }

  for (const edge of lgEdges) {
    if (adj.has(edge.source)) {
      adj.get(edge.source)!.push(edge.target);
    }
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  const levels = new Map<string, number>();
  const queue: string[] = [];

  for (const node of lgNodes) {
    if ((inDegree.get(node.id) ?? 0) === 0 || node.id === "__start__" || node.type === "start") {
      levels.set(node.id, 0);
      queue.push(node.id);
    }
  }

  if (queue.length === 0 && lgNodes.length > 0) {
    levels.set(lgNodes[0].id, 0);
    queue.push(lgNodes[0].id);
  }

  const visitCounts = new Map<string, number>();

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currLevel = levels.get(curr) ?? 0;
    const neighbors = adj.get(curr) ?? [];
    for (const next of neighbors) {
      const nextLevel = currLevel + 1;
      const count = visitCounts.get(next) ?? 0;
      if (nextLevel < lgNodes.length && count < (inDegree.get(next) ?? 1)) {
        if (!levels.has(next) || levels.get(next)! < nextLevel) {
          levels.set(next, nextLevel);
          visitCounts.set(next, count + 1);
          queue.push(next);
        }
      }
    }
  }

  // Fallback for unvisited / disconnected nodes
  for (const node of lgNodes) {
    if (!levels.has(node.id)) {
      levels.set(node.id, 0);
    }
  }

  const levelGroups = new Map<number, LangGraphNode[]>();
  for (const node of lgNodes) {
    const lvl = levels.get(node.id) ?? 0;
    if (!levelGroups.has(lvl)) {
      levelGroups.set(lvl, []);
    }
    levelGroups.get(lvl)!.push(node);
  }

  const runningIds = options?.runningNodeIds instanceof Set
    ? options.runningNodeIds
    : Array.isArray(options?.runningNodeIds)
      ? new Set(options.runningNodeIds)
      : null;

  const nodes: Node<CanvasNodeData>[] = [];
  for (const [lvl, group] of levelGroups.entries()) {
    const count = group.length;
    group.forEach((lgNode, idx) => {
      const x = (idx - (count - 1) / 2) * 260 + 350;
      const y = lvl * 130 + 50;
      const canvasType = resolveCanvasNodeType(lgNode, lgEdges);

      const nodeControls = options?.controls?.[lgNode.id];
      const nodeParams = options?.parameters?.[lgNode.id];
      const isRunning = runningIds ? runningIds.has(lgNode.id) : false;

      const nodeData: CanvasNodeData = {
        ...lgNode,
        label: lgNode.id,
        nodeType: lgNode.type,
        canvasType,
        nodeData: (lgNode.data as Record<string, unknown>) ?? {},
        originalNode: lgNode,
        controls: nodeControls,
        parameters: nodeParams,
        isRunning,
      };

      nodes.push({
        id: lgNode.id,
        type: canvasType,
        position: { x, y },
        data: nodeData,
      });
    });
  }

  const edges: Edge[] = lgEdges.map((lgEdge, idx) => ({
    id: `edge-${idx}-${lgEdge.source}-${lgEdge.target}`,
    source: lgEdge.source,
    target: lgEdge.target,
    animated: lgEdge.conditional,
    label: lgEdge.conditional ? "conditional" : undefined,
    data: {
      conditional: lgEdge.conditional,
    },
    labelStyle: { fill: "var(--muted-foreground)" },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "var(--border)",
    },
    style: {
      stroke: lgEdge.conditional ? "var(--primary)" : "var(--border)",
      strokeWidth: lgEdge.conditional ? 2 : 1.5,
      strokeDasharray: lgEdge.conditional ? "5,5" : undefined,
    },
  }));

  return { nodes, edges };
}

export interface GetNodeDetailOptions {
  controls?: NodeRuntimeControls;
  parameters?: NodeConfigParameters;
  history?: NodeExecutionRecord[];
  agentId?: string;
  agentName?: string;
}

export function getNodeDetail(
  node: LangGraphNode,
  edges: LangGraphEdge[] = [],
  options?: GetNodeDetailOptions,
): NodeDetail {
  const canvasType = resolveCanvasNodeType(node, edges);
  const fields: Array<{ label: string; value: string }> = [
    { label: "ID", value: node.id },
    { label: "Node Type", value: node.type },
    { label: "Canvas Role", value: canvasType },
  ];

  if (node.data && typeof node.data === "object") {
    for (const [key, value] of Object.entries(node.data)) {
      fields.push({
        label: key,
        value: typeof value === "object" && value !== null ? JSON.stringify(value) : String(value),
      });
    }
  }

  const incoming = edges.filter((e) => e.target === node.id);
  const outgoing = edges.filter((e) => e.source === node.id);

  if (incoming.length > 0) {
    fields.push({
      label: "Incoming Connections",
      value: incoming.map((e) => `${e.source}${e.conditional ? " (conditional)" : ""}`).join(", "),
    });
  }

  if (outgoing.length > 0) {
    fields.push({
      label: "Outgoing Connections",
      value: outgoing.map((e) => `${e.target}${e.conditional ? " (conditional)" : ""}`).join(", "),
    });
  }

  const rawData = (node.data && typeof node.data === "object") ? (node.data as Record<string, unknown>) : {};
  const rawMeta = (node.metadata && typeof node.metadata === "object") ? (node.metadata as Record<string, unknown>) : {};

  const stateVal = rawData.state ?? rawData.status ?? rawData.node_state ?? rawMeta.state;
  const stateStr = typeof stateVal === "string" ? stateVal : undefined;

  const tokensVal = rawData.tokens_consumed ?? rawData.tokensConsumed ?? rawData.tokens ?? rawMeta.tokens_consumed;
  let tokensConsumed: NodeDetail["tokensConsumed"] = undefined;
  if (typeof tokensVal === "number" || typeof tokensVal === "string") {
    tokensConsumed = tokensVal;
  } else if (typeof tokensVal === "object" && tokensVal !== null) {
    const rec = tokensVal as Record<string, unknown>;
    tokensConsumed = {
      prompt: typeof rec.prompt === "number" ? rec.prompt : undefined,
      completion: typeof rec.completion === "number" ? rec.completion : undefined,
      total: typeof rec.total === "number" ? rec.total : undefined,
    };
  }

  const logsVal = rawData.execution_logs ?? rawData.executionLogs ?? rawData.logs ?? rawMeta.execution_logs;
  let executionLogs: NodeDetail["executionLogs"] = undefined;
  if (typeof logsVal === "string") {
    executionLogs = logsVal;
  } else if (Array.isArray(logsVal)) {
    executionLogs = logsVal.map((item) => String(item));
  }

  const durationVal =
    rawData.duration_ms ??
    rawData.durationMs ??
    rawMeta.duration_ms ??
    rawMeta.durationMs;
  const durationMs = typeof durationVal === "number" ? durationVal : undefined;

  const resolvedRole = resolveSpecialistRole(node.id);
  const defaultContract = resolvedRole ? getSpecialistDefaultContract(resolvedRole) : {};

  const effectiveParameters: NodeConfigParameters = {
    assistantId: (rawData.assistantId as string | undefined) ?? node.id,
    model:
      (rawData.model as string | undefined) ??
      (rawMeta.model as string | undefined) ??
      "google-antigravity/gemini-3.8-flash",
    temperature:
      typeof rawData.temperature === "number"
        ? rawData.temperature
        : typeof rawMeta.temperature === "number"
          ? rawMeta.temperature
          : 0.7,
    systemPrompt:
      (rawData.systemPrompt as string | undefined) ??
      (rawData.prompt as string | undefined) ??
      (rawMeta.systemPrompt as string | undefined) ??
      "",
    timeoutMs:
      typeof rawData.timeoutMs === "number"
        ? rawData.timeoutMs
        : typeof rawData.timeout_ms === "number"
          ? rawData.timeout_ms
          : 30000,
    specialistRole: resolvedRole,
    specialistContract:
      (rawData.specialistContract as Record<string, unknown> | undefined) ??
      defaultContract,
    ...(options?.parameters ?? {}),
  };

  const effectiveControls: NodeRuntimeControls = {
    bypass: Boolean(rawData.bypass),
    forceHitl: Boolean(rawData.forceHitl || canvasType === "interrupt"),
    mockOutput: typeof rawData.mockOutput === "string" ? rawData.mockOutput : undefined,
    ...(options?.controls ?? {}),
  };

  return {
    id: node.id,
    type: canvasType,
    fields,
    state: stateStr,
    status: stateStr,
    tokensConsumed,
    executionLogs,
    durationMs,
    controls: effectiveControls,
    parameters: effectiveParameters,
    history: options?.history,
    agentId: options?.agentId,
    agentName: options?.agentName,
  };
}
