// @vitest-environment jsdom

import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ReactFlowProvider, type NodeProps } from "@xyflow/react";
import {
  TerminalNode,
  ExecutorNode,
  ConditionalNode,
  InterruptNode,
} from "./CanvasNode";

const globalTarget = globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean };
globalTarget.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  flushSync(() => root.unmount());
  container.remove();
});

function makeMockNodeProps(id: string, type: string, data: Record<string, unknown> = {}): NodeProps {
  return {
    id,
    type,
    data: {
      id,
      type,
      ...data,
    },
    selected: false,
    zIndex: 1,
    isConnectable: false,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    dragging: false,
  } as unknown as NodeProps;
}

describe("CanvasNode", () => {
  it("renders TerminalNode for start and end nodes", () => {
    const startProps = makeMockNodeProps("__start__", "start");
    flushSync(() => {
      root.render(
        <ReactFlowProvider>
          <TerminalNode {...startProps} />
        </ReactFlowProvider>,
      );
    });
    expect(container.querySelector('[data-testid="canvas-node-__start__"]')).not.toBeNull();
    expect(container.textContent).toContain("__start__");

    const endProps = makeMockNodeProps("__end__", "end");
    flushSync(() => {
      root.render(
        <ReactFlowProvider>
          <TerminalNode {...endProps} />
        </ReactFlowProvider>,
      );
    });
    expect(container.querySelector('[data-testid="canvas-node-__end__"]')).not.toBeNull();
    expect(container.textContent).toContain("__end__");
  });

  it("renders ExecutorNode with parameters count", () => {
    const props = makeMockNodeProps("devops", "executor", {
      nodeData: { rto: 300, rpo: 60 },
    });
    flushSync(() => {
      root.render(
        <ReactFlowProvider>
          <ExecutorNode {...props} />
        </ReactFlowProvider>,
      );
    });

    const el = container.querySelector('[data-testid="canvas-node-devops"]');
    expect(el).not.toBeNull();
    expect(container.textContent).toContain("devops");
    expect(container.textContent).toContain("executor");
    expect(container.textContent).toContain("2 parameter(s)");
  });

  it("renders live badges for Running, Bypass, and Forced HITL states on ExecutorNode", () => {
    const props = makeMockNodeProps("devops", "executor", {
      isRunning: true,
      controls: {
        bypass: true,
        forceHitl: true,
      },
    });

    flushSync(() => {
      root.render(
        <ReactFlowProvider>
          <ExecutorNode {...props} />
        </ReactFlowProvider>,
      );
    });

    expect(container.textContent).toContain("Running");
    expect(container.textContent).toContain("Bypass / Mock");
    expect(container.textContent).toContain("HITL Forced");

    const nodeCard = container.querySelector('[data-testid="canvas-node-devops"]');
    expect(nodeCard?.className).toContain("border-emerald-500");
    expect(nodeCard?.className).toContain("border-dashed");
  });

  it("renders ConditionalNode with branch router label and control badges", () => {
    const props = makeMockNodeProps("router_node", "conditional", {
      nodeData: { branches: 3 },
      controls: { bypass: true, forceHitl: false },
    });

    flushSync(() => {
      root.render(
        <ReactFlowProvider>
          <ConditionalNode {...props} />
        </ReactFlowProvider>,
      );
    });

    expect(container.textContent).toContain("router_node");
    expect(container.textContent).toContain("conditional");
    expect(container.textContent).toContain("Bypass / Mock");
  });

  it("renders InterruptNode with human breakpoint description and HITL badge", () => {
    const props = makeMockNodeProps("human_gate", "interrupt", {
      controls: { bypass: false, forceHitl: true },
    });

    flushSync(() => {
      root.render(
        <ReactFlowProvider>
          <InterruptNode {...props} />
        </ReactFlowProvider>,
      );
    });

    expect(container.textContent).toContain("human_gate");
    expect(container.textContent).toContain("interrupt");
    expect(container.textContent).toContain("HITL Forced");
  });
});
