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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Workflow,
  RefreshCw,
  AlertCircle,
  Search,
  Save,
  CheckCircle2,
  Download,
  X,
} from "lucide-react";
import type { Agent } from "@paperclipai/shared";
import { useParams, useSearchParams } from "@/lib/router";
import { useCompany } from "@/context/CompanyContext";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { agentsApi } from "@/api/agents";
import {
  useGraphTopology,
  langgraphTopologyApi,
  type FlowHomologationResponse,
} from "@/api/langgraph-topology";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { PaperclipLoading } from "@/components/AnimatedPaperclipIcon";
import { cn } from "@/lib/utils";
import { nodeTypes } from "./CanvasNode";
import { toReactFlow, getNodeDetail, resolveCanvasNodeType } from "./toReactFlow";
import { NodePropertiesPanel } from "./NodePropertiesPanel";
import type {
  CanvasNodeType,
  NodeDetail,
  CanvasNodeData,
  NodeConfigParameters,
  NodeRuntimeControls,
  NodeExecutionRecord,
} from "./types";

export type { CanvasNodeType, NodeDetail, CanvasNodeData };
export { toReactFlow, getNodeDetail, resolveCanvasNodeType, nodeTypes };

function findMatchingAgent(nodeId: string, agents: Agent[]): Agent | undefined {
  const normalized = nodeId.toLowerCase().trim();
  return agents.find((agent) => {
    if (agent.id === nodeId) return true;
    const meta = (agent.metadata ?? {}) as Record<string, unknown>;
    const cfg = (agent.adapterConfig ?? {}) as Record<string, unknown>;
    if (typeof meta.slug === "string" && meta.slug.toLowerCase() === normalized) return true;
    if (
      typeof meta.cargoName === "string" &&
      meta.cargoName.toLowerCase().replace(/\s+/g, "_") === normalized
    ) {
      return true;
    }
    if (typeof cfg.assistantId === "string") {
      const cleanAsst = cfg.assistantId.toLowerCase().replace(/^fenix-/, "");
      if (cleanAsst === normalized || cfg.assistantId.toLowerCase() === normalized) return true;
    }
    if (agent.name.toLowerCase().includes(normalized.replace(/_/g, " "))) return true;
    if (agent.role.toLowerCase() === normalized) return true;
    return false;
  });
}

export function Canvas() {
  const queryClient = useQueryClient();
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
    if (urlAssistantId && urlAssistantId.trim().length > 0) return urlAssistantId.trim();
    // O macro-grafo consolidado é sempre "orchestrator"
    return "orchestrator";
  }, [urlAssistantId]);

  const [inputAssistantId, setInputAssistantId] = useState(defaultAssistantId);
  const [activeAssistantId, setActiveAssistantId] = useState(defaultAssistantId);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Real-time interactive node states
  const [nodeParameters, setNodeParameters] = useState<Record<string, NodeConfigParameters>>({});
  const [nodeControls, setNodeControls] = useState<Record<string, NodeRuntimeControls>>({});
  const [nodeHistory, setNodeHistory] = useState<Record<string, NodeExecutionRecord[]>>({});
  const [nodeExecutionResults, setNodeExecutionResults] = useState<Record<string, NodeExecutionRecord>>({});
  const [runningNodeIds, setRunningNodeIds] = useState<Set<string>>(new Set());

  // Operation states
  const [isSaving, setIsSaving] = useState(false);
  const [isHomologating, setIsHomologating] = useState(false);
  const [isExecutingNode, setIsExecutingNode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [homologationReport, setHomologationReport] = useState<FlowHomologationResponse | null>(null);

  useEffect(() => {
    if (defaultAssistantId && !activeAssistantId) {
      setActiveAssistantId(defaultAssistantId);
      setInputAssistantId(defaultAssistantId);
    }
  }, [defaultAssistantId, activeAssistantId]);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Dashboard", href: "/" },
      { label: "Canvas", href: "/canvas" },
      ...(activeAssistantId ? [{ label: activeAssistantId }] : []),
    ]);
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

  // Bidirectional sync: hydrate node parameters & controls from database agents when topology/agents load
  useEffect(() => {
    if (!topology?.nodes || !agents) return;

    setNodeParameters((prev) => {
      const next = { ...prev };
      for (const node of topology.nodes) {
        if (!next[node.id]) {
          const match = findMatchingAgent(node.id, agents);
          if (match) {
            const cfg = (match.adapterConfig ?? {}) as Record<string, unknown>;
            const meta = (match.metadata ?? {}) as Record<string, unknown>;
            const rc = (cfg.runtimeControls ?? meta.runtimeControls ?? {}) as Record<string, unknown>;

            next[node.id] = {
              assistantId: (cfg.assistantId as string | undefined) ?? node.id,
              model: (cfg.model as string | undefined) ?? (meta.model as string | undefined) ?? "google-antigravity/gemini-3.8-flash",
              temperature: typeof cfg.temperature === "number" ? cfg.temperature : typeof meta.temperature === "number" ? meta.temperature : 0.7,
              systemPrompt: (cfg.systemPrompt as string | undefined) ?? (meta.systemPrompt as string | undefined) ?? "",
              timeoutMs: typeof cfg.timeoutMs === "number" ? cfg.timeoutMs : typeof cfg.timeout_ms === "number" ? cfg.timeout_ms : 30000,
              specialistRole: (meta.slug as string | undefined) ?? (meta.cargoName as string | undefined) ?? node.id,
              specialistContract: (cfg.specialistContract as Record<string, unknown> | undefined) ?? (meta.specialistContract as Record<string, unknown> | undefined) ?? {},
            };

            if (Object.keys(rc).length > 0) {
              setNodeControls((ctrlPrev) => ({
                ...ctrlPrev,
                [node.id]: {
                  bypass: Boolean(rc.bypass),
                  forceHitl: Boolean(rc.forceHitl),
                  mockOutput: typeof rc.mockOutput === "string" ? rc.mockOutput : undefined,
                },
              }));
            }
          }
        }
      }
      return next;
    });
  }, [topology, agents]);

  const { nodes, edges } = useMemo(() => {
    if (!topology) return { nodes: [], edges: [] };
    return toReactFlow(topology, {
      controls: nodeControls,
      parameters: nodeParameters,
      runningNodeIds,
    });
  }, [topology, nodeControls, nodeParameters, runningNodeIds]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId || !topology) return null;
    return topology.nodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [selectedNodeId, topology]);

  const nodeDetail = useMemo<NodeDetail | null>(() => {
    if (!selectedNode || !topology) return null;
    const matchAgent = findMatchingAgent(selectedNode.id, agents ?? []);
    return getNodeDetail(selectedNode, topology.edges, {
      controls: nodeControls[selectedNode.id],
      parameters: nodeParameters[selectedNode.id],
      history: nodeHistory[selectedNode.id],
      agentId: matchAgent?.id,
      agentName: matchAgent?.name,
    });
  }, [selectedNode, topology, nodeControls, nodeParameters, nodeHistory, agents]);

  const handleSearchSubmit = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      const trimmed = inputAssistantId.trim();
      if (trimmed) {
        setActiveAssistantId(trimmed);
        setSelectedNodeId(null);
        setSearchParams({ assistantId: trimmed });
      }
    },
    [inputAssistantId, setSearchParams],
  );

  const handleSelectAgent = useCallback(
    (assistantId: string) => {
      setInputAssistantId(assistantId);
      setActiveAssistantId(assistantId);
      setSelectedNodeId(null);
      setSearchParams({ assistantId });
    },
    [setSearchParams],
  );

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Update parameters from properties panel
  const handleUpdateParameters = useCallback((nodeId: string, paramsPatch: Partial<NodeConfigParameters>) => {
    setNodeParameters((prev) => {
      const existing = prev[nodeId] || {
        assistantId: nodeId,
        model: "google-antigravity/gemini-3.8-flash",
        temperature: 0.7,
        systemPrompt: "",
        timeoutMs: 30000,
        specialistRole: nodeId,
        specialistContract: {},
      };
      return {
        ...prev,
        [nodeId]: {
          ...existing,
          ...paramsPatch,
        },
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  // Update controls from properties panel
  const handleUpdateControls = useCallback((nodeId: string, controlsPatch: Partial<NodeRuntimeControls>) => {
    setNodeControls((prev) => {
      const existing = prev[nodeId] || { bypass: false, forceHitl: false };
      return {
        ...prev,
        [nodeId]: {
          ...existing,
          ...controlsPatch,
        },
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  // Persist node edits to Paperclip backend
  const handleSaveParameters = useCallback(
    async (targetNodeId?: string) => {
      if (!selectedCompanyId) {
        setSaveError("Nenhuma empresa selecionada para persistir os parâmetros.");
        setTimeout(() => setSaveError(null), 3000);
        return;
      }

      setIsSaving(true);
      setSaveError(null);
      setSaveMessage(null);

      try {
        const nodesToSave = targetNodeId ? [targetNodeId] : Object.keys(nodeParameters);
        let updatedCount = 0;

        for (const nodeId of nodesToSave) {
          const params = nodeParameters[nodeId];
          if (!params) continue;
          const controls = nodeControls[nodeId];
          const matchAgent = findMatchingAgent(nodeId, agents ?? []);

          if (matchAgent) {
            const existingConfig = (matchAgent.adapterConfig ?? {}) as Record<string, unknown>;
            const existingMeta = (matchAgent.metadata ?? {}) as Record<string, unknown>;

            const patch = {
              adapterConfig: {
                ...existingConfig,
                assistantId: params.assistantId,
                model: params.model,
                temperature: params.temperature,
                systemPrompt: params.systemPrompt,
                timeoutMs: params.timeoutMs,
                specialistContract: params.specialistContract,
                runtimeControls: controls,
              },
              metadata: {
                ...existingMeta,
                model: params.model,
                temperature: params.temperature,
                systemPrompt: params.systemPrompt,
                specialistContract: params.specialistContract,
                runtimeControls: controls,
                lastCanvasSync: new Date().toISOString(),
              },
            };

            await agentsApi.update(matchAgent.id, patch, selectedCompanyId);
            updatedCount++;
          }
        }

        await queryClient.invalidateQueries({ queryKey: ["agents"] });
        setHasUnsavedChanges(false);
        setSaveMessage(
          updatedCount > 0
            ? `Parâmetros sincronizados com sucesso em ${updatedCount} agente(s) no backend.`
            : "Topologia e parâmetros locais salvos com sucesso.",
        );
        setTimeout(() => setSaveMessage(null), 3500);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setSaveError(`Falha ao sincronizar parâmetros no backend: ${msg}`);
        setTimeout(() => setSaveError(null), 4000);
      } finally {
        setIsSaving(false);
      }
    },
    [selectedCompanyId, nodeParameters, nodeControls, agents, queryClient],
  );

  // Isolated node execution
  const handleExecuteIsolatedNode = useCallback(
    async (nodeId: string) => {
      if (!activeAssistantId) return;
      setIsExecutingNode(true);
      setRunningNodeIds((prev) => new Set(prev).add(nodeId));

      const controls = nodeControls[nodeId];
      const params = nodeParameters[nodeId];

      try {
        const res = await langgraphTopologyApi.executeIsolatedNode(activeAssistantId, nodeId, {
          bypass: controls?.bypass,
          forceHitl: controls?.forceHitl,
          mockOutput: controls?.mockOutput,
          config: params,
        });

        const execRecord: NodeExecutionRecord = {
          id: res.id,
          nodeId: res.nodeId,
          timestamp: res.timestamp,
          status: res.status,
          durationMs: res.durationMs,
          tokensConsumed: res.tokensConsumed,
          inputs: res.inputs,
          outputs: res.outputs,
          artifacts: res.artifacts,
          logs: res.logs,
        };

        setNodeExecutionResults((prev) => ({ ...prev, [nodeId]: execRecord }));
        setNodeHistory((prev) => ({
          ...prev,
          [nodeId]: [execRecord, ...(prev[nodeId] || [])].slice(0, 10),
        }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setSaveError(`Erro ao executar teste isolado do nó: ${msg}`);
        setTimeout(() => setSaveError(null), 4000);
      } finally {
        setRunningNodeIds((prev) => {
          const next = new Set(prev);
          next.delete(nodeId);
          return next;
        });
        setIsExecutingNode(false);
      }
    },
    [activeAssistantId, nodeControls, nodeParameters],
  );

  // Homologate pipeline flow
  const handleHomologateFlow = useCallback(async () => {
    if (!activeAssistantId) return;
    setIsHomologating(true);
    setHomologationReport(null);
    setSaveError(null);

    try {
      const report = await langgraphTopologyApi.homologateFlow(activeAssistantId, {
        topology,
        nodeParameters,
        nodeControls,
      });
      setHomologationReport(report);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveError(`Falha ao homologar fluxo no LangGraph: ${msg}`);
      setTimeout(() => setSaveError(null), 4000);
    } finally {
      setIsHomologating(false);
    }
  }, [activeAssistantId, topology, nodeParameters, nodeControls]);

  // Export topology as downloadable JSON
  const handleExportTopology = useCallback(() => {
    if (!topology) return;
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      assistantId: activeAssistantId,
      topology: {
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          data: n.data,
        })),
        edges,
      },
      nodeParameters,
      nodeControls,
      summary: {
        nodesCount: nodes.length,
        edgesCount: edges.length,
        timestamp: new Date().toISOString(),
      },
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `langgraph-topology-${activeAssistantId || "export"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [topology, activeAssistantId, nodes, edges, nodeParameters, nodeControls]);

  return (
    <div className="flex flex-col h-full w-full min-h-0 bg-background text-foreground p-4 gap-3">
      {/* Top Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Workflow className="h-5 w-5 text-primary" />
            <span>Canvas Low-Code Operante</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Edição de nós, controles em tempo real e persistência bidirecional no LangGraph
          </p>
        </div>

        {/* Toolbar Operational Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botão Salvar Parâmetros / Topologia */}
          <Button
            size="sm"
            variant={hasUnsavedChanges ? "default" : "outline"}
            className="h-8 text-xs font-medium"
            onClick={() => handleSaveParameters()}
            disabled={isSaving || !activeAssistantId}
            title="Persiste as edições no backend do Paperclip (tabela agents / adapter_config)"
          >
            <Save className={cn("h-3.5 w-3.5 mr-1.5", isSaving && "animate-spin")} />
            {isSaving ? "Salvando..." : "Salvar Parâmetros / Topologia"}
            {hasUnsavedChanges && (
              <span className="ml-1.5 h-2 w-2 rounded-full bg-amber-400 animate-pulse inline-block" />
            )}
          </Button>

          {/* Botão Homologar Fluxo */}
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs font-medium border-primary/30 hover:border-primary"
            onClick={handleHomologateFlow}
            disabled={isHomologating || !activeAssistantId}
            title="Dispara um run de teste no LangGraph local para validar a esteira completa"
          >
            <CheckCircle2 className={cn("h-3.5 w-3.5 mr-1.5 text-primary", isHomologating && "animate-spin")} />
            {isHomologating ? "Homologando Fluxo..." : "Homologar Fluxo"}
          </Button>

          {/* Botão Exportar Topologia */}
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs font-medium"
            onClick={handleExportTopology}
            disabled={!topology}
            title="Permite baixar a definição em JSON do grafo para auditoria"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Exportar Topologia
          </Button>

          <div className="h-4 w-px bg-border my-auto mx-1" />

          {/* Assistant selector and search */}
          {langgraphAgents.length > 0 ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Agentes:</span>
              {langgraphAgents.map((agent) => {
                const config = agent.adapterConfig as Record<string, unknown> | null;
                const asstId =
                  typeof config?.assistantId === "string" && config.assistantId.trim()
                    ? config.assistantId.trim()
                    : agent.id;
                const isSelected = activeAssistantId === asstId;
                return (
                  <Button
                    key={agent.id}
                    variant={isSelected ? "secondary" : "outline"}
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => {
                      // Ao clicar no agente, seleciona e foca seu nó no Canvas
                      const meta = (agent.metadata ?? {}) as Record<string, unknown>;
                      const cfg = (agent.adapterConfig ?? {}) as Record<string, unknown>;
                      const targetNode =
                        (typeof meta.cargoName === "string" && meta.cargoName) ||
                        (typeof cfg.assistantId === "string" && cfg.assistantId) ||
                        agent.name.toLowerCase().replace(/fênix\s*—\s*/i, "").replace(/\s+/g, "_");
                      setSelectedNodeId(targetNode);
                      if (activeAssistantId !== "orchestrator") {
                        handleSelectAgent("orchestrator");
                      }
                    }}
                  >
                    {agent.name}
                  </Button>
                );
              })}
            </div>
          ) : null}

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
            <Input
              type="text"
              placeholder="Assistant or graph ID..."
              value={inputAssistantId}
              onChange={(e) => setInputAssistantId(e.target.value)}
              className="h-8 text-xs w-44 font-mono"
            />
            <Button type="submit" size="sm" variant="outline" className="h-8 text-xs">
              <Search className="h-3.5 w-3.5 mr-1" />
              Carregar
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
              Atualizar
            </Button>
          ) : null}
        </div>
      </div>

      {/* Operational Feedback Banners */}
      {saveMessage && (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2.5 text-xs flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{saveMessage}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-emerald-600 dark:text-emerald-400"
            onClick={() => setSaveMessage(null)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {saveError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 text-destructive p-2.5 text-xs flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{saveError}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-destructive"
            onClick={() => setSaveError(null)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Homologation Report Card */}
      {homologationReport && (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 flex items-start justify-between gap-3 text-xs shrink-0">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-foreground flex-wrap">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Homologação Concluída com Sucesso: {homologationReport.assistantId}</span>
              <Badge variant="outline" className="text-xs font-mono">
                {homologationReport.durationMs} ms
              </Badge>
              <Badge variant="secondary" className="text-xs font-mono">
                {homologationReport.nodesCount} nós • {homologationReport.edgesCount} conexões
              </Badge>
            </div>
            <p className="text-muted-foreground">{homologationReport.summary}</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {homologationReport.validationResults.map((v, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="text-xs border-primary/20 bg-background/80 flex items-center gap-1"
                >
                  <span className="text-emerald-500 font-bold">✔</span>
                  <span>{v.phase}</span>
                </Badge>
              ))}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => setHomologationReport(null)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Main Canvas Viewport */}
      <div className="flex-1 w-full h-full min-h-0 relative border border-border rounded-lg bg-card/30 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <PaperclipLoading />
            <p className="text-sm text-muted-foreground">Carregando topologia para {activeAssistantId}...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="bg-destructive/10 p-4 rounded-full mb-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1">Falha ao carregar topologia do grafo</h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              {error instanceof Error ? error.message : "Erro desconhecido ao decodificar resposta do grafo."}
            </p>
            <Button onClick={() => refetch()} size="sm">
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Tentar Novamente
            </Button>
          </div>
        ) : !activeAssistantId ? (
          <EmptyState
            icon={Workflow}
            title="Nenhum assistente selecionado"
            message="Insira um ID de assistente ou selecione um especialista LangGraph acima para inspecionar e operar o grafo."
          />
        ) : nodes.length === 0 ? (
          <EmptyState
            icon={Workflow}
            title="Topologia vazia"
            message={`O assistente "${activeAssistantId}" não contém nenhum nó no seu grafo de execução.`}
            action="Atualizar"
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
              <Panel
                position="top-left"
                className="bg-background/80 backdrop-blur-xs border border-border p-2 rounded-md shadow-xs text-xs text-muted-foreground"
              >
                Grafo: <span className="font-semibold text-foreground">{activeAssistantId}</span> • {nodes.length} nós • {edges.length} conexões
              </Panel>
            </ReactFlow>

            <NodePropertiesPanel
              nodeDetail={nodeDetail}
              onClose={() => setSelectedNodeId(null)}
              onUpdateParameters={handleUpdateParameters}
              onUpdateControls={handleUpdateControls}
              onExecuteIsolatedNode={handleExecuteIsolatedNode}
              isExecutingNode={isExecutingNode}
              executionResult={selectedNodeId ? nodeExecutionResults[selectedNodeId] : null}
              onSaveNode={(id) => handleSaveParameters(id)}
              isSavingNode={isSaving}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default Canvas;
