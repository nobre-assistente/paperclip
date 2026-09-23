import { describe, expect, it } from "vitest";
import type { LangGraphTopology } from "@/api/langgraph-topology";
import { toReactFlow, resolveCanvasNodeType, getNodeDetail } from "./toReactFlow";

describe("toReactFlow", () => {
  const sampleTopology: LangGraphTopology = {
    nodes: [
      { id: "__start__", type: "start", data: {} },
      { id: "planner", type: "agent", data: { role: "Planner", maxRetries: 3 } },
      { id: "decider", type: "conditional", data: { routeKey: "check_decision" } },
      { id: "human_gate", type: "interrupt", data: { mode: "approval", prompt: "Approve action?" } },
      { id: "__end__", type: "end", data: {} },
    ],
    edges: [
      { source: "__start__", target: "planner", conditional: false },
      { source: "planner", target: "decider", conditional: false },
      { source: "decider", target: "human_gate", conditional: true },
      { source: "decider", target: "__end__", conditional: true },
      { source: "human_gate", target: "__end__", conditional: false },
    ],
  };

  it("toReactFlow maps nodes and edges", () => {
    const { nodes, edges } = toReactFlow(sampleTopology);

    // Node count and edge count match topology
    expect(nodes).toHaveLength(sampleTopology.nodes.length);
    expect(edges).toHaveLength(sampleTopology.edges.length);

    // Verify IDs mapped
    const nodeIds = nodes.map((n) => n.id);
    expect(nodeIds).toEqual(["__start__", "planner", "decider", "human_gate", "__end__"]);

    // Verify positions are computed
    for (const node of nodes) {
      expect(typeof node.position.x).toBe("number");
      expect(typeof node.position.y).toBe("number");
      expect(node.position.y).toBeGreaterThanOrEqual(0);
    }

    // Verify node types mapped to distinct CanvasNodeType
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    expect(nodeMap.get("__start__")?.type).toBe("terminal");
    expect(nodeMap.get("planner")?.type).toBe("executor");
    expect(nodeMap.get("decider")?.type).toBe("conditional");
    expect(nodeMap.get("human_gate")?.type).toBe("interrupt");
    expect(nodeMap.get("__end__")?.type).toBe("terminal");

    // Verify node data holds original node data
    expect(nodeMap.get("planner")?.data.id).toBe("planner");
    expect(nodeMap.get("planner")?.data.data.role).toBe("Planner");

    // Verify edge sources and targets
    expect(edges[0].source).toBe("__start__");
    expect(edges[0].target).toBe("planner");
    expect(edges[2].source).toBe("decider");
    expect(edges[2].target).toBe("human_gate");
  });

  it("conditional edges flagged", () => {
    const { edges } = toReactFlow(sampleTopology);

    const nonConditionalEdge = edges.find((e) => e.source === "__start__" && e.target === "planner");
    expect(nonConditionalEdge).toBeDefined();
    expect(nonConditionalEdge?.animated).toBe(false);
    expect(nonConditionalEdge?.label).toBeUndefined();
    expect(nonConditionalEdge?.data?.conditional).toBe(false);

    const conditionalEdge = edges.find((e) => e.source === "decider" && e.target === "human_gate");
    expect(conditionalEdge).toBeDefined();
    expect(conditionalEdge?.animated).toBe(true);
    expect(conditionalEdge?.label).toBe("conditional");
    expect(conditionalEdge?.data?.conditional).toBe(true);
    expect(conditionalEdge?.style?.strokeDasharray).toBe("5,5");

    const secondConditionalEdge = edges.find((e) => e.source === "decider" && e.target === "__end__");
    expect(secondConditionalEdge).toBeDefined();
    expect(secondConditionalEdge?.animated).toBe(true);
    expect(secondConditionalEdge?.label).toBe("conditional");
    expect(secondConditionalEdge?.data?.conditional).toBe(true);
  });

  it("resolveCanvasNodeType classifies 4 distinct node types correctly", () => {
    expect(resolveCanvasNodeType({ id: "__start__", type: "start", data: {} })).toBe("terminal");
    expect(resolveCanvasNodeType({ id: "__end__", type: "end", data: {} })).toBe("terminal");
    expect(resolveCanvasNodeType({ id: "exit", type: "terminal", data: {} })).toBe("terminal");

    expect(resolveCanvasNodeType({ id: "agent_node", type: "agent", data: {} })).toBe("executor");
    expect(resolveCanvasNodeType({ id: "worker", type: "executor", data: {} })).toBe("executor");
    expect(resolveCanvasNodeType({ id: "search_tool", type: "tool", data: {} })).toBe("executor");

    expect(resolveCanvasNodeType({ id: "route_check", type: "conditional", data: {} })).toBe("conditional");
    expect(resolveCanvasNodeType({ id: "branch_decider", type: "router", data: {} })).toBe("conditional");

    expect(resolveCanvasNodeType({ id: "ask_user", type: "interrupt", data: {} })).toBe("interrupt");
    expect(resolveCanvasNodeType({ id: "human_approval", type: "human", data: {} })).toBe("interrupt");
    expect(resolveCanvasNodeType({ id: "breakpoint", type: "node", data: { interrupt: true } })).toBe("interrupt");
  });

  it("getNodeDetail generates read-only fields correctly", () => {
    const node = sampleTopology.nodes[1]; // planner
    const detail = getNodeDetail(node, sampleTopology.edges);

    expect(detail.id).toBe("planner");
    expect(detail.type).toBe("executor");
    expect(detail.fields).toEqual(
      expect.arrayContaining([
        { label: "ID", value: "planner" },
        { label: "Node Type", value: "agent" },
        { label: "Canvas Role", value: "executor" },
        { label: "role", value: "Planner" },
        { label: "maxRetries", value: "3" },
      ]),
    );

    const incoming = detail.fields.find((f) => f.label === "Incoming Connections");
    expect(incoming?.value).toContain("__start__");

    const outgoing = detail.fields.find((f) => f.label === "Outgoing Connections");
    expect(outgoing?.value).toContain("decider");
  });
  it("handles cyclic graphs with repair loops safely", () => {
    const cyclicTopology = {
      nodes: [
        { id: "__start__", type: "start", data: {} },
        { id: "worker", type: "agent", data: {} },
        { id: "evaluator", type: "conditional", data: {} },
        { id: "repair", type: "agent", data: {} },
        { id: "__end__", type: "end", data: {} },
      ],
      edges: [
        { source: "__start__", target: "worker", conditional: false },
        { source: "worker", target: "evaluator", conditional: false },
        { source: "evaluator", target: "repair", conditional: true },
        { source: "repair", target: "worker", conditional: false }, // Cycle back to worker!
        { source: "evaluator", target: "__end__", conditional: true },
      ],
    };

    const { nodes, edges } = toReactFlow(cyclicTopology);
    expect(nodes).toHaveLength(5);
    expect(edges).toHaveLength(5);
    for (const node of nodes) {
      expect(node.position.x).toBeTypeOf("number");
      expect(node.position.y).toBeTypeOf("number");
    }
  });
});
