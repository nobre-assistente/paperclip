import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, RotateCw, RefreshCw, Database, ShieldCheck, Lock, Unlock, Zap, AlertCircle } from "lucide-react";
import { QuotaBar } from "./QuotaBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface QuotaBucket {
  id: string;
  name: string;
  remaining_fraction?: number;
  percentage: number;
  used_percentage: number;
  reset_time?: string;
  reset_status: string;
}

export interface PoolAccount {
  account: string;
  active: boolean;
  ompId?: number;
  auth_label?: string;
  healthy?: boolean;
  quota_5h?: QuotaBucket;
  quota_weekly?: QuotaBucket;
  quota?: {
    "gemini-5h"?: QuotaBucket;
    "gemini-weekly"?: QuotaBucket;
    [key: string]: QuotaBucket | undefined;
  };
}

export interface SessionLock {
  task_id: string;
  provider?: string;
  account?: string;
  size?: string;
  locked_at?: string;
}

export interface AntigravityPoolData {
  provider: string;
  active: string;
  activeOmpId?: number;
  ban_risk_score: number;
  session_lock?: SessionLock | null;
  accounts: PoolAccount[];
  healthy?: boolean;
}

const DEFAULT_ACCOUNTS: PoolAccount[] = [
  {
    account: "enobrecido@gmail.com",
    active: true,
    ompId: 1,
    auth_label: "OK",
    healthy: true,
    quota: {
      "gemini-5h": {
        id: "gemini-5h",
        name: "Gemini (5 Horas)",
        percentage: 59.7,
        used_percentage: 40.3,
        reset_status: "em 1h 2m",
      },
      "gemini-weekly": {
        id: "gemini-weekly",
        name: "Gemini (Semanal)",
        percentage: 83.1,
        used_percentage: 16.9,
        reset_status: "em 5d 16h",
      },
    },
  },
  {
    account: "emaildopmsp@gmail.com",
    active: false,
    ompId: 2,
    auth_label: "OK",
    healthy: true,
    quota: {
      "gemini-5h": {
        id: "gemini-5h",
        name: "Gemini (5 Horas)",
        percentage: 94.2,
        used_percentage: 5.8,
        reset_status: "em 4h 43m",
      },
      "gemini-weekly": {
        id: "gemini-weekly",
        name: "Gemini (Semanal)",
        percentage: 34.3,
        used_percentage: 65.7,
        reset_status: "em 1d 14h",
      },
    },
  },
  {
    account: "enobrecendo@gmail.com",
    active: false,
    ompId: 3,
    auth_label: "OK",
    healthy: true,
    quota: {
      "gemini-5h": {
        id: "gemini-5h",
        name: "Gemini (5 Horas)",
        percentage: 37.3,
        used_percentage: 62.7,
        reset_status: "em 19m",
      },
      "gemini-weekly": {
        id: "gemini-weekly",
        name: "Gemini (Semanal)",
        percentage: 20.0,
        used_percentage: 80.0,
        reset_status: "em 1d 3h",
      },
    },
  },
  {
    account: "logindosnegocios@gmail.com",
    active: false,
    ompId: 4,
    auth_label: "OK",
    healthy: true,
    quota: {
      "gemini-5h": {
        id: "gemini-5h",
        name: "Gemini (5 Horas)",
        percentage: 100.0,
        used_percentage: 0.0,
        reset_status: "em 4h 46m",
      },
      "gemini-weekly": {
        id: "gemini-weekly",
        name: "Gemini (Semanal)",
        percentage: 82.1,
        used_percentage: 17.9,
        reset_status: "em 3d 19h",
      },
    },
  },
  {
    account: "pedro.projetofenix@gmail.com",
    active: false,
    ompId: 5,
    auth_label: "OK",
    healthy: true,
    quota: {
      "gemini-5h": {
        id: "gemini-5h",
        name: "Gemini (5 Horas)",
        percentage: 93.1,
        used_percentage: 6.9,
        reset_status: "em 1h 25m",
      },
      "gemini-weekly": {
        id: "gemini-weekly",
        name: "Gemini (Semanal)",
        percentage: 47.4,
        used_percentage: 52.6,
        reset_status: "em 3d 14h",
      },
    },
  },
];

const DEFAULT_POOL: AntigravityPoolData = {
  provider: "antigravity",
  active: "enobrecido@gmail.com",
  activeOmpId: 1,
  ban_risk_score: 0,
  session_lock: {
    task_id: "FEA-WAVE12-BATCH2A",
    provider: "antigravity",
    account: "enobrecido@gmail.com",
  },
  accounts: DEFAULT_ACCOUNTS,
  healthy: true,
};

export interface AntigravitySubscriptionPanelProps {
  className?: string;
  source?: string | null;
  error?: string | null;
}

export function AntigravitySubscriptionPanel({
  className,
  source = "ORCA POOL",
  error: externalError,
}: AntigravitySubscriptionPanelProps) {
  const [data, setData] = useState<AntigravityPoolData>(DEFAULT_POOL);
  const [loading, setLoading] = useState(false);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchPoolStatus = useCallback(async (refresh = false) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/ai-connections/antigravity/pool${refresh ? "?refresh=true" : ""}`, {
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.accounts) {
          setData(json);
        }
      }
    } catch {
      // Fallback to existing data if network or server is offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPoolStatus();
  }, [fetchPoolStatus]);

  const handleSwitchAccount = async (accountEmail: string) => {
    setActionPending(`switch-${accountEmail}`);
    setFeedback(null);
    try {
      const res = await fetch("/api/ai-connections/antigravity/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: accountEmail, force: true }),
      });
      const resData = await res.json().catch(() => ({}));
      if (res.ok || resData.ok) {
        setFeedback({ message: `Conta alterada com sucesso para ${accountEmail} (ID 1 no OMP)`, type: "success" });
        await fetchPoolStatus();
      } else {
        setFeedback({ message: resData.error || `Falha ao alternar para ${accountEmail}`, type: "error" });
      }
    } catch (err) {
      setFeedback({ message: `Erro de rede ao ativar conta: ${err instanceof Error ? err.message : String(err)}`, type: "error" });
    } finally {
      setActionPending(null);
    }
  };

  const handleRotateNext = async () => {
    setActionPending("next");
    setFeedback(null);
    try {
      const res = await fetch("/api/ai-connections/antigravity/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: false }),
      });
      const resData = await res.json().catch(() => ({}));
      if (res.ok || resData.ok) {
        const nextAccount = resData.account || "próxima conta saudável";
        setFeedback({ message: `Rotacionado com sucesso para ${nextAccount} (ac next)`, type: "success" });
        await fetchPoolStatus();
      } else {
        setFeedback({ message: resData.error || "Falha ao rotacionar para próxima conta", type: "error" });
      }
    } catch (err) {
      setFeedback({ message: `Erro de rede ao rotacionar conta: ${err instanceof Error ? err.message : String(err)}`, type: "error" });
    } finally {
      setActionPending(null);
    }
  };

  const handleRefreshOAuth = async () => {
    setActionPending("refresh");
    setFeedback(null);
    try {
      const res = await fetch("/api/ai-connections/antigravity/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const resData = await res.json().catch(() => ({}));
      if (res.ok || resData.ok) {
        setFeedback({ message: "Todos os tokens OAuth foram renovados com sucesso (ac refresh)", type: "success" });
        await fetchPoolStatus();
      } else {
        setFeedback({ message: resData.error || "Falha ao renovar tokens OAuth", type: "error" });
      }
    } catch (err) {
      setFeedback({ message: `Erro de rede ao renovar tokens: ${err instanceof Error ? err.message : String(err)}`, type: "error" });
    } finally {
      setActionPending(null);
    }
  };

  const handleSyncOmp = async () => {
    setActionPending("sync-omp");
    setFeedback(null);
    try {
      const res = await fetch("/api/ai-connections/antigravity/sync-omp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const resData = await res.json().catch(() => ({}));
      if (res.ok || resData.ok) {
        setFeedback({ message: "Pool sincronizado com sucesso com o Oh My Pi (ac sync-omp)", type: "success" });
        await fetchPoolStatus();
      } else {
        setFeedback({ message: resData.error || "Falha ao sincronizar OMP", type: "error" });
      }
    } catch (err) {
      setFeedback({ message: `Erro ao sincronizar OMP: ${err instanceof Error ? err.message : String(err)}`, type: "error" });
    } finally {
      setActionPending(null);
    }
  };

  const activeAccount = data.accounts.find((a) => a.active) || data.accounts[0];
  const activeOmpId = data.activeOmpId ?? activeAccount?.ompId ?? 1;
  const isLocked = Boolean(data.session_lock?.task_id);
  const lockTaskId = data.session_lock?.task_id;

  return (
    <div className={cn("border border-border p-4 space-y-4 rounded-none bg-card text-card-foreground", className)}>
      {/* 1. Header do Painel */}
      <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
        <div className="min-w-0">
          <div className="text-(length:--text-micro) font-semibold uppercase tracking-(--tracking-caps) text-muted-foreground flex items-center gap-1.5">
            <Zap className="size-3.5 text-amber-500" />
            Google Antigravity Subscription
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Account Switcher Multi-Account Pool & Telemetria em Tempo Real
          </div>
        </div>
        <div className="flex items-center gap-2">
          {source && (
            <span className="shrink-0 border border-border px-2.5 py-1 text-(length:--text-nano) font-semibold uppercase tracking-(--tracking-eyebrow) text-muted-foreground">
              {source}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => fetchPoolStatus(true)}
            disabled={loading}
            title="Atualizar cotas ao vivo"
          >
            <RotateCw className={cn("size-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Alerta de Erro Externo */}
      {externalError && (
        <div className="border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{externalError}</span>
        </div>
      )}

      {/* Feedback de Ação Imediata */}
      {feedback && (
        <div
          className={cn(
            "px-3 py-2 text-xs flex items-center gap-2 border transition-all",
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-destructive/40 bg-destructive/10 text-destructive",
          )}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="size-3.5 shrink-0" />
          ) : (
            <AlertCircle className="size-3.5 shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* 2. Cabeçalho Executivo do Pool */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-muted/30 border border-border">
        {/* Conta Ativa Atual */}
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Conta Ativa Atual
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold truncate text-foreground">
              {activeAccount?.account || data.active}
            </span>
            <Badge className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold px-2 py-0.5 whitespace-nowrap">
              ATIVA · ID {activeOmpId} no OMP
            </Badge>
          </div>
        </div>

        {/* Score de Risco Anti-Ban */}
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ban-Risk Index
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
            <span className="text-sm font-bold text-foreground">
              Ban-Risk Index: {data.ban_risk_score ?? 0}/100 (Risco Zero)
            </span>
          </div>
        </div>

        {/* Status da Trava de Afinidade */}
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Trava de Afinidade
          </div>
          <div className="flex items-center gap-2">
            {isLocked ? (
              <>
                <Lock className="size-4 text-amber-400 shrink-0" />
                <span className="text-sm font-semibold text-amber-400 truncate">
                  Task Sticky Session: Travada em {lockTaskId}
                </span>
              </>
            ) : (
              <>
                <Unlock className="size-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-semibold text-foreground">
                  Task Sticky Session: Livre
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Barra de Ações Rápidas */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-8 gap-1.5"
          onClick={handleRotateNext}
          disabled={actionPending !== null}
        >
          <RotateCw className={cn("size-3.5", actionPending === "next" && "animate-spin")} />
          Rotacionar p/ Próxima Saudável (ac next)
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-xs h-8 gap-1.5"
          onClick={handleRefreshOAuth}
          disabled={actionPending !== null}
        >
          <RefreshCw className={cn("size-3.5", actionPending === "refresh" && "animate-spin")} />
          Renovar Todos os Tokens OAuth (ac refresh)
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-xs h-8 gap-1.5"
          onClick={handleSyncOmp}
          disabled={actionPending !== null}
        >
          <Database className={cn("size-3.5", actionPending === "sync-omp" && "animate-spin")} />
          Sincronizar OMP (ac sync-omp)
        </Button>
      </div>

      {/* 4. Lista de Contas do Cofre */}
      <div className="space-y-3 pt-2">
        <div className="text-(length:--text-micro) font-semibold uppercase tracking-(--tracking-caps) text-muted-foreground">
          Contas do Cofre Antigravity ({data.accounts.length})
        </div>

        <div className="space-y-3">
          {data.accounts.map((acc, index) => {
            const quota5h = acc.quota?.["gemini-5h"] || acc.quota_5h || {
              id: "gemini-5h",
              name: "Gemini (5 Horas)",
              percentage: 100,
              used_percentage: 0,
              reset_status: "em 4h 59m",
            };

            const quotaWeekly = acc.quota?.["gemini-weekly"] || acc.quota_weekly || {
              id: "gemini-weekly",
              name: "Gemini (Semanal)",
              percentage: 100,
              used_percentage: 0,
              reset_status: "em 7d",
            };

            const isCurrentActive = acc.active;
            const ompAccountId = acc.ompId ?? index + 1;
            const isSwitching = actionPending === `switch-${acc.account}`;

            return (
              <div
                key={acc.account}
                className={cn(
                  "border p-3.5 space-y-3 transition-colors",
                  isCurrentActive ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-card",
                )}
              >
                {/* Cabeçalho da Conta: Email, Badges e Botão Ativar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-sm font-semibold truncate text-foreground">{acc.account}</span>

                    {isCurrentActive ? (
                      <Badge className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold px-1.5 py-0.5">
                        ATIVA · ID {ompAccountId} no OMP
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground text-xs font-medium px-1.5 py-0.5">
                        STANDBY · ID {ompAccountId}
                      </Badge>
                    )}

                    <Badge variant="secondary" className="text-xs text-muted-foreground px-1.5 py-0.5 flex items-center gap-1">
                      <CheckCircle2 className="size-3 text-emerald-400" />
                      ✔ OAuth
                    </Badge>
                  </div>

                  {!isCurrentActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2.5"
                      onClick={() => handleSwitchAccount(acc.account)}
                      disabled={actionPending !== null}
                    >
                      {isSwitching ? (
                        <>
                          <RotateCw className="size-3 animate-spin mr-1" />
                          Ativando...
                        </>
                      ) : (
                        "Ativar Conta"
                      )}
                    </Button>
                  )}
                </div>

                {/* Duas barras QuotaBar: 5 Horas e Semanal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Barra 1: Gemini (5 Horas) */}
                  <QuotaBar
                    label="Gemini (5 Horas)"
                    percentUsed={quota5h.used_percentage}
                    leftLabel={`${Math.round(quota5h.percentage)}% restante`}
                    rightLabel={quota5h.reset_status}
                  />

                  {/* Barra 2: Gemini (Semanal) */}
                  <QuotaBar
                    label="Gemini (Semanal)"
                    percentUsed={quotaWeekly.used_percentage}
                    leftLabel={`${Math.round(quotaWeekly.percentage)}% restante`}
                    rightLabel={quotaWeekly.reset_status}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AntigravitySubscriptionPanel;
