import type { CreateConfigValues, TranscriptEntry } from "@paperclipai/adapter-utils";
import type { UIAdapterModule } from "../types";
import { LangGraphConfigFields } from "./config-fields";

export function parseLangGraphStdoutLine(line: string, ts: string): TranscriptEntry[] {
  return [{ kind: "stdout", ts, text: line }];
}

export function buildLangGraphConfig(values: CreateConfigValues): Record<string, unknown> {
  const schemaVals = (values.adapterSchemaValues ?? {}) as Record<string, unknown>;
  const baseUrl = (schemaVals.baseUrl as string) || "http://127.0.0.1:2024";
  const assistantId = (schemaVals.assistantId as string) || "devops";
  const runTimeoutMs = schemaVals.runTimeoutMs;
  const specialistContract = schemaVals.specialistContract;
  const model = schemaVals.model;
  const temperature = schemaVals.temperature;
  const systemPrompt = schemaVals.systemPrompt;
  return {
    baseUrl,
    assistantId,
    ...(runTimeoutMs ? { runTimeoutMs: Number(runTimeoutMs) } : {}),
    ...(specialistContract ? { specialistContract } : {}),
    ...(model ? { model } : {}),
    ...(temperature !== undefined ? { temperature } : {}),
    ...(systemPrompt ? { systemPrompt } : {}),
    ...(values.dangerouslyBypassSandbox !== undefined ? { dangerouslyBypassSandbox: values.dangerouslyBypassSandbox } : {}),
  };
}

export const langGraphUIAdapter: UIAdapterModule = {
  type: "langgraph",
  label: "Fênix Specialist (LangGraph)",
  parseStdoutLine: parseLangGraphStdoutLine,
  ConfigFields: LangGraphConfigFields,
  buildAdapterConfig: buildLangGraphConfig,
};
