import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { assistantRoutes } from "./assistants.js";

describe("assistantRoutes", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.LANGGRAPH_BASE_URL;
  });

  function buildApp() {
    const app = express();
    app.use(express.json());
    // Mock board org access in test context
    app.use((req, _res, next) => {
      (req as unknown as { actor: { type: string; source: string; isInstanceAdmin: boolean } }).actor = {
        type: "board",
        source: "local_implicit",
        isInstanceAdmin: true,
      };
      next();
    });
    app.use(assistantRoutes());
    return app;
  }

  it("proxies graph topology from LangGraph Server successfully", async () => {
    const mockTopology = {
      nodes: [
        { id: "__start__", type: "start", data: {} },
        { id: "worker", type: "node", data: { name: "Worker" } },
        { id: "__end__", type: "end", data: {} },
      ],
      edges: [
        { source: "__start__", target: "worker", conditional: false },
        { source: "worker", target: "__end__", conditional: true },
      ],
    };

    globalThis.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;
      if (urlStr.includes("/assistants/asst-123/graph")) {
        return Promise.resolve(new Response(JSON.stringify(mockTopology), { status: 200 }));
      }
      return Promise.resolve(new Response("Not found", { status: 404 }));
    });

    const app = buildApp();
    const res = await request(app).get("/assistants/asst-123/graph");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockTopology);
  });

  it("propagates upstream error status from LangGraph Server", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Graph not found" }), { status: 404 }),
    );

    const app = buildApp();
    const res = await request(app).get("/assistants/asst-missing/graph");

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("LangGraph Server returned 404");
  });

  it("returns 502 Bad Gateway when LangGraph Server is unreachable", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Connection refused"));

    const app = buildApp();
    const res = await request(app).get("/assistants/asst-err/graph");

    expect(res.status).toBe(502);
    expect(res.body.error).toContain("Failed to reach LangGraph Server");
  });

  it("enriches orchestrator graph with 20 senior agents, canary, cab, deployment, and drift watchdog", async () => {
    const rawOrchestratorTopology = {
      nodes: [
        { id: "__start__", type: "runnable", data: {} },
        { id: "intake", type: "runnable", data: {} },
        { id: "solution_architect", type: "runnable", data: {} },
        { id: "backend", type: "runnable", data: {} },
        { id: "frontend", type: "runnable", data: {} },
        { id: "compliance_gate", type: "runnable", data: {} },
        { id: "human_escalation", type: "runnable", data: {} },
        { id: "post_compliance", type: "runnable", data: {} },
        { id: "__end__", type: "runnable", data: {} },
      ],
      edges: [
        { source: "__start__", target: "intake" },
        { source: "intake", target: "solution_architect" },
        { source: "solution_architect", target: "backend" },
        { source: "backend", target: "frontend" },
        { source: "frontend", target: "compliance_gate" },
        { source: "compliance_gate", target: "post_compliance" },
        { source: "post_compliance", target: "__end__" },
      ],
    };

    globalThis.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;
      if (urlStr.includes("/assistants/orchestrator/graph")) {
        return Promise.resolve(new Response(JSON.stringify(rawOrchestratorTopology), { status: 200 }));
      }
      return Promise.resolve(new Response("Not found", { status: 404 }));
    });

    const app = buildApp();
    const res = await request(app).get("/assistants/orchestrator/graph");

    expect(res.status).toBe(200);
    const nodeIds = res.body.nodes.map((n: { id: string }) => n.id);

    expect(nodeIds).toContain("canary");
    expect(nodeIds).toContain("cab");
    expect(nodeIds).toContain("deployment");
    expect(nodeIds).toContain("drift_watchdog");

    const saNode = res.body.nodes.find((n: { id: string }) => n.id === "solution_architect");
    expect(saNode.data.role).toContain("Solution Architect Senior");
    expect(saNode.data.state).toBe("completed");
    expect(saNode.data.tokens_consumed.total).toBeGreaterThan(0);
    expect(saNode.data.execution_logs.length).toBeGreaterThan(0);

    const canaryNode = res.body.nodes.find((n: { id: string }) => n.id === "canary");
    expect(canaryNode.data.role).toContain("Canary");
    expect(canaryNode.data.state).toBe("active");
    expect(canaryNode.data.tokens_consumed.total).toBe(1800);

    const edges = res.body.edges as Array<{ source: string; target: string }>;
    expect(edges.some(e => e.source === "post_compliance" && e.target === "canary")).toBe(true);
    expect(edges.some(e => e.source === "canary" && e.target === "cab")).toBe(true);
    expect(edges.some(e => e.source === "cab" && e.target === "deployment")).toBe(true);
    expect(edges.some(e => e.source === "deployment" && e.target === "drift_watchdog")).toBe(true);
    expect(edges.some(e => e.source === "drift_watchdog" && e.target === "__end__")).toBe(true);
    expect(edges.some(e => e.source === "post_compliance" && e.target === "__end__")).toBe(false);
  });

  it("executes isolated node test successfully", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/assistants/asst-123/nodes/devops/execute")
      .send({ inputs: { action: "plan_deployment" } });

    expect(res.status).toBe(200);
    expect(res.body.nodeId).toBe("devops");
    expect(res.body.status).toBe("success");
    expect(res.body.outputs.specialist).toContain("DevOps");
    expect(res.body.artifacts).toBeDefined();
    expect(res.body.artifacts[0].name).toBe("devops_output.json");
    expect(res.body.logs.length).toBeGreaterThan(0);
  });

  it("handles bypass / mock flag on isolated node test", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/assistants/asst-123/nodes/devops/execute")
      .send({ bypass: true, mockOutput: "Custom mock deployment response" });

    expect(res.status).toBe(200);
    expect(res.body.nodeId).toBe("devops");
    expect(res.body.status).toBe("bypassed");
    expect(res.body.outputs.result).toBe("Custom mock deployment response");
    expect(res.body.tokensConsumed.total).toBe(0);
  });

  it("handles forceHitl flag on isolated node test", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/assistants/asst-123/nodes/devops/execute")
      .send({ forceHitl: true });

    expect(res.status).toBe(200);
    expect(res.body.nodeId).toBe("devops");
    expect(res.body.status).toBe("interrupted");
    expect(res.body.outputs.interrupted).toBe(true);
    expect(res.body.logs.some((l: string) => l.includes("Pausa forçada (HITL)"))).toBe(true);
  });

  it("homologates complete assistant pipeline flow", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/assistants/orchestrator/homologate")
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.assistantId).toBe("orchestrator");
    expect(res.body.status).toBe("success");
    expect(res.body.validationResults).toHaveLength(4);
  });
});
