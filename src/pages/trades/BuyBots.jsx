import { useCallback, useEffect, useMemo, useState } from "react";
import { useTransactions } from "../../context/TransactionContext";
import { useTheme } from "next-themes";
import { useUser } from "../../context/UserContext";
import { useNotifications } from "../../context/NotificationContext";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";
import {
  FaBolt,
  FaChartLine,
  FaCheckCircle,
  FaCrown,
  FaPowerOff,
  FaRobot,
  FaShieldAlt,
  FaSyncAlt,
  FaTimes,
  FaWallet,
} from "react-icons/fa";

import bt1 from "../../pictures/bt9.avif";
import bt2 from "../../pictures/bt10.avif";
import bt3 from "../../pictures/bt3.jpg";
import bt4 from "../../pictures/bt4.jpg";
import bt5 from "../../pictures/bt5.png";
import bt6 from "../../pictures/bt6.png";
import bt7 from "../../pictures/bt2.jpg";
import bt8 from "../../pictures/bt8.avif";

const BOT_CATALOG = [
  {
    id: 1,
    name: "3COMMAS",
    image: bt1,
    monthlyRoi: 25,
    price: 750,
    level: 25,
    winRate: 82,
    description: "Automated trend-following with strict risk controls.",
  },
  {
    id: 2,
    name: "CRYPTOHOPPER",
    image: bt2,
    monthlyRoi: 30,
    price: 1000,
    level: 30,
    winRate: 85,
    description: "Multi-strategy bot optimized for momentum entries.",
  },
  {
    id: 3,
    name: "TRADINGVIEW",
    image: bt3,
    monthlyRoi: 22,
    price: 600,
    level: 20,
    winRate: 78,
    description: "Signal-backed execution from technical alerts.",
  },
  {
    id: 4,
    name: "ZIGNALY",
    image: bt4,
    monthlyRoi: 28,
    price: 900,
    level: 28,
    winRate: 84,
    description: "Copy-assisted strategies with low-latency execution.",
  },
  {
    id: 5,
    name: "SHRIMMPY",
    image: bt5,
    monthlyRoi: 35,
    price: 1200,
    level: 35,
    winRate: 88,
    description: "Portfolio rebalancing and high-yield market scanning.",
  },
  {
    id: 6,
    name: "COINRULE",
    image: bt6,
    monthlyRoi: 20,
    price: 500,
    level: 18,
    winRate: 74,
    description: "Beginner-friendly automation with safe presets.",
  },
  {
    id: 7,
    name: "TRADEBOT",
    image: bt7,
    monthlyRoi: 27,
    price: 850,
    level: 25,
    winRate: 81,
    description: "Fast-reacting execution engine for volatile pairs.",
  },
  {
    id: 8,
    name: "BITUNIVERSE",
    image: bt8,
    monthlyRoi: 33,
    price: 1100,
    level: 32,
    winRate: 86,
    description: "AI-assisted order routing with adaptive position sizing.",
  },
];

const BOT_STORAGE_KEY = "purchasedBots";

const readPurchasedBots = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(BOT_STORAGE_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    const parsed = raw
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);
    return [...new Set(parsed)];
  } catch {
    return [];
  }
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const BotActionModal = ({
  theme,
  mode,
  bot,
  onClose,
  onConfirm,
  loading,
}) => {
  if (!bot) return null;

  const isPurchase = mode === "purchase";
  const title = isPurchase ? "Activate Bot" : "Deactivate Bot";
  const subtitle = isPurchase
    ? "Confirm this purchase to start automated bot trading."
    : "This will stop bot activity immediately.";
  const buttonLabel = isPurchase ? "Confirm Purchase" : "Confirm Deactivate";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div
        className={`w-full max-w-xl rounded-2xl border p-6 shadow-2xl ${
          theme === "dark"
            ? "border-slate-700 bg-slate-900 text-slate-100"
            : "border-slate-200 bg-white text-slate-900"
        }`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p
              className={`mt-1 text-sm ${
                theme === "dark" ? "text-slate-400" : "text-slate-600"
              }`}
            >
              {subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className={`rounded-lg p-2 transition ${
              theme === "dark"
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>

        <div
          className={`mb-6 rounded-xl border p-4 ${
            theme === "dark"
              ? "border-slate-700 bg-slate-800/70"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-4">
            <img
              src={bot.image}
              alt={bot.name}
              className="h-16 w-16 rounded-xl object-cover"
            />
            <div>
              <p className="text-lg font-bold">{bot.name}</p>
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Level {bot.level} • Win Rate {bot.winRate}%
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className={theme === "dark" ? "text-slate-400" : "text-slate-600"}>
                Investment
              </p>
              <p className="font-semibold">{formatCurrency(bot.price)}</p>
            </div>
            <div>
              <p className={theme === "dark" ? "text-slate-400" : "text-slate-600"}>
                Est. Monthly ROI
              </p>
              <p className="font-semibold text-emerald-500">+{bot.monthlyRoi}%</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className={`flex-1 rounded-xl px-4 py-3 font-semibold transition ${
              theme === "dark"
                ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-xl px-4 py-3 font-semibold text-white transition ${
              isPurchase
                ? "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500"
                : "bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500"
            } ${loading ? "cursor-not-allowed opacity-70" : ""}`}
          >
            {loading ? "Processing..." : buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const BotFeedbackModal = ({ theme, message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-2xl border p-6 text-center shadow-2xl ${
          theme === "dark"
            ? "border-slate-700 bg-slate-900 text-slate-100"
            : "border-slate-200 bg-white text-slate-900"
        }`}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
          <FaCheckCircle className="text-2xl" />
        </div>
        <h3 className="text-xl font-bold">Completed</h3>
        <p
          className={`mt-2 text-sm ${
            theme === "dark" ? "text-slate-400" : "text-slate-600"
          }`}
        >
          {message}
        </p>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-3 font-semibold text-white hover:from-teal-500 hover:to-cyan-500"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default function BuyBotPage() {
  const { theme } = useTheme();
  const { addTransaction } = useTransactions();
  const { userData, updateUserBalance, getAuthToken, isAuthenticated } = useUser();
  const { addNotification } = useNotifications();

  const [purchasedBots, setPurchasedBots] = useState([]);
  const [backendBotIndex, setBackendBotIndex] = useState({});
  const [isSyncingBots, setIsSyncingBots] = useState(false);
  const [showManager, setShowManager] = useState(true);
  const [processingBotId, setProcessingBotId] = useState(null);
  const [actionModal, setActionModal] = useState({
    mode: null,
    bot: null,
  });
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const parseJsonSafely = async (response) => {
    const text = await response.text();
    try {
      return { json: JSON.parse(text), text };
    } catch {
      return { json: null, text };
    }
  };

  const getCleanToken = useCallback(() => {
    const token = getAuthToken?.();
    if (!token) return null;
    return token.replace(/^["']|["']$/g, "").trim();
  }, [getAuthToken]);

  const mapBackendRecordToBotId = useCallback((record) => {
    const settingsBotId = Number(record?.settings?.botId);
    if (Number.isInteger(settingsBotId) && settingsBotId > 0) {
      return settingsBotId;
    }

    const strategyName = `${record?.strategyName || ""}`.trim().toLowerCase();
    if (!strategyName) return null;

    const matched = BOT_CATALOG.find(
      (entry) => entry.name.toLowerCase() === strategyName
    );
    return matched?.id || null;
  }, []);

  const fetchBackendBotIdByCatalogId = useCallback(
    async (catalogBotId, token) => {
      const response = await fetch(`${API_BASE_URL}/BuyBot`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const { json: result } = await parseJsonSafely(response);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Failed to fetch bot records.");
      }

      const rows = Array.isArray(result?.data) ? result.data : [];
      const matched = rows.find(
        (row) => mapBackendRecordToBotId(row) === catalogBotId
      );

      if (!matched?._id) return null;
      const backendId = String(matched._id);
      setBackendBotIndex((prev) => ({ ...prev, [catalogBotId]: backendId }));
      return backendId;
    },
    [mapBackendRecordToBotId]
  );

  const syncPurchasedBotsFromBackend = useCallback(async () => {
    const token = getCleanToken();
    if (!token) {
      setPurchasedBots(readPurchasedBots());
      setBackendBotIndex({});
      return;
    }

    setIsSyncingBots(true);
    try {
      const response = await fetch(`${API_BASE_URL}/BuyBot`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const { json: result } = await parseJsonSafely(response);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || `Bot sync failed (${response.status})`);
      }

      const rows = Array.isArray(result?.data) ? result.data : [];
      const activeIds = [];
      const nextIndex = {};
      const localIds = readPurchasedBots();

      rows.forEach((row) => {
        const mappedId = mapBackendRecordToBotId(row);
        if (!mappedId) return;

        if (row?._id && !nextIndex[mappedId]) {
          nextIndex[mappedId] = String(row._id);
        }

        if (`${row?.status || ""}`.toLowerCase() === "active") {
          activeIds.push(mappedId);
        }
      });

      if (activeIds.length === 0 && localIds.length > 0) {
        for (const localBotId of localIds) {
          const catalogBot = BOT_CATALOG.find((entry) => entry.id === localBotId);
          if (!catalogBot) continue;

          try {
            const migrateResponse = await fetch(`${API_BASE_URL}/BuyBot/Create`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                strategyName: catalogBot.name,
                asset: "USD",
                budget: catalogBot.price,
                status: "Active",
                settings: {
                  botId: catalogBot.id,
                  monthlyRoi: catalogBot.monthlyRoi,
                  winRate: catalogBot.winRate,
                  level: catalogBot.level,
                  migratedFromLocal: true,
                },
              }),
            });

            const { json: migrateResult } = await parseJsonSafely(migrateResponse);
            if (!migrateResponse.ok || !migrateResult?.success) {
              continue;
            }

            const createdId = String(
              migrateResult?.data?._id || migrateResult?.data?.id || ""
            );
            if (createdId) {
              nextIndex[localBotId] = createdId;
            }
            activeIds.push(localBotId);
          } catch (migrationError) {
            console.warn("Local buy bot migration skipped:", migrationError);
          }
        }
      }

      setBackendBotIndex(nextIndex);
      setPurchasedBots([...new Set(activeIds)]);
    } catch (error) {
      console.error("Buy bot backend sync failed:", error);
      setPurchasedBots(readPurchasedBots());
    } finally {
      setIsSyncingBots(false);
    }
  }, [getCleanToken, mapBackendRecordToBotId]);

  const ensureBackendBotActive = useCallback(
    async (bot) => {
      const token = getCleanToken();
      if (!token) {
        throw new Error("Authentication token missing. Please login again.");
      }

      const payload = {
        strategyName: bot.name,
        asset: "USD",
        budget: bot.price,
        status: "Active",
        settings: {
          botId: bot.id,
          monthlyRoi: bot.monthlyRoi,
          winRate: bot.winRate,
          level: bot.level,
        },
      };

      const existingBackendId = backendBotIndex[bot.id];
      if (existingBackendId) {
        const response = await fetch(`${API_BASE_URL}/BuyBot/${existingBackendId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });

        const { json: result } = await parseJsonSafely(response);
        if (!response.ok || !result?.success) {
          throw new Error(result?.message || "Unable to update bot status.");
        }

        return existingBackendId;
      }

      const createResponse = await fetch(`${API_BASE_URL}/BuyBot/Create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const { json: createResult } = await parseJsonSafely(createResponse);
      if (!createResponse.ok || !createResult?.success) {
        throw new Error(createResult?.message || "Unable to create bot record.");
      }

      const createdId = String(
        createResult?.data?._id || createResult?.data?.id || ""
      );
      if (createdId) {
        setBackendBotIndex((prev) => ({ ...prev, [bot.id]: createdId }));
      }

      return createdId;
    },
    [backendBotIndex, getCleanToken]
  );

  const ensureBackendBotPaused = useCallback(
    async (bot) => {
      const token = getCleanToken();
      if (!token) {
        throw new Error("Authentication token missing. Please login again.");
      }

      let backendId = backendBotIndex[bot.id];
      if (!backendId) {
        backendId = await fetchBackendBotIdByCatalogId(bot.id, token);
      }

      if (!backendId) return;

      const response = await fetch(`${API_BASE_URL}/BuyBot/${backendId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ status: "Paused" }),
      });

      const { json: result } = await parseJsonSafely(response);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Unable to pause bot.");
      }
    },
    [backendBotIndex, fetchBackendBotIdByCatalogId, getCleanToken]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setPurchasedBots(readPurchasedBots());
      setBackendBotIndex({});
      return;
    }

    syncPurchasedBotsFromBackend();
  }, [isAuthenticated, syncPurchasedBotsFromBackend, userData?.userId]);

  useEffect(() => {
    localStorage.setItem(BOT_STORAGE_KEY, JSON.stringify(purchasedBots));
  }, [purchasedBots]);

  useEffect(() => {
    const sync = () => {
      if (isAuthenticated) {
        syncPurchasedBotsFromBackend();
        return;
      }
      setPurchasedBots(readPurchasedBots());
    };

    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, [isAuthenticated, syncPurchasedBotsFromBackend]);

  const activeBots = useMemo(
    () => BOT_CATALOG.filter((bot) => purchasedBots.includes(bot.id)),
    [purchasedBots]
  );

  const availableBalance = Number(userData?.balance) || 0;
  const investedCapital = useMemo(
    () => activeBots.reduce((total, bot) => total + bot.price, 0),
    [activeBots]
  );
  const estimatedMonthlyReturn = useMemo(
    () =>
      activeBots.reduce(
        (total, bot) => total + (bot.price * bot.monthlyRoi) / 100,
        0
      ),
    [activeBots]
  );
  const avgWinRate = useMemo(() => {
    if (!activeBots.length) return 0;
    const total = activeBots.reduce((sum, bot) => sum + bot.winRate, 0);
    return total / activeBots.length;
  }, [activeBots]);

  const openPurchaseModal = (bot) => {
    if (purchasedBots.includes(bot.id)) {
      toast("Bot is already active.");
      return;
    }
    setActionModal({ mode: "purchase", bot });
  };

  const openDeactivateModal = (bot) => {
    setActionModal({ mode: "deactivate", bot });
  };

  const closeActionModal = () => {
    if (processingBotId) return;
    setActionModal({ mode: null, bot: null });
  };

  const ensureLoggedIn = () => {
    if (!userData?.email || !getCleanToken()) {
      toast.error("Please log in to manage bots.");
      return false;
    }
    return true;
  };

  const handleConfirmPurchase = async () => {
    const bot = actionModal.bot;
    if (!bot || processingBotId) return;
    if (!ensureLoggedIn()) return;
    if (purchasedBots.includes(bot.id)) {
      toast("Bot is already active.");
      closeActionModal();
      return;
    }
    if (availableBalance < bot.price) {
      toast.error(
        `Insufficient funds. You need ${formatCurrency(bot.price)} to activate ${bot.name}.`
      );
      return;
    }

    setProcessingBotId(bot.id);

    let balanceDebited = false;
    let debitTransactionLogged = false;
    try {
      const balanceResult = await updateUserBalance(-bot.price);
      if (!balanceResult?.success) {
        throw new Error(balanceResult?.error || "Balance update failed.");
      }
      balanceDebited = true;

      const txResult = await addTransaction({
        type: "debit",
        amount: bot.price,
        description: `Bot purchase: ${bot.name}`,
        status: "Completed",
        category: "bots",
        currency: "USD",
        botDetails: {
          name: bot.name,
          profitRate: `${bot.monthlyRoi}%`,
          winRate: `${bot.winRate}%`,
          level: String(bot.level),
        },
      });

      if (!txResult?.success) {
        throw new Error(txResult?.error || "Transaction log failed.");
      }
      debitTransactionLogged = true;

      await ensureBackendBotActive(bot);

      setPurchasedBots((prev) =>
        prev.includes(bot.id) ? prev : [...prev, bot.id]
      );
      addNotification(
        `${bot.name} activated. Investment: ${formatCurrency(bot.price)}.`,
        "success"
      );
      setFeedbackMessage(
        `${bot.name} is now active and synced. Capital allocated: ${formatCurrency(
          bot.price
        )}.`
      );
      toast.success(`${bot.name} activated.`);
      setActionModal({ mode: null, bot: null });
    } catch (error) {
      console.error("Bot purchase failed:", error);
      if (balanceDebited) {
        const rollbackResult = await updateUserBalance(bot.price);
        if (rollbackResult?.success && debitTransactionLogged) {
          await addTransaction({
            type: "credit",
            amount: bot.price,
            description: `Bot activation rollback: ${bot.name}`,
            status: "Completed",
            category: "bots",
            currency: "USD",
            botDetails: {
              name: bot.name,
              level: String(bot.level),
            },
          });
        }
      }
      toast.error(error?.message || `Failed to activate ${bot.name}.`);
    } finally {
      setProcessingBotId(null);
    }
  };

  const handleConfirmDeactivate = async () => {
    const bot = actionModal.bot;
    if (!bot || processingBotId) return;
    if (!ensureLoggedIn()) return;

    setProcessingBotId(bot.id);
    try {
      await ensureBackendBotPaused(bot);

      const txResult = await addTransaction({
        type: "info",
        amount: 0,
        description: `Bot deactivated: ${bot.name}`,
        status: "Cancelled",
        category: "bots",
        currency: "USD",
        botDetails: {
          name: bot.name,
          level: String(bot.level),
        },
      });

      if (!txResult?.success) {
        console.warn("Bot deactivation log failed:", txResult?.error);
      }

      setPurchasedBots((prev) => prev.filter((id) => id !== bot.id));
      addNotification(`${bot.name} has been deactivated.`, "info");
      setFeedbackMessage(`${bot.name} deactivated successfully.`);
      toast.success(`${bot.name} deactivated.`);
      setActionModal({ mode: null, bot: null });
    } catch (error) {
      console.error("Bot deactivation failed:", error);
      toast.error(error?.message || `Failed to deactivate ${bot.name}.`);
    } finally {
      setProcessingBotId(null);
    }
  };

  const cardSurface =
    theme === "dark"
      ? "border-slate-700 bg-slate-900 text-slate-100"
      : "border-slate-200 bg-white text-slate-900";

  return (
    <section
      className={`min-h-screen px-4 py-10 sm:px-6 lg:px-8 ${
        theme === "dark" ? "bg-zinc-950" : "bg-gray-50"
      }`}
    >
      <div className="w-full space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className={`rounded-2xl border p-5 ${cardSurface}`}>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Available Balance
            </p>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(availableBalance)}</p>
            <p className="mt-2 text-xs text-slate-400">Ready for bot allocation</p>
          </div>
          <div className={`rounded-2xl border p-5 ${cardSurface}`}>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Active Bots
            </p>
            <p className="mt-2 text-2xl font-bold">{activeBots.length}</p>
            <p className="mt-2 text-xs text-slate-400">
              {isSyncingBots
                ? "Syncing bot fleet from backend..."
                : "Synced with Mining boost stack"}
            </p>
          </div>
          <div className={`rounded-2xl border p-5 ${cardSurface}`}>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Invested Capital
            </p>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(investedCapital)}</p>
            <p className="mt-2 text-xs text-slate-400">Across all active bots</p>
          </div>
          <div className={`rounded-2xl border p-5 ${cardSurface}`}>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Est. Monthly Return
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-500">
              {formatCurrency(estimatedMonthlyReturn)}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Avg. win rate {avgWinRate.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className={`rounded-2xl border p-5 sm:p-6 ${cardSurface}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <FaRobot className="text-teal-400" />
                AI Trading Bots Marketplace
              </h2>
              <p
                className={`mt-1 text-sm ${
                  theme === "dark" ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Activate bots with confirmation modals, transaction logs, and synced local fleet state.
              </p>
            </div>
            <button
              onClick={() => setShowManager((prev) => !prev)}
              className="rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:from-teal-500 hover:to-cyan-500"
            >
              {showManager ? "Hide Fleet Manager" : "Show Fleet Manager"}
            </button>
          </div>
        </div>

        {showManager && (
          <div className={`rounded-2xl border p-5 sm:p-6 ${cardSurface}`}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <FaCrown className="text-amber-400" />
                My Active Bot Fleet
              </h3>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  theme === "dark"
                    ? "bg-slate-800 text-slate-300"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {activeBots.length} active
              </span>
            </div>

            {activeBots.length === 0 ? (
              <div
                className={`rounded-xl border border-dashed p-10 text-center ${
                  theme === "dark"
                    ? "border-slate-700 bg-slate-800/40 text-slate-400"
                    : "border-slate-300 bg-slate-50 text-slate-500"
                }`}
              >
                <FaRobot className="mx-auto mb-3 text-3xl" />
                No active bots yet. Activate a bot below to unlock automated trading.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {activeBots.map((bot) => (
                  <div
                    key={bot.id}
                    className={`rounded-xl border p-4 ${
                      theme === "dark"
                        ? "border-slate-700 bg-slate-800/60"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={bot.image}
                        alt={bot.name}
                        className="h-14 w-14 rounded-xl object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold">{bot.name}</p>
                        <p className="text-xs text-slate-400">
                          Level {bot.level} • {bot.winRate}% win rate
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-slate-400">Capital</p>
                        <p className="font-semibold">{formatCurrency(bot.price)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">ROI</p>
                        <p className="font-semibold text-emerald-500">+{bot.monthlyRoi}%</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Status</p>
                        <p className="font-semibold text-teal-400">Active</p>
                      </div>
                    </div>
                    <button
                      onClick={() => openDeactivateModal(bot)}
                      disabled={processingBotId === bot.id}
                      className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${
                        processingBotId === bot.id
                          ? "cursor-not-allowed bg-rose-500/70"
                          : "bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <FaPowerOff />
                        {processingBotId === bot.id ? "Processing..." : "Deactivate"}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {BOT_CATALOG.map((bot) => {
            const isActive = purchasedBots.includes(bot.id);
            const isBusy = processingBotId === bot.id;
            const hasFunds = availableBalance >= bot.price;

            return (
              <article
                key={bot.id}
                className={`overflow-hidden rounded-2xl border shadow-lg transition ${
                  theme === "dark"
                    ? "border-slate-700 bg-slate-900"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="relative h-36">
                  <img
                    src={bot.image}
                    alt={bot.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute left-3 top-3 rounded-full bg-black/40 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
                    L{bot.level}
                  </div>
                  {isActive && (
                    <div className="absolute right-3 top-3 rounded-full bg-emerald-500/90 px-2 py-1 text-xs font-semibold text-white">
                      ACTIVE
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-lg font-bold text-white">{bot.name}</h3>
                    <p className="text-xs text-emerald-300">+{bot.monthlyRoi}% est. monthly ROI</p>
                  </div>
                </div>

                <div className="space-y-4 p-4">
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {bot.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-slate-100/80 p-2 dark:bg-slate-800">
                      <p className="text-xs text-slate-400">Investment</p>
                      <p className="font-semibold">{formatCurrency(bot.price)}</p>
                    </div>
                    <div className="rounded-lg bg-slate-100/80 p-2 dark:bg-slate-800">
                      <p className="text-xs text-slate-400">Win Rate</p>
                      <p className="font-semibold">{bot.winRate}%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
                        theme === "dark"
                          ? "bg-slate-800 text-slate-300"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <FaShieldAlt />
                      Risk Managed
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
                        theme === "dark"
                          ? "bg-slate-800 text-slate-300"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <FaChartLine />
                      Algo Engine
                    </span>
                  </div>

                  {!isActive ? (
                    <button
                      onClick={() => openPurchaseModal(bot)}
                      disabled={isBusy || !hasFunds}
                      className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${
                        !hasFunds
                          ? "cursor-not-allowed bg-slate-400"
                          : isBusy
                          ? "cursor-not-allowed bg-cyan-600/70"
                          : "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500"
                      }`}
                      title={
                        !hasFunds
                          ? `Need ${formatCurrency(bot.price)} to activate`
                          : `Activate ${bot.name}`
                      }
                    >
                      <span className="inline-flex items-center gap-2">
                        {isBusy ? <FaSyncAlt className="animate-spin" /> : <FaBolt />}
                        {!hasFunds ? "Insufficient Balance" : "Activate Bot"}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => openDeactivateModal(bot)}
                      disabled={isBusy}
                      className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${
                        isBusy
                          ? "cursor-not-allowed bg-rose-500/70"
                          : "bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <FaPowerOff />
                        {isBusy ? "Processing..." : "Deactivate Bot"}
                      </span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className={`rounded-2xl border p-4 text-sm ${cardSurface}`}>
          <p className="flex items-center gap-2">
            <FaWallet className="text-teal-400" />
            Purchases deduct from available balance and are recorded in transaction history.
          </p>
          <p className="mt-2 flex items-center gap-2">
            <FaSyncAlt className="text-cyan-400" />
            Active bot IDs are synced to local storage for Mining boost integration.
          </p>
        </div>
      </div>

      <BotActionModal
        theme={theme}
        mode={actionModal.mode}
        bot={actionModal.bot}
        onClose={closeActionModal}
        onConfirm={
          actionModal.mode === "purchase"
            ? handleConfirmPurchase
            : handleConfirmDeactivate
        }
        loading={!!processingBotId}
      />

      <BotFeedbackModal
        theme={theme}
        message={feedbackMessage}
        onClose={() => setFeedbackMessage("")}
      />
    </section>
  );
}
