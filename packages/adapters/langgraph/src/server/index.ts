import type { ServerAdapterModule } from "@paperclipai/adapter-utils";
import {
  type,
  label,
  models,
  agentConfigurationDoc,
} from "../index.js";
import { execute } from "./execute.js";
import { testEnvironment } from "./test.js";
import { sessionCodec } from "./session.js";
import { getConfigSchema, parseLangGraphAdapterConfig } from "./config.js";

export {
  execute,
  testEnvironment,
  sessionCodec,
  getConfigSchema,
  parseLangGraphAdapterConfig,
  type,
  label,
  models,
  agentConfigurationDoc,
};

export const langGraphAdapter: ServerAdapterModule = {
  type: "langgraph",
  runtimeToolDelivery: "invocation_context",
  execute,
  testEnvironment,
  sessionCodec,
  getConfigSchema,
  models: [],
  agentConfigurationDoc,
};
