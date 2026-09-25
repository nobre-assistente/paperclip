import { Router } from "express";
import { assertBoardOrgAccess } from "./authz.js";
import { logger } from "../middleware/logger.js";

const DEFAULT_LANGGRAPH_BASE_URL = "http://127.0.0.1:2024";

export function assistantRoutes() {
  const router = Router();

  router.get("/assistants/:assistantId/graph", async (req, res) => {
    assertBoardOrgAccess(req);
    const { assistantId } = req.params;
    const baseUrl = process.env.LANGGRAPH_BASE_URL || DEFAULT_LANGGRAPH_BASE_URL;
    const targetUrl = `${baseUrl.replace(/\/+$/, "")}/assistants/${encodeURIComponent(assistantId)}/graph`;

    try {
      const upstreamRes = await fetch(targetUrl, {
        headers: { Accept: "application/json" },
      });

      if (!upstreamRes.ok) {
        const errorText = await upstreamRes.text().catch(() => "");
        return res.status(upstreamRes.status).json({
          error: `LangGraph Server returned ${upstreamRes.status}`,
          details: errorText,
        });
      }

      const data = await upstreamRes.json();
      return res.json(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn({ err, assistantId }, "Failed to proxy LangGraph assistant graph");
      return res.status(502).json({
        error: `Failed to reach LangGraph Server: ${message}`,
      });
    }
  });

  return router;
}
