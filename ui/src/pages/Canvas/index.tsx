import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useQuery } from "@tanstack/react-query";
import { Workflow, RefreshCw, AlertCircle, Search } from "lucide-react";
import { useParams, useSearchParams } from "@/lib/router";
import { useCompany } from "@/context/CompanyContext";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { agentsApi } from "@/api/agents";
import { useGraphTopology } from "@/api/langgraph-topology";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { PaperclipLoading } from "@/components/AnimatedPaperclipIcon";
import { cn } from "@/lib/utils";
import { nodeTypes } from "./CanvasNode";
import { toReactFlow, getNodeDetail, resolveCanvasNodeType } from "./toReactFlow";
import { NodePropertiesPanel } from "./NodePropertiesPanel";
import type { CanvasNodeType, NodeDetail, CanvasNodeData } from "./types";

export type { CanvasNodeType, NodeDetail, CanvasNodeData };
export { toReactFlow, getNodeDetail, resolveCanvasNodeType, nodeTypes };

export function Canvas() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { selectedCompanyId } = useCompany();
  const params = useParams<{ assistantId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlAssistantId = params.assistantId ?? searchParams.get("assistantId");

  const { data: agents } = useQuery({
    queryKey: ["agents", selectedCompanyId],
    queryFn: () => (selectedCompanyId ? agentsApi.list(selectedCompanyId) : Promise.resolve([])),
    enabled: Boolean(selectedCompanyId),
  });

  const langgraphAgents = useMemo(() => {
    return (agents ?? []).filter((a) => a.adapterType === "langgraph");
  }, [agents]);

  const defaultAssistantId = useMemo(() => {
    if (urlAssistantId) return urlAssistantId;
    if (langgraphAgents.length > 0) {
      const firstConfig = langgraphAgents[0].adapterConfig as Record<string, unknown> | null;
      if (typeof firstConfig?.assistantId === "string" && firstConfig.assistantId.trim().length > 0) {
        return firstConfig.assistantId.trim();
      }
      return langgraphAgents[0].id;
    }
    return "";
  }, [urlAssistantId, langgraphAgents]);

  const [inputAssistantId, setInputAssistantId] = useState(defaultAssistantId);
  const [activeAssistantId, setActiveAssistantId] = useState(defaultAssistantId);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (defaultAssistantId && !activeAssistantId) {
      setInputAssistantId(defaultAssistantId);
      setActiveAssistantId(defaultAssistantId);
    }
  }, [defaultAssistantId, activeAssistantId]);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Canvas" },
      ...(activeAssistantId ? [{ label: activeAssistantId }] : []),
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, activeAssistantId]);

  const {
    data: topology,
    isLoading,
    isError,
    error,
    refetch,
  } = useGraphTopology(activeAssistantId || null, {
    enabled: Boolean(activeAssistantId),
  });

  const { nodes, edges } = useMemo(() => {
    if (!topology) return { nodes: [], edges: [] };
    return toReactFlow(topology);
  }, [topology]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId || !topology) return null;
    return topology.nodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [selectedNodeId, topology]);

  const nodeDetail = useMemo<NodeDetail | null>(() => {
    if (!selectedNode) return null;
    return getNodeDetail(selectedNode, topology?.edges ?? []);
  }, [selectedNode, topology]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputAssistantId.trim()) {
      setActiveAssistantId(inputAssistantId.trim());
      setSelectedNodeId(null);
      setSearchParams({ assistantId: inputAssistantId.trim() });
    }
  }, [inputAssistantId, setSearchParams]);

  const handleSelectAgent = useCallback((assistantId: string) => {
    setInputAssistantId(assistantId);
    setActiveAssistantId(assistantId);
    setSelectedNodeId(null);
    setSearchParams({ assistantId });
  }, [setSearchParams]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  return (
    <div className="flex flex-col h-full w-full min-h-0 bg-background text-foreground p-4 gap-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Workflow className="h-5 w-5 text-primary" />
            <span>Canvas</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Interactive LangGraph assistant topology and execution graph viewer
          </p>
        </div>

        {/* Assistant selector and actions */}
        <div className="flex flex-wrap items-center gap-2">
          {langgraphAgents.length > 0 ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Agents:</span>
              {langgraphAgents.map((agent) => {
                const config = agent.adapterConfig as Record<string, unknown> | null;
                const asstId = (typeof config?.assistantId === "string" && config.assistantId.trim())
                  ? config.assistantId.trim()
                  : agent.id;
                const isSelected = activeAssistantId === asstId;
                return (
                  <Button
                    key={agent.id}
                    variant={isSelected ? "secondary" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => handleSelectAgent(asstId)}
                  >
                    {agent.name}
                  </Button>
                );
              })}
            </div>
          ) : null}

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Assistant or graph ID..."
              value={inputAssistantId}
              onChange={(e) => setInputAssistantId(e.target.value)}
              className="h-8 text-xs w-48"
            />
            <Button type="submit" size="sm" variant="outline" className="h-8 text-xs">
              <Search className="h-3.5 w-3.5 mr-1" />
              Load
            </Button>
          </form>

          {activeAssistantId ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1", isLoading && "animate-spin")} />
              Refresh
            </Button>
          ) : null}
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="flex-1 w-full h-full min-h-0 relative border border-border rounded-lg bg-card/30 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <PaperclipLoading />
            <p className="text-sm text-muted-foreground">Loading topology for {activeAssistantId}...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="bg-destructive/10 p-4 rounded-full mb-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1">Failed to load graph topology</h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              {error instanceof Error ? error.message : "Unknown error occurred while decoding graph response."}
            </p>
            <Button onClick={() => refetch()} size="sm">
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Try Again
            </Button>
          </div>
        ) : !activeAssistantId ? (
          <EmptyState
            icon={Workflow}
            title="No assistant selected"
            message="Enter an assistant ID or select a LangGraph agent above to inspect its execution graph."
          />
        ) : nodes.length === 0 ? (
          <EmptyState
            icon={Workflow}
            title="Empty graph topology"
            message={`The assistant "${activeAssistantId}" does not contain any nodes in its graph.`}
            action="Refresh"
            onAction={() => refetch()}
          />
        ) : (
          <>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.2}
              maxZoom={2}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={true}
              onNodeClick={handleNodeClick}
              onPaneClick={handlePaneClick}
            >
              <Background color="var(--border)" gap={20} />
              <Controls className="border border-border bg-card text-foreground" showInteractive={false} />
              <MiniMap className="border border-border bg-card" zoomable pannable />
              <Panel position="top-left" className="bg-background/80 backdrop-blur-xs border border-border p-2 rounded-md shadow-xs text-xs text-muted-foreground">
                Graph: <span className="font-semibold text-foreground">{activeAssistantId}</span> • {nodes.length} nodes • {edges.length} edges
              </Panel>
            </ReactFlow>

            <NodePropertiesPanel
              nodeDetail={nodeDetail}
              onClose={() => setSelectedNodeId(null)}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default Canvas;
