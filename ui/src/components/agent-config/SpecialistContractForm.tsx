import { useState, useId, useCallback, type ChangeEvent } from "react";
import {
  SPECIALIST_CONTRACT_REGISTRY,
  SPECIALIST_MODEL_PRESETS,
  FENIX_SPECIALIST_PRESETS,
  resolveSpecialistRole,
  getSpecialistContractFields,
  getSpecialistDefaultContract,
  findFenixPreset,
  type SpecialistRole,
  type SpecialistFieldDefinition,
  type Agent,
} from "@paperclipai/shared";
import type { CreateConfigValues } from "@paperclipai/adapter-utils";
import { DraftInput, DraftNumberInput, Field } from "../agent-config-primitives";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sliders, Cpu, RotateCcw } from "lucide-react";

const inputClass =
  "w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40";
const selectClass =
  "w-full rounded-md border border-border px-2.5 py-1.5 bg-background text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
const textareaClass =
  "w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40 min-h-24 resize-y";

export interface SpecialistContractFormProps {
  isCreate?: boolean;
  agent?: Agent | null;
  values?: CreateConfigValues | null;
  set?: ((patch: Partial<CreateConfigValues>) => void) | null;
  config?: Record<string, unknown>;
  eff?: <T>(group: "adapterConfig" | "metadata", field: string, original: T) => T;
  mark?: (group: "adapterConfig" | "metadata", field: string, value: unknown) => void;
  defaultRole?: string;
}

export function SpecialistContractForm({
  isCreate = false,
  agent,
  values,
  set,
  config = {},
  eff,
  mark,
  defaultRole,
}: SpecialistContractFormProps) {
  const modelCustomInputId = useId();
  // 1. Resolve current specialist role from agent metadata, config, or default
  const agentMetadata = (agent?.metadata ?? {}) as Record<string, unknown>;
  const rawRoleIdentifier =
    defaultRole ??
    (config.assistantId as string | undefined) ??
    (values?.adapterSchemaValues?.assistantId as string | undefined) ??
    (agentMetadata.cargoName as string | undefined) ??
    (agentMetadata.slug as string | undefined) ??
    (typeof agentMetadata.cargo === "number" ? agentMetadata.cargo : undefined) ??
    agent?.role ??
    "devops";

  const resolvedRole = resolveSpecialistRole(rawRoleIdentifier) ?? "devops";
  const [selectedRole, setSelectedRole] = useState<SpecialistRole>(resolvedRole);

  const catalogEntry = SPECIALIST_CONTRACT_REGISTRY[selectedRole] ?? SPECIALIST_CONTRACT_REGISTRY.devops;
  const fields = getSpecialistContractFields(selectedRole);
  const defaultContract = getSpecialistDefaultContract(selectedRole);

  // 2. Read effective specialist contract
  const effectiveContract = isCreate
    ? ((values?.adapterSchemaValues?.specialistContract as Record<string, unknown> | undefined) ?? defaultContract)
    : (eff
        ? eff("adapterConfig", "specialistContract", (config.specialistContract as Record<string, unknown> | undefined) ?? defaultContract)
        : ((config.specialistContract as Record<string, unknown> | undefined) ?? defaultContract));

  // 3. Read effective LLM model, temperature, and system prompt
  const effectiveModel = isCreate
    ? ((values?.adapterSchemaValues?.model as string | undefined) ?? "google-antigravity/gemini-3.8-flash")
    : (eff
        ? eff("adapterConfig", "model", (config.model as string | undefined) ?? (agentMetadata.model as string | undefined) ?? "google-antigravity/gemini-3.8-flash")
        : ((config.model as string | undefined) ?? (agentMetadata.model as string | undefined) ?? "google-antigravity/gemini-3.8-flash"));

  const effectiveTemperature = isCreate
    ? ((values?.adapterSchemaValues?.temperature as number | undefined) ?? 0.2)
    : (eff
        ? eff("adapterConfig", "temperature", typeof config.temperature === "number" ? config.temperature : typeof agentMetadata.temperature === "number" ? agentMetadata.temperature : 0.2)
        : (typeof config.temperature === "number" ? config.temperature : typeof agentMetadata.temperature === "number" ? agentMetadata.temperature : 0.2));

  const effectiveSystemPrompt = isCreate
    ? ((values?.adapterSchemaValues?.systemPrompt as string | undefined) ?? "")
    : (eff
        ? eff("adapterConfig", "systemPrompt", (config.systemPrompt as string | undefined) ?? (agentMetadata.systemPrompt as string | undefined) ?? "")
        : ((config.systemPrompt as string | undefined) ?? (agentMetadata.systemPrompt as string | undefined) ?? ""));

  // 4. Update handlers that persist to both adapterConfig and metadata
  const updateContractField = useCallback(
    (fieldKey: string, value: unknown) => {
      const nextContract = {
        ...effectiveContract,
        [fieldKey]: value,
      };

      if (isCreate && set) {
        set({
          adapterSchemaValues: {
            ...values?.adapterSchemaValues,
            specialistContract: nextContract,
          },
        });
      } else if (mark) {
        mark("adapterConfig", "specialistContract", nextContract);
        mark("metadata", "specialistContract", nextContract);
        mark("metadata", "cargo", catalogEntry.cargo);
        mark("metadata", "cargoName", catalogEntry.role);
      }
    },
    [effectiveContract, isCreate, set, values, mark, catalogEntry],
  );

  const updateModel = useCallback(
    (nextModel: string) => {
      if (isCreate && set) {
        set({
          adapterSchemaValues: {
            ...values?.adapterSchemaValues,
            model: nextModel,
          },
        });
      } else if (mark) {
        mark("adapterConfig", "model", nextModel);
        mark("metadata", "model", nextModel);
      }
    },
    [isCreate, set, values, mark],
  );

  const updateTemperature = useCallback(
    (nextTemp: number) => {
      if (isCreate && set) {
        set({
          adapterSchemaValues: {
            ...values?.adapterSchemaValues,
            temperature: nextTemp,
          },
        });
      } else if (mark) {
        mark("adapterConfig", "temperature", nextTemp);
        mark("metadata", "temperature", nextTemp);
      }
    },
    [isCreate, set, values, mark],
  );

  const updateSystemPrompt = useCallback(
    (nextPrompt: string) => {
      if (isCreate && set) {
        set({
          adapterSchemaValues: {
            ...values?.adapterSchemaValues,
            systemPrompt: nextPrompt,
          },
        });
      } else if (mark) {
        mark("adapterConfig", "systemPrompt", nextPrompt);
        mark("metadata", "systemPrompt", nextPrompt);
      }
    },
    [isCreate, set, values, mark],
  );

  const handleRoleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as SpecialistRole;
    if (!newRole || newRole === selectedRole) return;
    setSelectedRole(newRole);

    const newDefaults = getSpecialistDefaultContract(newRole);
    const newPreset = findFenixPreset(newRole);

    if (isCreate && set) {
      set({
        adapterSchemaValues: {
          ...values?.adapterSchemaValues,
          assistantId: newPreset?.adapterConfig?.assistantId ?? newRole,
          specialistContract: newDefaults,
        },
      });
    } else if (mark) {
      mark("adapterConfig", "assistantId", newPreset?.adapterConfig?.assistantId ?? newRole);
      mark("adapterConfig", "specialistContract", newDefaults);
      mark("metadata", "specialistContract", newDefaults);
      mark("metadata", "cargo", SPECIALIST_CONTRACT_REGISTRY[newRole].cargo);
      mark("metadata", "cargoName", newRole);
    }
  };

  const handleResetDefaults = () => {
    if (isCreate && set) {
      set({
        adapterSchemaValues: {
          ...values?.adapterSchemaValues,
          specialistContract: defaultContract,
          temperature: 0.2,
        },
      });
    } else if (mark) {
      mark("adapterConfig", "specialistContract", defaultContract);
      mark("metadata", "specialistContract", defaultContract);
      mark("adapterConfig", "temperature", 0.2);
      mark("metadata", "temperature", 0.2);
    }
  };

  return (
    <div className="space-y-6 rounded-lg border border-border bg-card p-4">
      {/* Header with Specialist Title and Cargo Badge */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Contrato Especializado & Modelo LLM
          </h3>
          <Badge variant="outline" className="text-xs">
            Cargo {String(catalogEntry.cargo).padStart(2, "0")} · {catalogEntry.name}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetDefaults}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Restaurar Padrões
          </Button>
        </div>
      </div>

      {/* Specialist Cargo Selector (Allows switching specialist profile) */}
      <Field
        label="Cargo Especialista (Fênix Wave 6)"
        hint="Define o contrato canônico, limites operacionais e responsabilidades do especialista."
      >
        <select
          className={selectClass}
          value={selectedRole}
          onChange={handleRoleChange}
        >
          {FENIX_SPECIALIST_PRESETS.map((preset) => {
            const roleKey = resolveSpecialistRole(preset.id) ?? preset.id;
            const regEntry = SPECIALIST_CONTRACT_REGISTRY[roleKey as SpecialistRole];
            const cargoNum = regEntry?.cargo ? `Cargo ${String(regEntry.cargo).padStart(2, "0")} · ` : "";
            return (
              <option key={preset.id} value={roleKey}>
                {cargoNum}{preset.title} ({preset.name})
              </option>
            );
          })}
        </select>
      </Field>

      {/* LLM Model Selection (Antigravity / OMP / Custom) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Modelo LLM Especialista"
          hint="Selecione o modelo otimizado para o perfil deste agente (Antigravity/OMP padrão recomendado)."
        >
          <div className="space-y-2">
            <select
              className={selectClass}
              value={
                SPECIALIST_MODEL_PRESETS.some((m) => m.id === effectiveModel)
                  ? effectiveModel
                  : "custom"
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val !== "custom") {
                  updateModel(val);
                }
              }}
            >
              {SPECIALIST_MODEL_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
              <option value="custom">-- Modelo Customizado / Outro --</option>
            </select>
            {(!SPECIALIST_MODEL_PRESETS.some((m) => m.id === effectiveModel) ||
              effectiveModel === "custom") && (
              <div className="space-y-1">
                <label
                  htmlFor={modelCustomInputId}
                  className="text-xs text-muted-foreground"
                >
                  ID do Modelo Customizado
                </label>
                <DraftInput
                  id={modelCustomInputId}
                  value={effectiveModel === "custom" ? "" : effectiveModel}
                  onCommit={(val: string) => updateModel(val.trim())}
                  className={inputClass}
                  placeholder="ex: google-antigravity/gemini-3.8-flash"
                  immediate
                />
              </div>
            )}
          </div>
        </Field>

        {/* Temperature */}
        <Field
          label={`Temperatura: ${effectiveTemperature.toFixed(2)}`}
          hint="Controla a aleatoriedade (0.0 = determinístico/preciso, 0.7+ = criativo/exploratório)."
        >
          <div className="space-y-2 pt-1">
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={effectiveTemperature}
              onChange={(e) => updateTemperature(Number.parseFloat(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground font-mono">
              <span>0.0 (Exato)</span>
              <span>0.2 (Especialista)</span>
              <span>0.7 (Criativo)</span>
              <span>1.5</span>
            </div>
          </div>
        </Field>
      </div>

      {/* Custom System Prompt Override */}
      <Field
        label="System Prompt Especialista (Customizado)"
        hint="Prompt de sistema e diretrizes comportamentais injetadas no subgrafo LangGraph para este agente."
      >
        <textarea
          value={effectiveSystemPrompt}
          onChange={(e) => updateSystemPrompt(e.target.value)}
          className={textareaClass}
          placeholder={`Você é o especialista ${catalogEntry.title} do ecossistema Fênix. Siga os contratos canônicos e SLAs operacionais.`}
        />
      </Field>

      {/* Canonical Contract Parameters Fields */}
      <div className="space-y-4 border-t border-border pt-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Cpu className="h-3.5 w-3.5 text-primary" />
          <span>Parâmetros Contratuais Canônicos ({fields.length} definidos)</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <SpecialistFieldRenderer
              key={field.key}
              field={field}
              value={effectiveContract[field.key] ?? field.defaultValue}
              onChange={(val) => updateContractField(field.key, val)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Individual Field Renderer according to SpecialistFieldDefinition
// ----------------------------------------------------------------------------
interface SpecialistFieldRendererProps {
  field: SpecialistFieldDefinition;
  value: unknown;
  onChange: (val: unknown) => void;
}

function SpecialistFieldRenderer({
  field,
  value,
  onChange,
}: SpecialistFieldRendererProps) {
  switch (field.type) {
    case "boolean":
      return (
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div className="space-y-0.5">
            <span className="text-sm font-medium text-foreground">{field.label}</span>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
          <ToggleSwitch
            checked={Boolean(value)}
            onCheckedChange={(checked) => onChange(checked)}
          />
        </div>
      );

    case "select":
      return (
        <Field label={field.label} hint={field.description}>
          <select
            className={selectClass}
            value={String(value ?? field.defaultValue ?? "")}
            onChange={(e) => onChange(e.target.value)}
          >
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
      );

    case "number":
      return (
        <Field label={field.label} hint={field.description}>
          <DraftNumberInput
            value={typeof value === "number" ? value : Number(field.defaultValue ?? 0)}
            onCommit={(num: number) => onChange(num)}
            className={inputClass}
            placeholder={String(field.defaultValue ?? 0)}
            immediate
          />
        </Field>
      );

    case "string_list": {
      const arrayVal = Array.isArray(value) ? (value as string[]) : [];
      return (
        <Field
          label={field.label}
          hint={`${field.description ?? ""} (valores separados por vírgula)`}
        >
          <DraftInput
            value={arrayVal.join(", ")}
            onCommit={(text: string) => {
              const list = text
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              onChange(list);
            }}
            className={inputClass}
            placeholder={field.placeholder ?? "ex: item1, item2, item3"}
            immediate
          />
        </Field>
      );
    }

    case "json": {
      const jsonText =
        typeof value === "object" && value !== null
          ? JSON.stringify(value, null, 2)
          : String(value ?? "");
      return (
        <Field
          label={field.label}
          hint={`${field.description ?? ""} (JSON formatado)`}
        >
          <textarea
            value={jsonText}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onChange(parsed);
              } catch {
                // Keep raw string until valid JSON
              }
            }}
            className={textareaClass}
            placeholder='{ "key": "value" }'
          />
        </Field>
      );
    }

    case "string":
    default:
      return (
        <Field label={field.label} hint={field.description}>
          <DraftInput
            value={String(value ?? "")}
            onCommit={(text: string) => onChange(text)}
            className={inputClass}
            placeholder={field.placeholder ?? ""}
            immediate
          />
        </Field>
      );
  }
}
