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
});
