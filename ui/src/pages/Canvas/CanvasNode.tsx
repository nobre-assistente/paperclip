import { memo } from "react";
import { Handle, Position, type NodeProps, type NodeTypes } from "@xyflow/react";
import { Cpu, GitFork, UserCheck, Play, Square } from "lucide-react";
import type { LangGraphNode } from "@/api/langgraph-topology";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface CanvasNodeData {
  label?: string;
  nodeType?: string;
  nodeData?: Record<string, unknown>;
  id?: string;
  type?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

function getNodeInfo(props: NodeProps): {
  id: string;
  type: string;
  data: Record<string, unknown>;
} {
  const rawData = (props.data ?? {}) as CanvasNodeData;
  const id = (rawData.id ?? rawData.label ?? props.id ?? "") as string;
  const type = (rawData.type ?? rawData.nodeType ?? "") as string;
  const data = (rawData.data ?? rawData.nodeData ?? {}) as Record<string, unknown>;
  return { id, type, data };
}

export function TerminalNode(props: NodeProps) {
  const { id, type } = getNodeInfo(props);
  const isStart = id === "__start__" || type === "start";

  return (
    <div
      data-testid={`canvas-node-${id}`}
      data-node-type="terminal"
      className={cn(
        "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wider shadow-xs transition-colors",
        isStart
          ? "bg-primary/10 border-primary/30 text-primary"
          : "bg-muted border-border text-muted-foreground",
      )}
    >
      {isStart ? (
        <Play className="h-3 w-3 fill-current" />
      ) : (
        <Square className="h-2.5 w-2.5 fill-current" />
      )}
      <span>{id}</span>
      <Handle
        type={isStart ? "source" : "target"}
        position={isStart ? Position.Bottom : Position.Top}
        className="w-2 h-2 border-none bg-muted-foreground"
      />
    </div>
  );
}

export function ExecutorNode(props: NodeProps) {
  const { id, type, data } = getNodeInfo(props);
  const paramCount = data && typeof data === "object" ? Object.keys(data).length : 0;

  return (
    <div
      data-testid={`canvas-node-${id}`}
      data-node-type="executor"
      className="min-w-44 rounded-lg border border-border bg-card p-3 shadow-xs transition-colors hover:border-primary/50"
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
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 border-none bg-muted-foreground"
      />
    </div>
  );
}

export function ConditionalNode(props: NodeProps) {
  const { id, type, data } = getNodeInfo(props);
  const paramCount = data && typeof data === "object" ? Object.keys(data).length : 0;

  return (
    <div
      data-testid={`canvas-node-${id}`}
      data-node-type="conditional"
      className="min-w-44 rounded-lg border border-primary/40 bg-card p-3 shadow-xs transition-colors hover:border-primary"
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
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 border-none bg-muted-foreground"
      />
    </div>
  );
}

export function InterruptNode(props: NodeProps) {
  const { id, type, data } = getNodeInfo(props);
  const paramCount = data && typeof data === "object" ? Object.keys(data).length : 0;

  return (
    <div
      data-testid={`canvas-node-${id}`}
      data-node-type="interrupt"
      className="min-w-44 rounded-lg border border-destructive/40 bg-card p-3 shadow-xs transition-colors hover:border-destructive/70"
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
  executor: ExecutorNode,
  conditional: ConditionalNode,
  interrupt: InterruptNode,
  terminal: TerminalNode,
  custom: CanvasNode,
};
