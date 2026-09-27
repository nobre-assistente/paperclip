import { X, Lock, Cpu, GitFork, UserCheck, Play, Square, Activity, Coins, Terminal } from "lucide-react";
import type { NodeDetail, CanvasNodeType, NodeTokensConsumed } from "./types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NodePropertiesPanelProps {
  nodeDetail: NodeDetail | null;
  onClose: () => void;
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
  if (s.includes("wait") || s.includes("human") || s.includes("escalat") || s.includes("pause")) {
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

export function NodePropertiesPanel({ nodeDetail, onClose }: NodePropertiesPanelProps) {
  if (!nodeDetail) {
    return null;
  }

  const tokens = typeof nodeDetail.tokensConsumed === "object" && nodeDetail.tokensConsumed !== null
    ? (nodeDetail.tokensConsumed as NodeTokensConsumed)
    : typeof nodeDetail.tokensConsumed === "number" || typeof nodeDetail.tokensConsumed === "string"
      ? { total: Number(nodeDetail.tokensConsumed) || 0 }
      : null;

  const logs = Array.isArray(nodeDetail.executionLogs)
    ? nodeDetail.executionLogs
    : typeof nodeDetail.executionLogs === "string"
      ? nodeDetail.executionLogs.split("\n").filter(Boolean)
      : [];

  return (
    <aside
      data-testid="property-panel"
      aria-label="Node Properties"
      className="absolute top-3 right-3 bottom-3 w-80 z-20 flex flex-col rounded-lg border border-border bg-card/95 backdrop-blur-xs shadow-md p-4 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center h-6 w-6 rounded-md bg-muted text-muted-foreground shrink-0">
            <Lock className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground truncate">Node Properties</h2>
            <p className="text-xs text-muted-foreground">Read-only graph inspection</p>
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

      {/* Selected Node Overview */}
      <div className="py-3 border-b border-border space-y-1.5 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Type</span>
          {getNodeTypeBadge(nodeDetail.type)}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Node ID</span>
          <span className="text-xs font-mono font-medium text-foreground truncate max-w-44" title={nodeDetail.id}>
            {nodeDetail.id}
          </span>
        </div>
        {nodeDetail.state && (
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">State</span>
            {getNodeStateBadge(nodeDetail.state)}
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto py-3 space-y-4 min-h-0">
        {/* Tokens Consumed Card */}
        {tokens && (
          <div className="rounded-md border border-border bg-muted/20 p-2.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider">
              <Coins className="h-3 w-3 text-amber-500" />
              <span>Tokens Consumed</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="rounded bg-background/80 p-1 border border-border/50">
                <div className="text-[10px] text-muted-foreground uppercase">Prompt</div>
                <div className="text-xs font-mono font-bold text-foreground">{tokens.prompt ?? "-"}</div>
              </div>
              <div className="rounded bg-background/80 p-1 border border-border/50">
                <div className="text-[10px] text-muted-foreground uppercase">Completion</div>
                <div className="text-xs font-mono font-bold text-foreground">{tokens.completion ?? "-"}</div>
              </div>
              <div className="rounded bg-background/80 p-1 border border-border/50">
                <div className="text-[10px] text-muted-foreground uppercase">Total</div>
                <div className="text-xs font-mono font-bold text-primary">{tokens.total ?? "-"}</div>
              </div>
            </div>
          </div>
        )}

        {/* Execution Logs */}
        {logs.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider">
              <Terminal className="h-3 w-3 text-primary" />
              <span>Execution Logs ({logs.length})</span>
            </div>
            <div className="rounded-md border border-border bg-black/80 text-emerald-400 font-mono text-[11px] p-2 space-y-1 max-h-36 overflow-y-auto leading-tight select-all">
              {logs.map((logLine, idx) => (
                <div key={idx} className="break-words">
                  <span className="text-muted-foreground select-none">&gt; </span>
                  {logLine}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fields List */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Fields & Parameters ({nodeDetail.fields.length})
          </div>

          {nodeDetail.fields.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No fields recorded for this node.</p>
          ) : (
            <div className="space-y-2">
              {nodeDetail.fields.map((field, idx) => (
                <div key={`${field.label}-${idx}`} className="rounded-md border border-border bg-muted/30 p-2 space-y-1">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {field.label}
                  </div>
                  <div className="text-xs font-mono text-foreground break-all whitespace-pre-wrap select-all">
                    {field.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-border shrink-0 flex items-center justify-between text-xs text-muted-foreground">
        <span>Read-only</span>
        <span className="font-mono">FEA-317 / WI-12-005</span>
      </div>
    </aside>
  );
}
