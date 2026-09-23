import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface CanvasNodeData {
  label: string;
  nodeType: string;
  nodeData: Record<string, unknown>;
  [key: string]: unknown;
}

function CanvasNodeComponent({ data }: NodeProps) {
  const nodeData = (data ?? {}) as CanvasNodeData;
  const { label, nodeType } = nodeData;
  const isStart = label === "__start__" || nodeType === "start";
  const isEnd = label === "__end__" || nodeType === "end";

  if (isStart || isEnd) {
    return (
      <div
        className={cn(
          "px-4 py-2 rounded-full border text-xs font-semibold uppercase tracking-wider shadow-xs transition-colors",
          isStart
            ? "bg-primary/10 border-primary/30 text-primary"
            : "bg-muted border-border text-muted-foreground",
        )}
      >
        <Handle
          type={isStart ? "source" : "target"}
          position={isStart ? Position.Bottom : Position.Top}
          className="w-2 h-2 border-none bg-muted-foreground"
        />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div className="min-w-44 rounded-lg border border-border bg-card p-3 shadow-xs transition-colors hover:border-primary/50">
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 border-none bg-muted-foreground"
      />
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-sm font-medium text-card-foreground truncate">{label}</span>
        {nodeType ? (
          <Badge variant="outline" className="text-xs uppercase tracking-wider py-0 px-1">
            {nodeType}
          </Badge>
        ) : null}
      </div>
      {nodeData.nodeData && Object.keys(nodeData.nodeData).length > 0 ? (
        <div className="text-xs text-muted-foreground truncate max-w-48">
          {Object.keys(nodeData.nodeData).length} parameter(s)
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

export const CanvasNode = memo(CanvasNodeComponent);
