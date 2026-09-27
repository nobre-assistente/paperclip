import { memo } from "react";
import { Handle, Position, type NodeProps, type NodeTypes } from "@xyflow/react";
import { Cpu, GitFork, UserCheck, Play, Square, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NodeRuntimeControls } from "./types";

export interface CanvasNodeData {
  label?: string;
  nodeType?: string;
  nodeData?: Record<string, unknown>;
  id?: string;
  type?: string;
  data?: Record<string, unknown>;
  controls?: NodeRuntimeControls;
  isRunning?: boolean;
  [key: string]: unknown;
}

function getNodeInfo(props: NodeProps): {
  id: string;
  type: string;
  data: Record<string, unknown>;
  controls?: NodeRuntimeControls;
  isRunning?: boolean;
} {
  const rawData = (props.data ?? {}) as CanvasNodeData;
  const id = (rawData.id ?? rawData.label ?? props.id ?? "") as string;
  const type = (rawData.type ?? rawData.nodeType ?? "") as string;
  const data = (rawData.data ?? rawData.nodeData ?? {}) as Record<string, unknown>;
  const controls = rawData.controls;
  const isRunning = Boolean(rawData.isRunning);
  return { id, type, data, controls, isRunning };
}

function renderControlBadges(controls?: NodeRuntimeControls, isRunning?: boolean) {
  const hasBadges = Boolean(isRunning || controls?.bypass || controls?.forceHitl);
  if (!hasBadges) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1.5 pt-1.5 border-t border-border/50">
      {isRunning ? (
        <Badge
          variant="default"
          className="text-xs uppercase font-mono tracking-wider py-0 px-1 bg-emerald-600 hover:bg-emerald-600 text-white flex items-center gap-1 animate-pulse"
        >
          <Activity className="h-2.5 w-2.5" />
          Running
        </Badge>
      ) : null}
      {controls?.bypass ? (
        <Badge
          variant="outline"
          className="text-xs uppercase font-mono tracking-wider py-0 px-1 border-amber-500/50 bg-amber-500/10 text-amber-500 font-semibold"
        >
          Bypass / Mock
        </Badge>
      ) : null}
      {controls?.forceHitl ? (
        <Badge
          variant="destructive"
          className="text-xs uppercase font-mono tracking-wider py-0 px-1 font-semibold"
        >
          HITL Forced
        </Badge>
      ) : null}
    </div>
  );
}

export function TerminalNode(props: NodeProps) {
  const { id, type } = getNodeInfo(props);
  const isStart = id === "__start__" || type === "start";

  return (
    <div
      data-testid={`canvas-node-${id}`}
      data-node-type="terminal"
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-xs text-xs font-mono font-medium tracking-wide uppercase transition-colors",
        isStart
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:border-emerald-500"
          : "border-muted-foreground/30 bg-muted/30 text-muted-foreground hover:border-muted-foreground",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 border-none bg-muted-foreground"
      />
      {isStart ? (
        <Play className="h-3 w-3 fill-current" />
      ) : (
        <Square className="h-2.5 w-2.5 fill-current" />
      )}
      <span>{id}</span>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 border-none bg-muted-foreground"
      />
    </div>
  );
}

export function ExecutorNode(props: NodeProps) {
  const { id, type, data, controls, isRunning } = getNodeInfo(props);
  const paramCount = data && typeof data === "object" ? Object.keys(data).length : 0;

  return (
    <div
      data-testid={`canvas-node-${id}`}
      data-node-type="executor"
      className={cn(
        "min-w-44 rounded-lg border bg-card p-3 shadow-xs transition-colors hover:border-primary/50",
        controls?.bypass ? "border-dashed border-amber-500/60" : "border-border",
        controls?.forceHitl && "ring-1 ring-destructive/40",
        isRunning && "border-emerald-500 ring-2 ring-emerald-500/50",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 border-none bg-muted-foreground"
      />
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Cpu className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-sm font-medium text-card-foreground truncate">{id}</span>
        </div>
        <Badge variant="outline" className="text-xs uppercase tracking-wider py-0 px-1 font-mono shrink-0">
          {type || "executor"}
        </Badge>
      </div>
      {paramCount > 0 ? (
        <div className="text-xs text-muted-foreground truncate">
          {paramCount} parameter(s)
        </div>
      ) : null}
      {renderControlBadges(controls, isRunning)}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 border-none bg-muted-foreground"
      />
    </div>
  );
}

export function ConditionalNode(props: NodeProps) {
  const { id, type, data, controls, isRunning } = getNodeInfo(props);
  const paramCount = data && typeof data === "object" ? Object.keys(data).length : 0;

  return (
    <div
      data-testid={`canvas-node-${id}`}
      data-node-type="conditional"
      className={cn(
        "min-w-44 rounded-lg border bg-card p-3 shadow-xs transition-colors hover:border-primary",
        controls?.bypass ? "border-dashed border-amber-500/60" : "border-primary/40",
        controls?.forceHitl && "ring-1 ring-destructive/40",
        isRunning && "border-emerald-500 ring-2 ring-emerald-500/50",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 border-none bg-muted-foreground"
      />
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <GitFork className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-sm font-medium text-card-foreground truncate">{id}</span>
        </div>
        <Badge variant="secondary" className="text-xs uppercase tracking-wider py-0 px-1 font-mono border-primary/20 shrink-0">
          {type || "conditional"}
        </Badge>
      </div>
      <div className="text-xs text-muted-foreground truncate">
        {paramCount > 0 ? `${paramCount} condition branch(es)` : "Branch router"}
      </div>
      {renderControlBadges(controls, isRunning)}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 border-none bg-muted-foreground"
      />
    </div>
  );
}

export function InterruptNode(props: NodeProps) {
  const { id, type, data, controls, isRunning } = getNodeInfo(props);
  const paramCount = data && typeof data === "object" ? Object.keys(data).length : 0;

  return (
    <div
      data-testid={`canvas-node-${id}`}
      data-node-type="interrupt"
      className={cn(
        "min-w-44 rounded-lg border bg-card p-3 shadow-xs transition-colors hover:border-destructive/70",
        controls?.bypass ? "border-dashed border-amber-500/60" : "border-destructive/40",
        controls?.forceHitl && "ring-1 ring-destructive/60",
        isRunning && "border-emerald-500 ring-2 ring-emerald-500/50",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 border-none bg-muted-foreground"
      />
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <UserCheck className="h-3.5 w-3.5 text-destructive shrink-0" />
          <span className="text-sm font-medium text-card-foreground truncate">{id}</span>
        </div>
        <Badge variant="destructive" className="text-xs uppercase tracking-wider py-0 px-1 font-mono shrink-0">
          {type || "interrupt"}
        </Badge>
      </div>
      <div className="text-xs text-destructive/80 truncate">
        {paramCount > 0 ? "Human approval / input" : "Human breakpoint"}
      </div>
      {renderControlBadges(controls, isRunning)}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 border-none bg-muted-foreground"
      />
    </div>
  );
}

function CanvasNodeComponent(props: NodeProps) {
  const nodeType = props.type;
  if (nodeType === "terminal") return <TerminalNode {...props} />;
  if (nodeType === "conditional") return <ConditionalNode {...props} />;
  if (nodeType === "interrupt") return <InterruptNode {...props} />;
  return <ExecutorNode {...props} />;
}

export const CanvasNode = memo(CanvasNodeComponent);

export const nodeTypes: NodeTypes = {
  terminal: TerminalNode,
  conditional: ConditionalNode,
  interrupt: InterruptNode,
  executor: ExecutorNode,
  node: ExecutorNode,
};
