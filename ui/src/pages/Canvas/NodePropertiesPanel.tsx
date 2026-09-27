import { useState, useEffect, useMemo } from "react";
import {
  X,
  Cpu,
  GitFork,
  UserCheck,
  Play,
  Activity,
  Coins,
  Terminal,
  Settings2,
  Sliders,
  Clock,
  FileCode,
  Copy,
  Check,
  RefreshCw,
  FastForward,
  PauseCircle,
  Save,
  Layers,
} from "lucide-react";
import {
  SPECIALIST_MODEL_PRESETS,
  resolveSpecialistRole,
  getSpecialistContractFields,
  getSpecialistDefaultContract,
  type SpecialistRole,
} from "@paperclipai/shared";
import type {
  NodeDetail,
  CanvasNodeType,
  NodeTokensConsumed,
  NodeConfigParameters,
  NodeRuntimeControls,
  NodeExecutionRecord,
} from "./types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface NodePropertiesPanelProps {
  nodeDetail: NodeDetail | null;
  onClose: () => void;
  onUpdateParameters?: (nodeId: string, params: Partial<NodeConfigParameters>) => void;
  onUpdateControls?: (nodeId: string, controls: Partial<NodeRuntimeControls>) => void;
  onExecuteIsolatedNode?: (nodeId: string) => Promise<void> | void;
  isExecutingNode?: boolean;
  executionResult?: NodeExecutionRecord | null;
  onSaveNode?: (nodeId: string) => Promise<void> | void;
  isSavingNode?: boolean;
}

function getNodeTypeBadge(type: CanvasNodeType) {
  switch (type) {
    case "terminal":
      return (
        <Badge variant="outline" className="text-xs uppercase font-mono tracking-wider py-0 px-1.5 flex items-center gap-1">
          <Play className="h-2.5 w-2.5" />
          terminal
        </Badge>
      );
    case "conditional":
      return (
        <Badge variant="secondary" className="text-xs uppercase font-mono tracking-wider py-0 px-1.5 border-primary/20 flex items-center gap-1">
          <GitFork className="h-2.5 w-2.5 text-primary" />
          conditional
        </Badge>
      );
    case "interrupt":
      return (
        <Badge variant="destructive" className="text-xs uppercase font-mono tracking-wider py-0 px-1.5 flex items-center gap-1">
          <UserCheck className="h-2.5 w-2.5" />
          interrupt
        </Badge>
      );
    case "executor":
    default:
      return (
        <Badge variant="outline" className="text-xs uppercase font-mono tracking-wider py-0 px-1.5 flex items-center gap-1">
          <Cpu className="h-2.5 w-2.5 text-primary" />
          executor
        </Badge>
      );
  }
}

function getNodeStateBadge(state: string) {
  const s = state.toLowerCase();
  if (s.includes("run") || s.includes("active") || s.includes("progress")) {
    return (
      <Badge variant="default" className="text-xs uppercase font-mono tracking-wider py-0 px-1.5 bg-emerald-600 hover:bg-emerald-600 flex items-center gap-1">
        <Activity className="h-2.5 w-2.5 animate-pulse" />
        {state}
      </Badge>
    );
  }
  if (s.includes("wait") || s.includes("human") || s.includes("escalat") || s.includes("pause") || s.includes("interrupt")) {
    return (
      <Badge variant="destructive" className="text-xs uppercase font-mono tracking-wider py-0 px-1.5 flex items-center gap-1">
        <UserCheck className="h-2.5 w-2.5" />
        {state}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs uppercase font-mono tracking-wider py-0 px-1.5 flex items-center gap-1">
      <Activity className="h-2.5 w-2.5 text-muted-foreground" />
      {state}
    </Badge>
  );
}

export function NodePropertiesPanel({
  nodeDetail,
  onClose,
  onUpdateParameters,
  onUpdateControls,
  onExecuteIsolatedNode,
  isExecutingNode = false,
  executionResult,
  onSaveNode,
  isSavingNode = false,
}: NodePropertiesPanelProps) {
  if (!nodeDetail) {
    return null;
  }

  // Active tab state
  const [activeTab, setActiveTab] = useState<string>("parameters");

  // Local parameters form state
  const [localParams, setLocalParams] = useState<NodeConfigParameters>(() => {
    const resolvedRole = resolveSpecialistRole(nodeDetail.id);
    return {
      assistantId: nodeDetail.parameters?.assistantId ?? nodeDetail.id,
      model: nodeDetail.parameters?.model ?? "google-antigravity/gemini-3.8-flash",
      temperature: nodeDetail.parameters?.temperature ?? 0.7,
      systemPrompt: nodeDetail.parameters?.systemPrompt ?? "",
      timeoutMs: nodeDetail.parameters?.timeoutMs ?? 30000,
      specialistRole: nodeDetail.parameters?.specialistRole ?? resolvedRole,
      specialistContract: nodeDetail.parameters?.specialistContract ?? (resolvedRole ? getSpecialistDefaultContract(resolvedRole) : {}),
    };
  });

  // Local controls state
  const [localControls, setLocalControls] = useState<NodeRuntimeControls>(() => {
    return {
      bypass: Boolean(nodeDetail.controls?.bypass),
      forceHitl: Boolean(nodeDetail.controls?.forceHitl || nodeDetail.type === "interrupt"),
      mockOutput: nodeDetail.controls?.mockOutput ?? "",
    };
  });

  const [copiedArtifact, setCopiedArtifact] = useState<string | null>(null);
  const [appliedNotice, setAppliedNotice] = useState<boolean>(false);

  // Sync state when selected node changes
  useEffect(() => {
    const resolvedRole = resolveSpecialistRole(nodeDetail.id);
    setLocalParams({
      assistantId: nodeDetail.parameters?.assistantId ?? nodeDetail.id,
      model: nodeDetail.parameters?.model ?? "google-antigravity/gemini-3.8-flash",
      temperature: nodeDetail.parameters?.temperature ?? 0.7,
      systemPrompt: nodeDetail.parameters?.systemPrompt ?? "",
      timeoutMs: nodeDetail.parameters?.timeoutMs ?? 30000,
      specialistRole: nodeDetail.parameters?.specialistRole ?? resolvedRole,
      specialistContract: nodeDetail.parameters?.specialistContract ?? (resolvedRole ? getSpecialistDefaultContract(resolvedRole) : {}),
    });
    setLocalControls({
      bypass: Boolean(nodeDetail.controls?.bypass),
      forceHitl: Boolean(nodeDetail.controls?.forceHitl || nodeDetail.type === "interrupt"),
      mockOutput: nodeDetail.controls?.mockOutput ?? "",
    });
    setAppliedNotice(false);
  }, [nodeDetail.id, nodeDetail.parameters, nodeDetail.controls, nodeDetail.type]);

  // Specialist contract fields
  const resolvedRole = useMemo<SpecialistRole | undefined>(() => {
    return resolveSpecialistRole(localParams.specialistRole || nodeDetail.id);
  }, [localParams.specialistRole, nodeDetail.id]);

  const contractFields = useMemo(() => {
    if (!resolvedRole) return [];
    return getSpecialistContractFields(resolvedRole);
  }, [resolvedRole]);

  // Handle parameter field updates
  const handleParamChange = (field: keyof NodeConfigParameters, value: unknown) => {
    setLocalParams((prev) => {
      const next = { ...prev, [field]: value };
      onUpdateParameters?.(nodeDetail.id, next);
      return next;
    });
  };

  const handleContractFieldChange = (key: string, value: unknown) => {
    setLocalParams((prev) => {
      const nextContract = { ...(prev.specialistContract || {}), [key]: value };
      const next = { ...prev, specialistContract: nextContract };
      onUpdateParameters?.(nodeDetail.id, next);
      return next;
    });
  };

  // Handle control updates
  const handleControlChange = (patch: Partial<NodeRuntimeControls>) => {
    setLocalControls((prev) => {
      const next = { ...prev, ...patch };
      onUpdateControls?.(nodeDetail.id, next);
      return next;
    });
  };

  const handleApplyParams = () => {
    onUpdateParameters?.(nodeDetail.id, localParams);
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 2000);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedArtifact(id);
    setTimeout(() => setCopiedArtifact(null), 2000);
  };

  // Tokens & logs extraction
  const tokens = typeof nodeDetail.tokensConsumed === "object" && nodeDetail.tokensConsumed !== null
    ? (nodeDetail.tokensConsumed as NodeTokensConsumed)
    : typeof nodeDetail.tokensConsumed === "number" || typeof nodeDetail.tokensConsumed === "string"
      ? { total: Number(nodeDetail.tokensConsumed) || 0 }
      : executionResult?.tokensConsumed ?? null;

  const logs = Array.isArray(nodeDetail.executionLogs)
    ? nodeDetail.executionLogs
    : typeof nodeDetail.executionLogs === "string"
      ? nodeDetail.executionLogs.split("\n").filter(Boolean)
      : executionResult?.logs ?? [];

  const effectiveDuration = nodeDetail.durationMs ?? executionResult?.durationMs;

  const history = nodeDetail.history && nodeDetail.history.length > 0
    ? nodeDetail.history
    : executionResult
      ? [executionResult]
      : [];

  return (
    <aside
      data-testid="property-panel"
      aria-label="Node Properties"
      className="absolute top-3 right-3 bottom-3 w-96 z-20 flex flex-col rounded-lg border border-border bg-card/95 backdrop-blur-xs shadow-md p-4 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/10 text-primary shrink-0">
            <Sliders className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground truncate">Estúdio de Nó: {nodeDetail.id}</h2>
            <p className="text-xs text-muted-foreground truncate">
              {nodeDetail.agentName ? `Agente: ${nodeDetail.agentName}` : "Configuração & Operação LangGraph"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={onClose}
          aria-label="Close properties panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Selected Node Overview Bar */}
      <div className="py-2.5 border-b border-border flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {getNodeTypeBadge(nodeDetail.type)}
          {nodeDetail.state && getNodeStateBadge(nodeDetail.state)}
          {localControls.bypass && (
            <Badge variant="outline" className="text-xs uppercase font-mono tracking-wider py-0 px-1 border-amber-500/50 bg-amber-500/10 text-amber-500 font-semibold">
              Bypass
            </Badge>
          )}
          {localControls.forceHitl && (
            <Badge variant="destructive" className="text-xs uppercase font-mono tracking-wider py-0 px-1 font-semibold">
              HITL
            </Badge>
          )}
        </div>
        {nodeDetail.agentId && (
          <Badge variant="secondary" className="text-xs font-mono py-0 px-1.5 shrink-0" title={`Linked Agent ID: ${nodeDetail.agentId}`}>
            DB Sync
          </Badge>
        )}
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 pt-2">
        <TabsList className="grid grid-cols-3 w-full shrink-0">
          <TabsTrigger value="parameters" onClick={() => setActiveTab("parameters")} className="text-xs font-medium">
            Parâmetros
          </TabsTrigger>
          <TabsTrigger value="controls" onClick={() => setActiveTab("controls")} className="text-xs font-medium">
            Controles
          </TabsTrigger>
          <TabsTrigger value="telemetry" onClick={() => setActiveTab("telemetry")} className="text-xs font-medium">
            Telemetria
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------------------- */}
        {/* ABA 1: PARÂMETROS                                             */}
        {/* ------------------------------------------------------------- */}
        <TabsContent value="parameters" className="flex-1 overflow-y-auto space-y-3.5 pr-1 min-h-0 mt-3">
          {/* Assistant / Subgraph ID */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Assistant ID / Subgrafo LangGraph
            </label>
            <Input
              value={localParams.assistantId}
              onChange={(e) => handleParamChange("assistantId", e.target.value)}
              placeholder="e.g. fenix-solution_architect"
              className="h-8 text-xs font-mono"
            />
          </div>

          {/* LLM Model */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center justify-between">
              <span>Modelo de LLM</span>
              <span className="text-xs text-primary font-mono">Antigravity / OMP</span>
            </label>
            <select
              value={localParams.model}
              onChange={(e) => handleParamChange("model", e.target.value)}
              className="w-full rounded-md border border-border px-2 py-1.5 bg-background text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {SPECIALIST_MODEL_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
              <option value="custom">Outro Modelo Personalizado...</option>
            </select>
            {localParams.model === "custom" && (
              <Input
                placeholder="Insira o identificador do modelo (ex: anthropic/claude-3-5-sonnet)..."
                onChange={(e) => handleParamChange("model", e.target.value)}
                className="h-8 text-xs font-mono mt-1.5"
              />
            )}
          </div>

          {/* Temperature & Timeout */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center justify-between">
                <span>Temperatura</span>
                <span className="text-xs font-mono text-foreground font-bold">{localParams.temperature}</span>
              </label>
              <Input
                type="number"
                min={0}
                max={2}
                step={0.05}
                value={localParams.temperature}
                onChange={(e) => handleParamChange("temperature", Number.parseFloat(e.target.value) || 0)}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Timeout (ms)
              </label>
              <Input
                type="number"
                step={1000}
                value={localParams.timeoutMs}
                onChange={(e) => handleParamChange("timeoutMs", Number.parseInt(e.target.value, 10) || 30000)}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          {/* Custom System Prompt */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Custom System Prompt do Nó
            </label>
            <Textarea
              rows={3}
              value={localParams.systemPrompt}
              onChange={(e) => handleParamChange("systemPrompt", e.target.value)}
              placeholder="Instruções e diretrizes de execução específicas para este nó..."
              className="text-xs font-mono resize-y min-h-20"
            />
          </div>

          {/* Role Contract Specific Parameters */}
          {resolvedRole && contractFields.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  Contrato do Cargo: {resolvedRole}
                </span>
                <Badge variant="outline" className="text-xs font-mono">
                  {contractFields.length} campos
                </Badge>
              </div>

              <div className="space-y-2 rounded-md border border-border bg-muted/20 p-2.5">
                {contractFields.map((field) => {
                  const currentValue = localParams.specialistContract[field.key] ?? field.defaultValue;

                  return (
                    <div key={field.key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-foreground truncate" title={field.description}>
                          {field.label}
                        </label>
                        {field.description && (
                          <span className="text-xs text-muted-foreground font-mono" title={field.description}>
                            ?
                          </span>
                        )}
                      </div>

                      {field.type === "boolean" ? (
                        <div className="flex items-center justify-between py-1">
                          <span className="text-xs text-muted-foreground">Habilitar {field.label}</span>
                          <ToggleSwitch
                            checked={Boolean(currentValue)}
                            onCheckedChange={(val) => handleContractFieldChange(field.key, val)}
                          />
                        </div>
                      ) : field.type === "select" && field.options ? (
                        <select
                          value={String(currentValue ?? "")}
                          onChange={(e) => handleContractFieldChange(field.key, e.target.value)}
                          className="w-full rounded-md border border-border px-2 py-1 bg-background text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {field.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "number" ? (
                        <Input
                          type="number"
                          value={currentValue !== undefined ? Number(currentValue) : ""}
                          onChange={(e) =>
                            handleContractFieldChange(field.key, Number.parseFloat(e.target.value) || 0)
                          }
                          className="h-7 text-xs font-mono"
                        />
                      ) : field.type === "string_list" ? (
                        <Input
                          value={Array.isArray(currentValue) ? currentValue.join(", ") : String(currentValue ?? "")}
                          onChange={(e) =>
                            handleContractFieldChange(
                              field.key,
                              e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                            )
                          }
                          placeholder="valores separados por vírgula"
                          className="h-7 text-xs font-mono"
                        />
                      ) : field.type === "textarea" ? (
                        <Textarea
                          rows={2}
                          value={String(currentValue ?? "")}
                          onChange={(e) => handleContractFieldChange(field.key, e.target.value)}
                          className="text-xs font-mono resize-y"
                        />
                      ) : (
                        <Input
                          value={String(currentValue ?? "")}
                          onChange={(e) => handleContractFieldChange(field.key, e.target.value)}
                          className="h-7 text-xs font-mono"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Footer for Parameters */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-border">
            <Button
              size="sm"
              variant="outline"
              className="text-xs flex-1"
              onClick={handleApplyParams}
            >
              {appliedNotice ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" /> : <Settings2 className="h-3.5 w-3.5 mr-1" />}
              {appliedNotice ? "Aplicado!" : "Aplicar Parâmetros"}
            </Button>
            {onSaveNode && (
              <Button
                size="sm"
                variant="default"
                className="text-xs flex-1"
                disabled={isSavingNode}
                onClick={() => onSaveNode(nodeDetail.id)}
              >
                <Save className={cn("h-3.5 w-3.5 mr-1", isSavingNode && "animate-spin")} />
                {isSavingNode ? "Salvando..." : "Salvar no Agente"}
              </Button>
            )}
          </div>
        </TabsContent>

        {/* ------------------------------------------------------------- */}
        {/* ABA 2: CONTROLES & AÇÕES                                      */}
        {/* ------------------------------------------------------------- */}
        <TabsContent value="controls" className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0 mt-3">
          {/* Action 1: Executar Nó Isolado */}
          <div className="rounded-md border border-border bg-card p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-foreground">Executar Nó Isolado</h3>
                <p className="text-xs text-muted-foreground">
                  Dispara execução de teste individual no LangGraph Server.
                </p>
              </div>
            </div>
            <Button
              variant="default"
              size="sm"
              className="w-full text-xs"
              disabled={isExecutingNode}
              onClick={() => onExecuteIsolatedNode?.(nodeDetail.id)}
            >
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isExecutingNode && "animate-spin")} />
              {isExecutingNode ? "Executando Teste Isolado..." : "Disparar Execução de Teste"}
            </Button>
          </div>

          {/* Action 2: Bypass / Mock */}
          <div className="rounded-md border border-border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FastForward className="h-4 w-4 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-foreground">Bypass / Mock</h3>
                  <p className="text-xs text-muted-foreground">
                    Pula ou simula a execução durante testes rápidos.
                  </p>
                </div>
              </div>
              <ToggleSwitch
                checked={localControls.bypass}
                onCheckedChange={(val) => handleControlChange({ bypass: val })}
              />
            </div>

            {localControls.bypass && (
              <div className="pt-2 border-t border-border/50 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Saída Mock Personalizada (JSON ou Texto)
                </label>
                <Textarea
                  rows={2}
                  value={localControls.mockOutput ?? ""}
                  onChange={(e) => handleControlChange({ mockOutput: e.target.value })}
                  placeholder='{"status": "mocked", "result": "ok"}'
                  className="text-xs font-mono resize-y"
                />
              </div>
            )}
          </div>

          {/* Action 3: Forçar Pausa (HITL) */}
          <div className="rounded-md border border-border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <PauseCircle className="h-4 w-4 text-destructive shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-foreground">Forçar Pausa (HITL)</h3>
                  <p className="text-xs text-muted-foreground">
                    Exige aprovação humana obrigatória na esteira antes de avançar.
                  </p>
                </div>
              </div>
              <ToggleSwitch
                checked={localControls.forceHitl}
                onCheckedChange={(val) => handleControlChange({ forceHitl: val })}
              />
            </div>
          </div>

          {/* Execution Result Feedback Card */}
          {executionResult && (
            <div className="rounded-md border border-border bg-muted/30 p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  Resultado da Execução
                </span>
                <Badge
                  variant={executionResult.status === "success" ? "default" : "secondary"}
                  className="text-xs uppercase font-mono"
                >
                  {executionResult.status}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-between font-mono">
                <span>Duração:</span>
                <span className="text-foreground font-semibold">{executionResult.durationMs} ms</span>
              </div>
              {executionResult.outputs !== undefined && (
                <div className="rounded bg-black/80 text-emerald-400 p-2 text-xs font-mono max-h-28 overflow-y-auto leading-tight select-all">
                  <pre className="whitespace-pre-wrap break-all">
                    {typeof executionResult.outputs === "object"
                      ? JSON.stringify(executionResult.outputs, null, 2)
                      : String(executionResult.outputs)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ------------------------------------------------------------- */}
        {/* ABA 3: TELEMETRIA & ARTEFATOS                                 */}
        {/* ------------------------------------------------------------- */}
        <TabsContent value="telemetry" className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0 mt-3">
          {/* Tokens Consumed Card */}
          <div className="rounded-md border border-border bg-muted/20 p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider">
                <Coins className="h-3.5 w-3.5 text-amber-500" />
                <span>Tokens Consumidos</span>
              </div>
              {effectiveDuration !== undefined && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                  <Clock className="h-3 w-3" />
                  <span>{effectiveDuration} ms</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="rounded bg-background/80 p-1 border border-border/50">
                <div className="text-xs text-muted-foreground uppercase">Prompt</div>
                <div className="text-xs font-mono font-bold text-foreground">{tokens?.prompt ?? "-"}</div>
              </div>
              <div className="rounded bg-background/80 p-1 border border-border/50">
                <div className="text-xs text-muted-foreground uppercase">Completion</div>
                <div className="text-xs font-mono font-bold text-foreground">{tokens?.completion ?? "-"}</div>
              </div>
              <div className="rounded bg-background/80 p-1 border border-border/50">
                <div className="text-xs text-muted-foreground uppercase">Total</div>
                <div className="text-xs font-mono font-bold text-primary">{tokens?.total ?? "-"}</div>
              </div>
            </div>
          </div>

          {/* Artifacts Inspection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileCode className="h-3.5 w-3.5 text-primary" />
                Artefatos de Entrada & Saída
              </span>
              {executionResult?.artifacts && (
                <Badge variant="outline" className="text-xs font-mono">
                  {executionResult.artifacts.length} artefatos
                </Badge>
              )}
            </div>

            {executionResult?.artifacts && executionResult.artifacts.length > 0 ? (
              <div className="space-y-2">
                {executionResult.artifacts.map((art, idx) => {
                  const contentStr =
                    typeof art.content === "object"
                      ? JSON.stringify(art.content, null, 2)
                      : String(art.content);

                  return (
                    <div key={`${art.name}-${idx}`} className="rounded-md border border-border bg-card p-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-medium text-foreground truncate">{art.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground font-mono">{art.size || art.type}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => handleCopy(contentStr, art.name)}
                            title="Copiar conteúdo"
                          >
                            {copiedArtifact === art.name ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                      <div className="rounded bg-black/80 text-emerald-400 p-2 text-xs font-mono max-h-24 overflow-y-auto leading-tight select-all">
                        <pre className="whitespace-pre-wrap break-all">{contentStr}</pre>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                Nenhum artefato registrado na última execução.
              </div>
            )}
          </div>

          {/* Execution Logs */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider">
              <Terminal className="h-3.5 w-3.5 text-primary" />
              <span>Logs de Execução ({logs.length})</span>
            </div>
            {logs.length > 0 ? (
              <div className="rounded-md border border-border bg-black/80 text-emerald-400 font-mono text-xs p-2 space-y-1 max-h-36 overflow-y-auto leading-tight select-all">
                {logs.map((logLine, idx) => (
                  <div key={idx} className="break-words">
                    <span className="text-muted-foreground select-none">&gt; </span>
                    {logLine}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border p-2 text-center text-xs text-muted-foreground">
                Nenhum log de execução disponível.
              </div>
            )}
          </div>

          {/* History of Previous Runs */}
          {history.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-border">
              <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Histórico de Execuções ({history.length})
              </div>
              <div className="space-y-1.5">
                {history.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between p-2 rounded-md border border-border bg-muted/20 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-mono font-medium text-foreground truncate">{rec.id}</div>
                      <div className="text-muted-foreground text-xs">{rec.timestamp}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-xs">{rec.durationMs}ms</span>
                      <Badge variant="outline" className="text-xs uppercase font-mono py-0 px-1">
                        {rec.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <div className="pt-2 border-t border-border shrink-0 flex items-center justify-between text-xs text-muted-foreground">
        <span>Estúdio Operacional LangGraph</span>
        <span className="font-mono">FEA-434 / WI-13-006</span>
      </div>
    </aside>
  );
}
