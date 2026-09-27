import type { ChangeEvent } from "react";
import { FENIX_SPECIALIST_PRESETS, findFenixPreset } from "@paperclipai/shared";
import type { AdapterConfigFieldsProps } from "../types";
import { DraftInput, DraftNumberInput, Field } from "../../components/agent-config-primitives";

const inputClass =
  "w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40";
const selectClass =
  "w-full rounded-md border border-border px-2.5 py-1.5 bg-background text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function LangGraphConfigFields({
  isCreate,
  values,
  set,
  config,
  eff,
  mark,
}: AdapterConfigFieldsProps) {
  const baseUrl = isCreate
    ? ((values?.adapterSchemaValues?.baseUrl as string) ?? "http://127.0.0.1:2024")
    : eff("adapterConfig", "baseUrl", (config.baseUrl as string) ?? "http://127.0.0.1:2024");

  const assistantId = isCreate
    ? ((values?.adapterSchemaValues?.assistantId as string) ?? "devops")
    : eff("adapterConfig", "assistantId", (config.assistantId as string) ?? "devops");

  const runTimeoutMs = isCreate
    ? ((values?.adapterSchemaValues?.runTimeoutMs as number | undefined) ?? 120000)
    : eff("adapterConfig", "runTimeoutMs", (config.runTimeoutMs as number) ?? 120000);
  const handlePresetChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) return;
    const preset = findFenixPreset(selectedId);
    if (!preset) return;

    if (isCreate && set) {
      set({
        adapterSchemaValues: {
          ...values?.adapterSchemaValues,
          baseUrl: preset.adapterConfig.baseUrl,
          assistantId: preset.adapterConfig.assistantId,
        },
      });
    } else {
      mark("adapterConfig", "baseUrl", preset.adapterConfig.baseUrl);
      mark("adapterConfig", "assistantId", preset.adapterConfig.assistantId);
    }
  };

  return (
    <div className="space-y-4">
      <Field
        label="Fênix Specialist Preset"
        hint="Select one of the 20 canonical Fênix specialist profiles to auto-populate assistant settings."
      >
        <select
          className={selectClass}
          value={assistantId}
          onChange={handlePresetChange}
        >
          <option value="">-- Choose a Fênix Specialist Preset --</option>
          {FENIX_SPECIALIST_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.title} ({preset.name})
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="LangGraph Server Base URL"
        hint="Base URL for the LangGraph server runtime (defaults to http://127.0.0.1:2024 for local environments)."
      >
        <DraftInput
          value={baseUrl}
          onCommit={(val: string) => {
            if (isCreate && set) {
              set({
                adapterSchemaValues: { ...values?.adapterSchemaValues, baseUrl: val },
              });
            } else {
              mark("adapterConfig", "baseUrl", val);
            }
          }}
          className={inputClass}
          placeholder="http://127.0.0.1:2024"
          immediate
        />
      </Field>

      <Field
        label="Assistant ID"
        hint="Registered graph or assistant ID on the LangGraph server (e.g. devops, solution_architect)."
      >
        <DraftInput
          value={assistantId}
          onCommit={(val: string) => {
            if (isCreate && set) {
              set({
                adapterSchemaValues: { ...values?.adapterSchemaValues, assistantId: val },
              });
            } else {
              mark("adapterConfig", "assistantId", val);
            }
          }}
          className={inputClass}
          placeholder="devops"
          immediate
        />
      </Field>

      <Field
        label="Run Timeout (ms)"
        hint="Timeout in milliseconds for LangGraph execution runs (default: 120000 ms)."
      >
        <DraftNumberInput
          value={runTimeoutMs}
          onCommit={(val: number) => {
            const num = val ?? 120000;
            if (isCreate && set) {
              set({
                adapterSchemaValues: { ...values?.adapterSchemaValues, runTimeoutMs: num },
              });
            } else {
              mark("adapterConfig", "runTimeoutMs", num);
            }
          }}
          className={inputClass}
          placeholder="120000"
          immediate
        />
      </Field>
    </div>
  );
}
