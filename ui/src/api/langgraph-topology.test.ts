import { describe, expect, it } from "vitest";
import { decodeLangGraphTopology } from "./langgraph-topology";

describe("LangGraph Topology Decoder", () => {
  it("decode topology rejects malformed", () => {
    // null, undefined, primitives, arrays
    expect(() => decodeLangGraphTopology(null)).toThrow("Invalid topology: expected a plain object");
    expect(() => decodeLangGraphTopology(undefined)).toThrow("Invalid topology: expected a plain object");
    expect(() => decodeLangGraphTopology("string")).toThrow("Invalid topology: expected a plain object");
    expect(() => decodeLangGraphTopology(123)).toThrow("Invalid topology: expected a plain object");
    expect(() => decodeLangGraphTopology(true)).toThrow("Invalid topology: expected a plain object");
    expect(() => decodeLangGraphTopology([])).toThrow("Invalid topology: expected a plain object");

    // missing nodes or edges
    expect(() => decodeLangGraphTopology({})).toThrow('Invalid topology: "nodes" must be an array');
    expect(() => decodeLangGraphTopology({ nodes: [] })).toThrow('Invalid topology: "edges" must be an array');
    expect(() => decodeLangGraphTopology({ edges: [] })).toThrow('Invalid topology: "nodes" must be an array');

    // extra properties at topology root (extra='forbid')
    expect(() => decodeLangGraphTopology({ nodes: [], edges: [], extra: "not_allowed" })).toThrow(
      'Invalid topology: unexpected property "extra"',
    );

    // nodes or edges not an array
    expect(() => decodeLangGraphTopology({ nodes: "invalid", edges: [] })).toThrow(
      'Invalid topology: "nodes" must be an array',
    );
    expect(() => decodeLangGraphTopology({ nodes: {}, edges: [] })).toThrow(
      'Invalid topology: "nodes" must be an array',
    );
    expect(() => decodeLangGraphTopology({ nodes: [], edges: "invalid" })).toThrow(
      'Invalid topology: "edges" must be an array',
    );
    expect(() => decodeLangGraphTopology({ nodes: [], edges: {} })).toThrow(
      'Invalid topology: "edges" must be an array',
    );

    // malformed nodes
    expect(() => decodeLangGraphTopology({ nodes: [null], edges: [] })).toThrow(
      "Invalid node at index 0: expected a plain object",
    );
    expect(() => decodeLangGraphTopology({ nodes: ["string_node"], edges: [] })).toThrow(
      "Invalid node at index 0: expected a plain object",
    );
    expect(() => decodeLangGraphTopology({ nodes: [{ id: "n1" }], edges: [] })).toThrow(
      'Invalid node at index 0: "type" must be a string',
    );
    expect(() => decodeLangGraphTopology({ nodes: [{ id: "n1", type: "agent" }], edges: [] })).toThrow(
      'Invalid node at index 0: "data" must be a non-null object',
    );
    expect(() => decodeLangGraphTopology({ nodes: [{ id: 123, type: "agent", data: {} }], edges: [] })).toThrow(
      'Invalid node at index 0: "id" must be a string',
    );
    expect(() => decodeLangGraphTopology({ nodes: [{ id: "n1", type: 123, data: {} }], edges: [] })).toThrow(
      'Invalid node at index 0: "type" must be a string',
    );
    expect(() => decodeLangGraphTopology({ nodes: [{ id: "n1", type: "agent", data: "str" }], edges: [] })).toThrow(
      'Invalid node at index 0: "data" must be a non-null object',
    );
    expect(() => decodeLangGraphTopology({ nodes: [{ id: "n1", type: "agent", data: null }], edges: [] })).toThrow(
      'Invalid node at index 0: "data" must be a non-null object',
    );
    expect(() => decodeLangGraphTopology({ nodes: [{ id: "n1", type: "agent", data: [] }], edges: [] })).toThrow(
      'Invalid node at index 0: "data" must be a non-null object',
    );
    expect(() => decodeLangGraphTopology({ nodes: [{ id: "n1", type: "agent", data: {}, extra: true }], edges: [] })).toThrow(
      'Invalid node at index 0: unexpected property "extra"',
    );

    // malformed edges
    expect(() => decodeLangGraphTopology({ nodes: [], edges: [null] })).toThrow(
      "Invalid edge at index 0: expected a plain object",
    );
    expect(() => decodeLangGraphTopology({ nodes: [], edges: ["invalid_edge"] })).toThrow(
      "Invalid edge at index 0: expected a plain object",
    );
    expect(() => decodeLangGraphTopology({ nodes: [], edges: [{ source: "a" }] })).toThrow(
      'Invalid edge at index 0: "target" must be a string',
    );
    expect(() => decodeLangGraphTopology({ nodes: [], edges: [{ source: "a", target: "b" }] })).toThrow(
      'Invalid edge at index 0: "conditional" must be a boolean',
    );
    expect(() => decodeLangGraphTopology({ nodes: [], edges: [{ source: 1, target: "b", conditional: false }] })).toThrow(
      'Invalid edge at index 0: "source" must be a string',
    );
    expect(() => decodeLangGraphTopology({ nodes: [], edges: [{ source: "a", target: 2, conditional: false }] })).toThrow(
      'Invalid edge at index 0: "target" must be a string',
    );
    expect(() => decodeLangGraphTopology({ nodes: [], edges: [{ source: "a", target: "b", conditional: "true" }] })).toThrow(
      'Invalid edge at index 0: "conditional" must be a boolean',
    );
    expect(() => decodeLangGraphTopology({ nodes: [], edges: [{ source: "a", target: "b", conditional: 1 }] })).toThrow(
      'Invalid edge at index 0: "conditional" must be a boolean',
    );
    expect(() => decodeLangGraphTopology({ nodes: [], edges: [{ source: "a", target: "b", conditional: true, extra: 1 }] })).toThrow(
      'Invalid edge at index 0: unexpected property "extra"',
    );
  });

  it("decodes valid topology correctly", () => {
    const valid = {
      nodes: [
        { id: "__start__", type: "start", data: {} },
        { id: "planner", type: "agent", data: { role: "Planner", maxRetries: 3 } },
        { id: "__end__", type: "end", data: {} },
      ],
      edges: [
        { source: "__start__", target: "planner", conditional: false },
        { source: "planner", target: "__end__", conditional: true },
      ],
    };

    const topology = decodeLangGraphTopology(valid);
    expect(topology.nodes).toHaveLength(3);
    expect(topology.edges).toHaveLength(2);
    expect(topology.nodes[0].id).toBe("__start__");
    expect(topology.nodes[1].data.role).toBe("Planner");
    expect(topology.edges[1].conditional).toBe(true);
  });
});
