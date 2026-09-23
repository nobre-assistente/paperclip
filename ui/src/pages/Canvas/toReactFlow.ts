import { MarkerType, type Node, type Edge } from "@xyflow/react";
import type { LangGraphTopology, LangGraphNode, LangGraphEdge } from "@/api/langgraph-topology";
import type { CanvasNodeType, NodeDetail } from "./types";

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

export function toReactFlow(topology: LangGraphTopology): {
  nodes: Node<LangGraphNode>[];
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

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currLevel = levels.get(curr) ?? 0;
    const neighbors = adj.get(curr) ?? [];
    for (const next of neighbors) {
      const nextLevel = Math.max(levels.get(next) ?? 0, currLevel + 1);
      if (!levels.has(next) || levels.get(next)! < nextLevel) {
        levels.set(next, nextLevel);
        queue.push(next);
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

  const nodes: Node<LangGraphNode>[] = [];
  for (const [lvl, group] of levelGroups.entries()) {
    const count = group.length;
    group.forEach((lgNode, idx) => {
      const x = (idx - (count - 1) / 2) * 260 + 350;
      const y = lvl * 130 + 50;
      const canvasType = resolveCanvasNodeType(lgNode, lgEdges);

      nodes.push({
        id: lgNode.id,
        type: canvasType,
        position: { x, y },
        data: lgNode,
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

export function getNodeDetail(
  node: LangGraphNode,
  edges: LangGraphEdge[] = [],
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

  return {
    id: node.id,
    type: canvasType,
    fields,
  };
}
