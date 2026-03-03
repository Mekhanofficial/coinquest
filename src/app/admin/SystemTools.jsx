import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { API_BASE_URL } from "../../config/api";

const getToken = () =>
  (localStorage.getItem("authToken") || "").replace(/^["']|["']$/g, "").trim();

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatMoney = (value = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(value, 0));

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
};

const buildFallbackMetrics = ({
  users = [],
  kycRows = [],
  transactions = [],
  tickets = [],
}) => {
  const usersOnly = users.filter((item) => `${item.role || "user"}`.toLowerCase() !== "admin");
  const usersTotal = usersOnly.length;
  const usersActive = usersOnly.filter((item) => `${item.status || ""}`.toLowerCase() === "active").length;
  const usersSuspended = usersOnly.filter((item) => `${item.status || ""}`.toLowerCase() === "suspended").length;

  const kycPending = kycRows.filter((item) => `${item.status || ""}`.toLowerCase() === "pending").length;
  const kycCompleted = kycRows.filter((item) => `${item.status || ""}`.toLowerCase() === "verified").length;
  const kycRejected = kycRows.filter((item) => `${item.status || ""}`.toLowerCase() === "rejected").length;

  const txPending = transactions.filter((item) => `${item.status || ""}`.toLowerCase() === "pending").length;
  const txCompleted = transactions.filter((item) => `${item.status || ""}`.toLowerCase() === "completed").length;
  const volume24h = transactions
    .filter((item) => {
      if (`${item.status || ""}`.toLowerCase() !== "completed") return false;
      const createdAt = new Date(item.createdAt).getTime();
      return Number.isFinite(createdAt) && createdAt >= Date.now() - 24 * 60 * 60 * 1000;
    })
    .reduce((sum, item) => sum + toNumber(item.amount, 0), 0);

  const supportOpen = tickets.filter((item) => `${item.status || ""}`.toLowerCase() === "open").length;
  const supportPending = tickets.filter((item) => `${item.status || ""}`.toLowerCase() === "pending").length;
  const supportUnread = tickets.filter((item) => toNumber(item.unreadForAdmin, 0) > 0).length;

  return {
    generatedAt: new Date().toISOString(),
    users: {
      total: usersTotal,
      active: usersActive,
      suspended: usersSuspended,
    },
    kyc: {
      pending: kycPending,
      completed: kycCompleted,
      rejected: kycRejected,
    },
    transactions: {
      pending: txPending,
      completed: txCompleted,
      volume24h,
    },
    support: {
      open: supportOpen,
      pending: supportPending,
      unreadForAdmin: supportUnread,
    },
    activeModules: {
      trades: 0,
      placeTrades: 0,
      signals: 0,
      subscriptions: 0,
      copyTrades: 0,
      mining: 0,
      stakes: 0,
    },
  };
};

const deriveFallbackLogs = (transactions = []) =>
  transactions
    .slice(0, 24)
    .map((item) => ({
      id: item.id || `${item.createdAt}-${item.userEmail}-${item.amount}`,
      type: "transaction_observed",
      message: `${item.type || "Transaction"} ${item.status || "Pending"} - ${formatMoney(item.amount)}`,
      actor: null,
      targetUser: {
        id: item.userId || "",
        name: item.userName || "",
        email: item.userEmail || "",
      },
      createdAt: item.createdAt || new Date().toISOString(),
    }));

const statusTone = (type = "") => {
  const normalized = `${type}`.toLowerCase();
  if (["broadcast", "kyc_status", "transaction_status", "balance_adjustment"].includes(normalized)) {
    return "text-emerald-500 bg-emerald-500/15";
  }
  if (normalized.includes("failed") || normalized.includes("error")) {
    return "text-rose-500 bg-rose-500/15";
  }
  return "text-sky-500 bg-sky-500/15";
};

export default function SystemTools() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [isLoading, setIsLoading] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [broadcastError, setBroadcastError] = useState("");
  const [broadcastSuccess, setBroadcastSuccess] = useState("");
  const [lastSyncAt, setLastSyncAt] = useState(0);
  const [logsRouteMissing, setLogsRouteMissing] = useState(false);
  const [metricsRouteMissing, setMetricsRouteMissing] = useState(false);

  const [metrics, setMetrics] = useState({
    generatedAt: "",
    users: { total: 0, active: 0, suspended: 0 },
    kyc: { pending: 0, completed: 0, rejected: 0 },
    transactions: { pending: 0, completed: 0, volume24h: 0 },
    support: { open: 0, pending: 0, unreadForAdmin: 0 },
    activeModules: {
      trades: 0,
      placeTrades: 0,
      signals: 0,
      subscriptions: 0,
      copyTrades: 0,
      mining: 0,
      stakes: 0,
    },
  });
  const [logs, setLogs] = useState([]);

  const [broadcastSubject, setBroadcastSubject] = useState("Platform Broadcast");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("active_all");

  const authFetch = useCallback(async (urlOrUrls, options = {}) => {
    const token = getToken();
    if (!token) {
      throw new Error("Missing admin token");
    }

    const urls = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls];
    let lastError = null;

    for (const url of urls) {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          ...(options.headers || {}),
        },
      });

      const text = await response.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }

      if (response.ok && json?.success) {
        return json;
      }

      const error = new Error(json?.message || `Request failed (${response.status})`);
      if (response.status === 404) {
        lastError = error;
        continue;
      }
      throw error;
    }

    throw lastError || new Error("Request failed");
  }, []);

  const loadSystemData = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const metricsResult = await authFetch(`${API_BASE_URL}/Admin/SystemMetrics`).catch(
        (error) => {
          if (/\(404\)/.test(error?.message || "")) {
            setMetricsRouteMissing(true);
            return null;
          }
          throw error;
        }
      );

      const [logsResult, fallbackUsers, fallbackKyc, fallbackTransactions, fallbackTickets] =
        await Promise.all([
          authFetch(`${API_BASE_URL}/Admin/Logs?limit=120`).catch((error) => {
            if (/\(404\)/.test(error?.message || "")) {
              setLogsRouteMissing(true);
              return null;
            }
            throw error;
          }),
          authFetch(`${API_BASE_URL}/Admin/Users`).catch(() => ({ success: true, data: [] })),
          authFetch(`${API_BASE_URL}/Admin/Kyc`).catch(() => ({ success: true, data: [] })),
          authFetch(`${API_BASE_URL}/Admin/Transactions`).catch(() => ({ success: true, data: [] })),
          authFetch([
            `${API_BASE_URL}/Admin/Messages?limit=120`,
            `${API_BASE_URL}/Admin/Message?limit=120`,
          ]).catch(() => ({ success: true, data: [] })),
        ]);

      const transactionsRows = fallbackTransactions?.data || [];
      const nextMetrics = metricsResult?.data
        ? metricsResult.data
        : buildFallbackMetrics({
            users: fallbackUsers?.data || [],
            kycRows: fallbackKyc?.data || [],
            transactions: transactionsRows,
            tickets: fallbackTickets?.data || [],
          });

      const nextLogs = logsResult?.data?.length
        ? logsResult.data
        : deriveFallbackLogs(transactionsRows);

      setMetrics(nextMetrics);
      setLogs(nextLogs);
      setLastSyncAt(Date.now());
      setMetricsRouteMissing(!metricsResult?.data);
      setLogsRouteMissing(!logsResult?.data);
    } catch (error) {
      console.error("System tools sync failed:", error);
      setLoadError(error?.message || "Unable to sync system tools.");
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadSystemData();
    const intervalId = setInterval(loadSystemData, 15000);
    return () => clearInterval(intervalId);
  }, [loadSystemData]);

  const handleBroadcast = async () => {
    const message = `${broadcastMessage || ""}`.trim();
    if (!message) {
      setBroadcastError("Broadcast message cannot be empty.");
      setBroadcastSuccess("");
      return;
    }

    setBroadcastError("");
    setBroadcastSuccess("");
    setIsBroadcasting(true);

    const payload = {
      subject: `${broadcastSubject || "Platform Broadcast"}`.trim(),
      message,
      onlyActive: broadcastTarget !== "all_users",
      plans:
        broadcastTarget === "elite_only"
          ? ["Elite"]
          : broadcastTarget === "premium_plus"
          ? ["Premium", "Platinum", "Elite"]
          : broadcastTarget === "platinum_elite"
          ? ["Platinum", "Elite"]
          : [],
    };

    try {
      const result = await authFetch(`${API_BASE_URL}/Admin/Broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const recipients = toNumber(result?.data?.recipients, 0);
      setBroadcastSuccess(
        `Broadcast sent successfully to ${recipients} user${recipients === 1 ? "" : "s"}.`
      );
      setBroadcastMessage("");
      await loadSystemData();
    } catch (error) {
      console.error("Broadcast failed:", error);
      setBroadcastError(
        error?.message || "Broadcast endpoint unavailable on this backend deployment."
      );
    } finally {
      setIsBroadcasting(false);
    }
  };

  const metricsCards = useMemo(
    () => [
      { label: "Users", value: metrics.users.total, tone: "text-slate-900 dark:text-slate-100" },
      { label: "Active Users", value: metrics.users.active, tone: "text-emerald-500" },
      { label: "Suspended Users", value: metrics.users.suspended, tone: "text-rose-500" },
      { label: "Pending KYC", value: metrics.kyc.pending, tone: "text-amber-500" },
      { label: "Completed KYC", value: metrics.kyc.completed, tone: "text-emerald-500" },
      { label: "Pending Tx", value: metrics.transactions.pending, tone: "text-amber-500" },
      { label: "Completed Tx", value: metrics.transactions.completed, tone: "text-emerald-500" },
      {
        label: "Tx Volume (24h)",
        value: formatMoney(metrics.transactions.volume24h),
        tone: "text-sky-500",
      },
      { label: "Open Tickets", value: metrics.support.open, tone: "text-slate-900 dark:text-slate-100" },
      { label: "Pending Tickets", value: metrics.support.pending, tone: "text-amber-500" },
      {
        label: "Unread For Admin",
        value: metrics.support.unreadForAdmin,
        tone: "text-rose-500",
      },
      {
        label: "Active Modules",
        value:
          toNumber(metrics.activeModules.trades) +
          toNumber(metrics.activeModules.placeTrades) +
          toNumber(metrics.activeModules.signals) +
          toNumber(metrics.activeModules.subscriptions) +
          toNumber(metrics.activeModules.copyTrades) +
          toNumber(metrics.activeModules.mining) +
          toNumber(metrics.activeModules.stakes),
        tone: "text-violet-500",
      },
    ],
    [metrics]
  );

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div
        className={`rounded-2xl border p-4 ${
          isDark ? "border-slate-700 bg-slate-900/90" : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">System Tools</h3>
            <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Live metrics, admin logs, and broadcast controls synced to the user portal.
            </p>
          </div>
          <button
            onClick={loadSystemData}
            className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-500"
            disabled={isLoading}
          >
            {isLoading ? "Syncing..." : "Refresh"}
          </button>
        </div>
        <p className={`mt-2 text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Last sync: {lastSyncAt ? formatDateTime(lastSyncAt) : "starting..."}
        </p>
      </div>

      {loadError && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {loadError}
        </div>
      )}

      {(metricsRouteMissing || logsRouteMissing) && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          Some admin system endpoints are not yet deployed. Fallback live data is currently in use.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricsCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border p-4 ${
              isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
            }`}
          >
            <p className="text-xs text-slate-500">{card.label}</p>
            <p className={`mt-2 text-2xl font-semibold ${card.tone}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section
          className={`xl:col-span-5 rounded-2xl border p-4 ${
            isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
          }`}
        >
          <h4 className="text-sm font-semibold">Broadcast Message</h4>
          <p className="mt-1 text-xs text-slate-500">
            Send live admin broadcast messages directly to user inbox threads.
          </p>

          <div className="mt-3 space-y-3">
            <input
              type="text"
              value={broadcastSubject}
              onChange={(event) => setBroadcastSubject(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              placeholder="Broadcast subject"
              maxLength={120}
            />
            <textarea
              value={broadcastMessage}
              onChange={(event) => setBroadcastMessage(event.target.value)}
              rows={5}
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              placeholder="Write a platform update for users..."
              maxLength={4000}
            />
            <select
              value={broadcastTarget}
              onChange={(event) => setBroadcastTarget(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="active_all">All Active Users</option>
              <option value="all_users">All Users</option>
              <option value="premium_plus">Premium+ Users</option>
              <option value="platinum_elite">Platinum + Elite</option>
              <option value="elite_only">Elite Only</option>
            </select>

            {broadcastError && (
              <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {broadcastError}
              </p>
            )}
            {broadcastSuccess && (
              <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                {broadcastSuccess}
              </p>
            )}

            <button
              onClick={handleBroadcast}
              disabled={isBroadcasting}
              className={`w-full rounded-lg px-3 py-2 text-sm font-semibold text-white ${
                isBroadcasting ? "cursor-not-allowed bg-slate-500" : "bg-teal-600 hover:bg-teal-500"
              }`}
            >
              {isBroadcasting ? "Sending..." : "Send Broadcast"}
            </button>
          </div>
        </section>

        <section
          className={`xl:col-span-7 rounded-2xl border p-4 ${
            isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold">Admin Logs</h4>
              <p className="text-xs text-slate-500">
                Live stream of security, finance, and broadcast admin actions.
              </p>
            </div>
            <span className="rounded-full bg-teal-500/15 px-2 py-1 text-[10px] font-semibold text-teal-500">
              Live
            </span>
          </div>

          <div className="mt-3 max-h-[480px] space-y-2 overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-500">No admin logs yet.</p>
            ) : (
              logs.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg border px-3 py-2 ${
                    isDark ? "border-slate-700 bg-slate-950/60" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone(item.type)}`}>
                      {item.type || "system"}
                    </span>
                    <span className="text-[11px] text-slate-500">{formatDateTime(item.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold">{item.message || "System event"}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Actor: {item.actor?.email || "System"}{" "}
                    {item.targetUser?.email ? `| Target: ${item.targetUser.email}` : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
