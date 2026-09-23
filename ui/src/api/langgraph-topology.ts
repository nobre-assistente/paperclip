import { useQuery, type UseQueryResult, type UseQueryOptions } from "@tanstack/react-query";
import { api, type RequestOptions } from "./client";

export interface LangGraphNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

export interface LangGraphEdge {
  source: string;
  target: string;
  conditional: boolean;
}

export interface LangGraphTopology {
  nodes: LangGraphNode[];
  edges: LangGraphEdge[];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodeNode(rawNode: unknown, index: number): LangGraphNode {
  if (!isPlainObject(rawNode)) {
    throw new Error(`Invalid node at index ${index}: expected a plain object`);
  }

  const allowedKeys = new Set(["id", "type", "data"]);
  for (const key of Object.keys(rawNode)) {
    if (!allowedKeys.has(key)) {
      throw new Error(`Invalid node at index ${index}: unexpected property "${key}"`);
    }
  }

  if (typeof rawNode.id !== "string") {
    throw new Error(`Invalid node at index ${index}: "id" must be a string`);
  }

  if (typeof rawNode.type !== "string") {
    throw new Error(`Invalid node at index ${index}: "type" must be a string`);
  }

  if (!isPlainObject(rawNode.data)) {
    throw new Error(`Invalid node at index ${index}: "data" must be a non-null object`);
  }

  return {
    id: rawNode.id,
    type: rawNode.type,
    data: rawNode.data,
  };
}

function decodeEdge(rawEdge: unknown, index: number): LangGraphEdge {
  if (!isPlainObject(rawEdge)) {
    throw new Error(`Invalid edge at index ${index}: expected a plain object`);
  }

  const allowedKeys = new Set(["source", "target", "conditional"]);
  for (const key of Object.keys(rawEdge)) {
    if (!allowedKeys.has(key)) {
      throw new Error(`Invalid edge at index ${index}: unexpected property "${key}"`);
    }
  }

  if (typeof rawEdge.source !== "string") {
    throw new Error(`Invalid edge at index ${index}: "source" must be a string`);
  }

  if (typeof rawEdge.target !== "string") {
    throw new Error(`Invalid edge at index ${index}: "target" must be a string`);
  }

  if (typeof rawEdge.conditional !== "boolean") {
    throw new Error(`Invalid edge at index ${index}: "conditional" must be a boolean`);
  }

  return {
    source: rawEdge.source,
    target: rawEdge.target,
    conditional: rawEdge.conditional,
  };
}

export function decodeLangGraphTopology(raw: unknown): LangGraphTopology {
  if (!isPlainObject(raw)) {
    throw new Error("Invalid topology: expected a plain object");
  }

  const allowedKeys = new Set(["nodes", "edges"]);
  for (const key of Object.keys(raw)) {
    if (!allowedKeys.has(key)) {
      throw new Error(`Invalid topology: unexpected property "${key}"`);
    }
  }

  if (!Array.isArray(raw.nodes)) {
    throw new Error('Invalid topology: "nodes" must be an array');
  }

  if (!Array.isArray(raw.edges)) {
    throw new Error('Invalid topology: "edges" must be an array');
  }

  const nodes = raw.nodes.map((node, i) => decodeNode(node, i));
  const edges = raw.edges.map((edge, i) => decodeEdge(edge, i));

  return { nodes, edges };
}

export const langgraphTopologyApi = {
  getGraph: async (assistantId: string, options?: RequestOptions): Promise<LangGraphTopology> => {
    const raw = await api.get<unknown>(`/assistants/${encodeURIComponent(assistantId)}/graph`, options);
    return decodeLangGraphTopology(raw);
  },
};

export function useGraphTopology(
  assistantId: string | null | undefined,
  options?: Omit<UseQueryOptions<LangGraphTopology, Error, LangGraphTopology, readonly unknown[]>, "queryKey" | "queryFn">,
): UseQueryResult<LangGraphTopology, Error> {
  return useQuery({
    queryKey: ["langgraph", "topology", assistantId ?? ""] as const,
    queryFn: async ({ signal }) => {
      if (!assistantId) {
        throw new Error("Assistant ID is required to fetch graph topology");
      }
      return langgraphTopologyApi.getGraph(assistantId, { signal });
    },
    enabled: Boolean(assistantId) && (options?.enabled ?? true),
    ...options,
  });
}
