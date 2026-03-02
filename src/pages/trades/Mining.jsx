import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBitcoin, faEthereum } from "@fortawesome/free-brands-svg-icons";
import {
  faArrowTrendUp,
  faBolt,
  faCircle,
  faClock,
  faCoins,
  faGaugeHigh,
  faRobot,
  faTrash,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { useTheme } from "next-themes";
import { useUser } from "../../context/UserContext";
import { useNotifications } from "../../context/NotificationContext";
import { useTransactions } from "../../context/TransactionContext";

const MINING_CYCLE_MS = 3 * 60 * 1000;
const TICK_INTERVAL_MS = 1000;
const TELEMETRY_HISTORY_INTERVAL_MS = 5000;
const TELEMETRY_HISTORY_WINDOW_MS = 5 * 60 * 1000;
const SETTLEMENT_RETRY_MS = 10 * 1000;
const SETTLEMENT_NOTICE_COOLDOWN_MS = 60 * 1000;
const NETWORK_BOOST_PER_ACTIVE_MINER = 0.05;
const FLEET_BOOST_PER_PURCHASED_BOT = 0.02;

const BOT_DATA = [
  { id: 1, name: "3COMMAS", botLevel: "25" },
  { id: 2, name: "CRYPTOHOPPER", botLevel: "30" },
  { id: 3, name: "TRADINGVIEW", botLevel: "20" },
  { id: 4, name: "ZIGNALY", botLevel: "28" },
  { id: 5, name: "SHRIMMPY", botLevel: "35" },
  { id: 6, name: "COINRULE", botLevel: "18" },
  { id: 7, name: "TRADEBOT", botLevel: "25" },
  { id: 8, name: "BITUNIVERSE", botLevel: "32" },
];

const COIN_CONFIG = {
  BTC: {
    name: "Bitcoin",
    price: 30000,
    rate: 0.00000002,
    icon: faBitcoin,
    color: "bg-orange-500",
  },
  ETH: {
    name: "Ethereum",
    price: 2000,
    rate: 0.0000005,
    icon: faEthereum,
    color: "bg-indigo-500",
  },
  LTC: {
    name: "Litecoin",
    price: 90,
    rate: 0.000005,
    icon: faCoins,
    color: "bg-gray-500",
  },
  DOGE: {
    name: "Dogecoin",
    price: 0.12,
    rate: 0.0001,
    icon: faCoins,
    color: "bg-yellow-500",
  },
  SOL: {
    name: "Solana",
    price: 160,
    rate: 0.000001,
    icon: faCoins,
    color: "bg-violet-500",
  },
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizePurchasedBotIds = (value) => {
  if (!Array.isArray(value)) return [];
  const ids = value
    .map((entry) => toNumber(entry))
    .filter((entry) => Number.isInteger(entry) && entry > 0);
  return [...new Set(ids)];
};

const calculateBotCost = (hashRate) => {
  const normalizedHashRate = Math.max(0, toNumber(hashRate));
  return normalizedHashRate / 100;
};

const formatDuration = (milliseconds) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(
      seconds
    ).padStart(2, "0")}s`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(amount));

const formatCompactNumber = (value) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(toNumber(value));

const formatHashRate = (hashRateGh) => {
  const value = toNumber(hashRateGh);
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)} PH/s`;
  if (value >= 1000) return `${(value / 1000).toFixed(2)} TH/s`;
  return `${value.toFixed(0)} GH/s`;
};

const buildLinePath = (points, width, height, valueKey, minValue, maxValue) => {
  if (!points.length) return "";
  const xStep = points.length > 1 ? width / (points.length - 1) : width;
  const valueRange = Math.max(0.000001, maxValue - minValue);

  return points
    .map((point, index) => {
      const x = index * xStep;
      const normalized = (toNumber(point[valueKey]) - minValue) / valueRange;
      const y = height - normalized * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
};

const readPurchasedBotIdsFromStorage = () => {
  try {
    const value = JSON.parse(localStorage.getItem("purchasedBots") || "[]");
    return normalizePurchasedBotIds(value);
  } catch {
    return [];
  }
};

const createMiningBot = ({ id, crypto, hashRate, now }) => ({
  id,
  crypto,
  hashRate,
  active: true,
  createdAt: now,
  lastTickAt: now,
  cycleStartedAt: now,
  cycleDurationMs: MINING_CYCLE_MS,
  totalEarningsCoin: 0,
  totalEarningsUsd: 0,
  cycleEarningsCoin: 0,
  cycleEarningsUsd: 0,
  pendingPayoutUsd: 0,
  cyclesCompleted: 0,
  totalPaidUsd: 0,
  earnings: 0,
});

const sanitizeMiningBot = (bot) => {
  const now = Date.now();
  const crypto = COIN_CONFIG[bot?.crypto] ? bot.crypto : "BTC";
  const createdAt = toNumber(
    bot?.createdAt,
    toNumber(bot?.startTime, toNumber(bot?.id, now))
  );
  const cycleDurationMs = Math.max(
    30000,
    toNumber(bot?.cycleDurationMs, MINING_CYCLE_MS)
  );
  const totalEarningsCoin = toNumber(
    bot?.totalEarningsCoin,
    toNumber(bot?.earnings, 0)
  );
  const totalEarningsUsd = toNumber(bot?.totalEarningsUsd, 0);
  const cycleStartedAt = toNumber(bot?.cycleStartedAt, createdAt);
  const lastTickAt = toNumber(bot?.lastTickAt, cycleStartedAt);

  return {
    id: bot?.id ?? now,
    crypto,
    hashRate: Math.max(100, toNumber(bot?.hashRate, 1000)),
    active: typeof bot?.active === "boolean" ? bot.active : true,
    createdAt,
    // Fallback to cycle start instead of "now" so legacy miners can accrue correctly.
    lastTickAt,
    cycleStartedAt,
    cycleDurationMs,
    totalEarningsCoin,
    totalEarningsUsd,
    cycleEarningsCoin: toNumber(bot?.cycleEarningsCoin, 0),
    cycleEarningsUsd: toNumber(bot?.cycleEarningsUsd, 0),
    pendingPayoutUsd: toNumber(bot?.pendingPayoutUsd, 0),
    cyclesCompleted: Math.max(0, Math.floor(toNumber(bot?.cyclesCompleted, 0))),
    totalPaidUsd: toNumber(bot?.totalPaidUsd, 0),
    earnings: totalEarningsCoin,
  };
};

const useLocalStorage = (key, defaultValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setValue = (valueOrUpdater) => {
    setStoredValue((previousValue) => {
      const nextValue =
        typeof valueOrUpdater === "function"
          ? valueOrUpdater(previousValue)
          : valueOrUpdater;
      try {
        localStorage.setItem(key, JSON.stringify(nextValue));
      } catch {
        // Ignore storage errors.
      }
      return nextValue;
    });
  };

  return [storedValue, setValue];
};

const MiningPage = () => {
  const { theme } = useTheme();
  const { userData, updateUserBalance } = useUser();
  const { addNotification } = useNotifications();
  const { addTransaction } = useTransactions();

  const [bots, setBots] = useLocalStorage("miningBots", []);
  const [purchasedBots, setPurchasedBots] = useLocalStorage("purchasedBots", []);
  const [selectedBoostBotId, setSelectedBoostBotId] = useLocalStorage(
    "activeMiningBoostBotId",
    null
  );
  const [newBotCrypto, setNewBotCrypto] = useState("BTC");
  const [newBotHashRate, setNewBotHashRate] = useState(1000);
  const [isAddingBot, setIsAddingBot] = useState(false);
  const [isSettlingPayout, setIsSettlingPayout] = useState(false);
  const [telemetryNow, setTelemetryNow] = useState(Date.now());
  const [telemetryHistory, setTelemetryHistory] = useState([]);

  const migrationDoneRef = useRef(false);
  const settlementLockedRef = useRef(false);
  const settlementRetryAtRef = useRef(0);
  const lastSettlementNoticeRef = useRef(0);
  const telemetrySnapshotRef = useRef(null);

  const userBalance = toNumber(userData?.balance, 0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetryNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (migrationDoneRef.current) return;
    migrationDoneRef.current = true;

    setBots((previousBots) =>
      Array.isArray(previousBots)
        ? previousBots.map((bot) => sanitizeMiningBot(bot))
        : []
    );
    setPurchasedBots((previous) => normalizePurchasedBotIds(previous));
  }, [setBots, setPurchasedBots]);

  useEffect(() => {
    const syncPurchasedBots = () => {
      setPurchasedBots(readPurchasedBotIdsFromStorage());
    };

    syncPurchasedBots();
    window.addEventListener("focus", syncPurchasedBots);
    return () => window.removeEventListener("focus", syncPurchasedBots);
  }, [setPurchasedBots]);

  const purchasedBoostBots = useMemo(
    () => BOT_DATA.filter((bot) => purchasedBots.includes(bot.id)),
    [purchasedBots]
  );

  const selectedBoostBot = useMemo(
    () =>
      purchasedBoostBots.find(
        (bot) => bot.id === toNumber(selectedBoostBotId, -1)
      ) || null,
    [purchasedBoostBots, selectedBoostBotId]
  );

  useEffect(() => {
    if (
      selectedBoostBotId != null &&
      !purchasedBots.includes(toNumber(selectedBoostBotId, -1))
    ) {
      setSelectedBoostBotId(null);
    }
  }, [selectedBoostBotId, purchasedBots, setSelectedBoostBotId]);

  const activeMiningBotCount = useMemo(
    () => bots.filter((bot) => bot?.active).length,
    [bots]
  );

  const networkBoostMultiplier =
    1 + Math.max(0, activeMiningBotCount - 1) * NETWORK_BOOST_PER_ACTIVE_MINER;
  const fleetBoostMultiplier =
    1 + purchasedBoostBots.length * FLEET_BOOST_PER_PURCHASED_BOT;
  const selectedBoostMultiplier = selectedBoostBot
    ? 1 + toNumber(selectedBoostBot.botLevel) / 100
    : 1;
  const totalBoostMultiplier =
    networkBoostMultiplier * fleetBoostMultiplier * selectedBoostMultiplier;

  const projectedUsdPerHour = useMemo(
    () =>
      bots.reduce((sum, rawBot) => {
        const bot = sanitizeMiningBot(rawBot);
        if (!bot.active) return sum;
        const config = COIN_CONFIG[bot.crypto];
        if (!config) return sum;
        const coinPerSecond = bot.hashRate * config.rate * totalBoostMultiplier;
        return sum + coinPerSecond * config.price * 3600;
      }, 0),
    [bots, totalBoostMultiplier]
  );

  const totalPendingPayoutUsd = useMemo(
    () => bots.reduce((sum, bot) => sum + toNumber(bot.pendingPayoutUsd), 0),
    [bots]
  );

  const totalLiveCycleUsd = useMemo(
    () => bots.reduce((sum, bot) => sum + toNumber(bot.cycleEarningsUsd), 0),
    [bots]
  );

  const totalSettledUsd = useMemo(
    () => bots.reduce((sum, bot) => sum + toNumber(bot.totalPaidUsd), 0),
    [bots]
  );

  const totalCyclesCompleted = useMemo(
    () =>
      bots.reduce(
        (sum, bot) => sum + Math.max(0, Math.floor(toNumber(bot.cyclesCompleted))),
        0
      ),
    [bots]
  );

  const pendingPayoutRows = useMemo(
    () =>
      bots
        .map((bot) => sanitizeMiningBot(bot))
        .filter((bot) => bot.pendingPayoutUsd > 0),
    [bots]
  );

  const activeSanitizedBots = useMemo(
    () =>
      bots
        .map((bot) => sanitizeMiningBot(bot))
        .filter((bot) => bot.active),
    [bots]
  );

  const telemetry = useMemo(() => {
    const now = telemetryNow;
    const totalHashRateGh = activeSanitizedBots.reduce(
      (sum, bot) => sum + toNumber(bot.hashRate),
      0
    );

    const acceptedSharesPerMin = totalHashRateGh * 0.085 * totalBoostMultiplier;
    const rejectedSharesPerMin = acceptedSharesPerMin * 0.012;
    const totalSharesPerMin = acceptedSharesPerMin + rejectedSharesPerMin;
    const acceptanceRate =
      totalSharesPerMin > 0
        ? (acceptedSharesPerMin / totalSharesPerMin) * 100
        : 100;

    const estimatedPowerKw = totalHashRateGh * 0.00065;
    const usdPerKwh =
      estimatedPowerKw > 0 ? projectedUsdPerHour / estimatedPowerKw : 0;

    let aggregateProgress = 0;
    let minCycleRemainingMs = MINING_CYCLE_MS;

    activeSanitizedBots.forEach((bot) => {
      const elapsed = Math.max(0, now - bot.cycleStartedAt);
      const duration = Math.max(30000, toNumber(bot.cycleDurationMs, MINING_CYCLE_MS));
      const cycleProgress = ((elapsed % duration) / duration) * 100;
      const cycleRemainingMs = duration - (elapsed % duration);
      aggregateProgress += cycleProgress;
      minCycleRemainingMs = Math.min(minCycleRemainingMs, cycleRemainingMs);
    });

    const averageCycleProgress =
      activeSanitizedBots.length > 0
        ? aggregateProgress / activeSanitizedBots.length
        : 0;

    const networkDifficultyIndex =
      3.4 +
      activeMiningBotCount * 0.17 +
      purchasedBoostBots.length * 0.11 +
      (totalBoostMultiplier - 1) * 2.8;

    const healthLabel =
      acceptanceRate >= 99
        ? "Excellent"
        : acceptanceRate >= 98
        ? "Stable"
        : "Degraded";

    return {
      totalHashRateGh,
      acceptedSharesPerMin,
      rejectedSharesPerMin,
      acceptanceRate,
      estimatedPowerKw,
      usdPerKwh,
      averageCycleProgress,
      minCycleRemainingMs,
      networkDifficultyIndex,
      healthLabel,
    };
  }, [
    activeMiningBotCount,
    activeSanitizedBots,
    telemetryNow,
    projectedUsdPerHour,
    purchasedBoostBots.length,
    totalBoostMultiplier,
  ]);

  useEffect(() => {
    telemetrySnapshotRef.current = {
      ts: telemetryNow,
      hashRateGh: telemetry.totalHashRateGh,
      hourlyYield: projectedUsdPerHour,
      cycleValue: totalLiveCycleUsd,
      pendingSettlement: totalPendingPayoutUsd,
      shareRate: telemetry.acceptanceRate,
    };
  }, [
    telemetryNow,
    telemetry.totalHashRateGh,
    telemetry.acceptanceRate,
    projectedUsdPerHour,
    totalLiveCycleUsd,
    totalPendingPayoutUsd,
  ]);

  useEffect(() => {
    if (activeMiningBotCount === 0) {
      setTelemetryHistory([]);
      return;
    }

    const capture = () => {
      const snapshot = telemetrySnapshotRef.current;
      if (!snapshot) return;

      setTelemetryHistory((previous) => {
        const next = [...previous, snapshot].filter(
          (point) => snapshot.ts - point.ts <= TELEMETRY_HISTORY_WINDOW_MS
        );
        return next.slice(-120);
      });
    };

    capture();
    const interval = setInterval(capture, TELEMETRY_HISTORY_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [activeMiningBotCount]);

  const tickMiningState = useCallback(
    (previousBots) => {
      if (!Array.isArray(previousBots) || previousBots.length === 0) {
        return previousBots;
      }

      const now = Date.now();
      let changed = false;

      const nextBots = previousBots.map((rawBot) => {
        const bot = sanitizeMiningBot(rawBot);
        const config = COIN_CONFIG[bot.crypto];
        if (!config || !bot.active) return bot;

        const deltaMs = Math.max(0, now - bot.lastTickAt);
        if (deltaMs <= 0) return bot;

        changed = true;

        const cycleDurationMs = Math.max(
          30000,
          toNumber(bot.cycleDurationMs, MINING_CYCLE_MS)
        );
        const coinPerSecond = bot.hashRate * config.rate * totalBoostMultiplier;
        const coinPerMs = coinPerSecond / 1000;
        const coinPrice = toNumber(config.price, 0);

        let remainingMs = deltaMs;
        let lastTickAt = bot.lastTickAt;
        let cycleStartedAt = bot.cycleStartedAt;
        let cycleEarningsCoin = bot.cycleEarningsCoin;
        let cycleEarningsUsd = bot.cycleEarningsUsd;
        let totalEarningsCoin = bot.totalEarningsCoin;
        let totalEarningsUsd = bot.totalEarningsUsd;
        let pendingPayoutUsd = bot.pendingPayoutUsd;
        let cyclesCompleted = bot.cyclesCompleted;

        // Keep cycle position bounded to prevent stale timestamps from causing 1ms loop churn.
        const initialElapsed = Math.max(0, lastTickAt - cycleStartedAt);
        if (initialElapsed >= cycleDurationMs) {
          cycleStartedAt = lastTickAt - (initialElapsed % cycleDurationMs);
        }

        while (remainingMs > 0) {
          const elapsedInCycle = Math.max(0, lastTickAt - cycleStartedAt);
          const cycleTimeLeft = Math.max(1, cycleDurationMs - elapsedInCycle);
          const chunkMs = Math.min(remainingMs, cycleTimeLeft);

          const minedCoin = coinPerMs * chunkMs;
          const minedUsd = minedCoin * coinPrice;

          cycleEarningsCoin += minedCoin;
          cycleEarningsUsd += minedUsd;
          totalEarningsCoin += minedCoin;
          totalEarningsUsd += minedUsd;

          lastTickAt += chunkMs;
          remainingMs -= chunkMs;

          const cycleFinished = lastTickAt - cycleStartedAt >= cycleDurationMs - 1;
          if (cycleFinished) {
            pendingPayoutUsd += cycleEarningsUsd;
            cycleEarningsCoin = 0;
            cycleEarningsUsd = 0;
            cycleStartedAt = lastTickAt;
            cyclesCompleted += 1;
          }
        }

        return {
          ...bot,
          lastTickAt: now,
          cycleStartedAt,
          cycleDurationMs,
          cycleEarningsCoin,
          cycleEarningsUsd,
          totalEarningsCoin,
          totalEarningsUsd,
          pendingPayoutUsd,
          cyclesCompleted,
          earnings: totalEarningsCoin,
        };
      });

      return changed ? nextBots : previousBots;
    },
    [totalBoostMultiplier]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setBots((previousBots) => tickMiningState(previousBots));
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [setBots, tickMiningState]);

  const settlePendingPayouts = useCallback(async () => {
    if (totalPendingPayoutUsd <= 0) return;
    if (settlementLockedRef.current) return;

    const now = Date.now();
    if (now < settlementRetryAtRef.current) return;

    settlementLockedRef.current = true;
    setIsSettlingPayout(true);

    const payoutAmount = Number(totalPendingPayoutUsd.toFixed(6));

    try {
      const balanceResult = await updateUserBalance(payoutAmount);
      if (!balanceResult?.success) {
        throw new Error(balanceResult?.error || "Balance update failed");
      }

      setBots((previousBots) =>
        previousBots.map((rawBot) => {
          const bot = sanitizeMiningBot(rawBot);
          if (bot.pendingPayoutUsd <= 0) return bot;

          return {
            ...bot,
            totalPaidUsd: bot.totalPaidUsd + bot.pendingPayoutUsd,
            pendingPayoutUsd: 0,
          };
        })
      );

      const transactionResult = await addTransaction({
        type: "credit",
        category: "mining",
        amount: payoutAmount,
        status: "completed",
        currency: "USD",
        description: "Mining cycle payout credited",
        metadata: {
          source: "mining-cycle",
          botCount: pendingPayoutRows.length,
          payoutBreakdown: pendingPayoutRows.map((bot) => ({
            botId: bot.id,
            asset: bot.crypto,
            amount: Number(bot.pendingPayoutUsd.toFixed(6)),
          })),
        },
      });

      if (!transactionResult?.success) {
        console.warn("Mining payout transaction log failed");
      }

      settlementRetryAtRef.current = 0;
      toast.success(`Mining payout credited: ${formatCurrency(payoutAmount)}`);
      addNotification(
        `Mining payout credited to balance: ${formatCurrency(payoutAmount)}`,
        "success"
      );
    } catch (error) {
      console.error("Mining payout settlement failed:", error);
      settlementRetryAtRef.current = Date.now() + SETTLEMENT_RETRY_MS;

      if (
        Date.now() - lastSettlementNoticeRef.current >
        SETTLEMENT_NOTICE_COOLDOWN_MS
      ) {
        addNotification(
          "Mining payout queued. Balance sync will retry automatically.",
          "warning"
        );
        lastSettlementNoticeRef.current = Date.now();
      }
    } finally {
      settlementLockedRef.current = false;
      setIsSettlingPayout(false);
    }
  }, [
    addNotification,
    addTransaction,
    pendingPayoutRows,
    setBots,
    totalPendingPayoutUsd,
    updateUserBalance,
  ]);

  useEffect(() => {
    settlePendingPayouts();
  }, [settlePendingPayouts]);

  const getProjectedDailyUsd = (crypto, hashRate) => {
    const config = COIN_CONFIG[crypto];
    if (!config) return 0;
    const baseCoinPerSecond = toNumber(hashRate) * config.rate;
    const boostedCoinPerSecond = baseCoinPerSecond * totalBoostMultiplier;
    return boostedCoinPerSecond * 86400 * config.price;
  };

  const handleAddBot = async () => {
    const hashRate = Math.max(100, toNumber(newBotHashRate));
    const activationCost = calculateBotCost(hashRate);

    if (!userData?.uid) {
      toast.error("Please log in to activate a mining bot.");
      return;
    }

    if (userBalance < activationCost) {
      toast.error(
        `Insufficient balance. You need ${formatCurrency(activationCost)}.`
      );
      return;
    }

    try {
      const balanceResult = await updateUserBalance(-activationCost);
      if (!balanceResult?.success) {
        toast.error(balanceResult?.error || "Failed to activate miner.");
        return;
      }

      const now = Date.now();
      const newBot = createMiningBot({
        id: now,
        crypto: newBotCrypto,
        hashRate,
        now,
      });

      setBots((previousBots) => [newBot, ...previousBots]);
      setIsAddingBot(false);
      setNewBotHashRate(1000);

      await addTransaction({
        type: "debit",
        category: "mining",
        amount: activationCost,
        status: "completed",
        currency: "USD",
        description: `Activated ${newBot.crypto} mining bot`,
        metadata: {
          action: "activate-miner",
          asset: newBot.crypto,
          hashRate: newBot.hashRate,
        },
      });

      toast.success(`Miner activated for ${formatCurrency(activationCost)}.`);
      addNotification(
        `Activated ${newBot.crypto} miner at ${newBot.hashRate} GH/s`,
        "success"
      );
    } catch (error) {
      console.error("Failed to activate mining bot:", error);
      toast.error("An error occurred while activating the miner.");
    }
  };

  const toggleBot = (id) => {
    const now = Date.now();
    let updatedBot = null;

    setBots((previousBots) =>
      previousBots.map((rawBot) => {
        const bot = sanitizeMiningBot(rawBot);
        if (bot.id !== id) return bot;

        const nextActive = !bot.active;
        const cycleDurationMs = Math.max(
          30000,
          toNumber(bot.cycleDurationMs, MINING_CYCLE_MS)
        );
        let nextCycleStartedAt = bot.cycleStartedAt;
        if (nextActive) {
          const frozenElapsed = Math.max(0, bot.lastTickAt - bot.cycleStartedAt);
          const progressInCycle = frozenElapsed % cycleDurationMs;
          // Resume from exact frozen progress instead of "catching up" paused time.
          nextCycleStartedAt = now - progressInCycle;
        }

        updatedBot = {
          ...bot,
          active: nextActive,
          lastTickAt: now,
          cycleStartedAt: nextCycleStartedAt,
        };

        return updatedBot;
      })
    );

    if (updatedBot) {
      const stateText = updatedBot.active ? "resumed" : "paused";
      addNotification(
        `${updatedBot.crypto} miner ${stateText} (${updatedBot.hashRate} GH/s)`,
        "info"
      );
    }
  };

  const deleteBot = (id) => {
    const target = bots.find((bot) => bot.id === id);
    if (!target) return;

    if (toNumber(target.pendingPayoutUsd) > 0) {
      toast.error(
        "This miner has pending payout. Wait for settlement before removal."
      );
      return;
    }

    setBots((previousBots) => previousBots.filter((bot) => bot.id !== id));
    addNotification(`${target.crypto} miner removed`, "info");
  };

  const currentBotCost = calculateBotCost(newBotHashRate);
  const panelClass =
    theme === "dark"
      ? "bg-slate-900/70 border border-slate-700 text-slate-100"
      : "bg-white/90 border border-slate-200 text-slate-900";
  const subTextClass = theme === "dark" ? "text-slate-300" : "text-slate-600";
  const chartPoints = telemetryHistory.length
    ? telemetryHistory
    : [
        {
          ts: telemetryNow,
          hashRateGh: telemetry.totalHashRateGh,
          hourlyYield: projectedUsdPerHour,
          cycleValue: totalLiveCycleUsd,
          pendingSettlement: totalPendingPayoutUsd,
          shareRate: telemetry.acceptanceRate,
        },
      ];

  const hashRateValues = chartPoints.map((point) => toNumber(point.hashRateGh));
  const payoutValues = chartPoints.map((point) => toNumber(point.hourlyYield));
  const hashRateMin = Math.min(...hashRateValues, 0);
  const hashRateMax = Math.max(...hashRateValues, 1);
  const payoutMin = Math.min(...payoutValues, 0);
  const payoutMax = Math.max(...payoutValues, 1);
  const chartWidth = 520;
  const chartHeight = 180;
  const hashRatePath = buildLinePath(
    chartPoints,
    chartWidth,
    chartHeight,
    "hashRateGh",
    hashRateMin,
    hashRateMax
  );
  const payoutPath = buildLinePath(
    chartPoints,
    chartWidth,
    chartHeight,
    "hourlyYield",
    payoutMin,
    payoutMax
  );

  return (
    <div
      className={`min-h-screen px-4 py-10 md:px-8 ${
        theme === "dark"
          ? "bg-[radial-gradient(circle_at_top,_#0f172a,_#020617_60%)]"
          : "bg-[radial-gradient(circle_at_top,_#ecfeff,_#f8fafc_60%)]"
      }`}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        <section className={`${panelClass} rounded-3xl p-6 md:p-8 shadow-2xl`}>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE MINING
                </span>
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                    isSettlingPayout
                      ? "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30"
                      : "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  }`}
                >
                  <FontAwesomeIcon icon={faClock} />
                  {isSettlingPayout ? "Settling payout..." : "Auto settlement on"}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400">
                Mining Control Deck
              </h1>
              <p className={`mt-3 max-w-2xl ${subTextClass}`}>
                Mining is now cycle-based and fully live. Every completed cycle
                is credited directly to your account balance automatically.
              </p>
            </div>

            <div
              className={`rounded-2xl px-5 py-4 min-w-[220px] ${
                theme === "dark"
                  ? "bg-slate-800 border border-slate-700"
                  : "bg-slate-50 border border-slate-200"
              }`}
            >
              <div className={`text-xs uppercase tracking-wider ${subTextClass}`}>
                Available Balance
              </div>
              <div className="text-2xl font-bold text-emerald-500 mt-1">
                {formatCurrency(userBalance)}
              </div>
              <div className={`text-xs mt-2 ${subTextClass}`}>
                Cycle length: {formatDuration(MINING_CYCLE_MS)}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className={`${panelClass} rounded-2xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className={subTextClass}>Projected Hourly Yield</span>
              <FontAwesomeIcon icon={faArrowTrendUp} className="text-cyan-400" />
            </div>
            <div className="text-2xl font-extrabold text-cyan-400">
              {formatCurrency(projectedUsdPerHour)}
            </div>
            <div className={`text-xs mt-2 ${subTextClass}`}>
              Multiplier: x{totalBoostMultiplier.toFixed(2)}
            </div>
          </div>

          <div className={`${panelClass} rounded-2xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className={subTextClass}>Pending Settlement</span>
              <FontAwesomeIcon icon={faWallet} className="text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-amber-400">
              {formatCurrency(totalPendingPayoutUsd)}
            </div>
            <div className={`text-xs mt-2 ${subTextClass}`}>
              Auto-credited after cycle completion
            </div>
          </div>

          <div className={`${panelClass} rounded-2xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className={subTextClass}>Current Cycle Value</span>
              <FontAwesomeIcon icon={faGaugeHigh} className="text-violet-400" />
            </div>
            <div className="text-2xl font-extrabold text-violet-400">
              {formatCurrency(totalLiveCycleUsd)}
            </div>
            <div className={`text-xs mt-2 ${subTextClass}`}>
              In-progress mining rewards
            </div>
          </div>

          <div className={`${panelClass} rounded-2xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className={subTextClass}>Settled + Cycles</span>
              <FontAwesomeIcon icon={faCoins} className="text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400">
              {formatCurrency(totalSettledUsd)}
            </div>
            <div className={`text-xs mt-2 ${subTextClass}`}>
              {totalCyclesCompleted} completed cycles
            </div>
          </div>
        </section>

        {activeMiningBotCount > 0 && (
          <section className={`${panelClass} rounded-3xl p-6`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mb-5">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FontAwesomeIcon icon={faGaugeHigh} className="text-cyan-400" />
                Live Mining Telemetry
              </h2>
              <div className={`text-xs ${subTextClass}`}>
                Updated every {TICK_INTERVAL_MS / 1000}s
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div
                className={`rounded-2xl p-4 ${
                  theme === "dark" ? "bg-slate-800" : "bg-slate-50"
                }`}
              >
                <div className={`text-xs uppercase tracking-wider ${subTextClass}`}>
                  Hash Throughput
                </div>
                <div className="text-2xl font-black text-cyan-400 mt-1">
                  {formatHashRate(telemetry.totalHashRateGh)}
                </div>
                <div className={`text-xs mt-2 ${subTextClass}`}>
                  {activeMiningBotCount} active rigs
                </div>
              </div>

              <div
                className={`rounded-2xl p-4 ${
                  theme === "dark" ? "bg-slate-800" : "bg-slate-50"
                }`}
              >
                <div className={`text-xs uppercase tracking-wider ${subTextClass}`}>
                  Share Quality
                </div>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {telemetry.acceptanceRate.toFixed(2)}%
                </div>
                <div
                  className={`mt-2 h-2 rounded-full overflow-hidden ${
                    theme === "dark" ? "bg-slate-700" : "bg-slate-200"
                  }`}
                >
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                    style={{ width: `${Math.min(100, telemetry.acceptanceRate)}%` }}
                  />
                </div>
                <div className={`text-xs mt-2 ${subTextClass}`}>
                  {formatCompactNumber(telemetry.acceptedSharesPerMin)}/min accepted |{" "}
                  {formatCompactNumber(telemetry.rejectedSharesPerMin)}/min rejected
                </div>
              </div>

              <div
                className={`rounded-2xl p-4 ${
                  theme === "dark" ? "bg-slate-800" : "bg-slate-50"
                }`}
              >
                <div className={`text-xs uppercase tracking-wider ${subTextClass}`}>
                  Network Difficulty
                </div>
                <div className="text-2xl font-black text-violet-400 mt-1">
                  {telemetry.networkDifficultyIndex.toFixed(2)} P
                </div>
                <div className={`text-xs mt-2 ${subTextClass}`}>
                  Difficulty adjusts with active rigs and boost load
                </div>
              </div>

              <div
                className={`rounded-2xl p-4 ${
                  theme === "dark" ? "bg-slate-800" : "bg-slate-50"
                }`}
              >
                <div className={`text-xs uppercase tracking-wider ${subTextClass}`}>
                  Cycle Completion
                </div>
                <div className="text-2xl font-black text-amber-400 mt-1">
                  {telemetry.averageCycleProgress.toFixed(1)}%
                </div>
                <div className={`text-xs mt-2 ${subTextClass}`}>
                  Next payout ETA: {formatDuration(telemetry.minCycleRemainingMs)}
                </div>
              </div>

              <div
                className={`rounded-2xl p-4 ${
                  theme === "dark" ? "bg-slate-800" : "bg-slate-50"
                }`}
              >
                <div className={`text-xs uppercase tracking-wider ${subTextClass}`}>
                  Power & Efficiency
                </div>
                <div className="text-2xl font-black text-sky-400 mt-1">
                  {telemetry.estimatedPowerKw.toFixed(2)} kW
                </div>
                <div className={`text-xs mt-2 ${subTextClass}`}>
                  {formatCurrency(telemetry.usdPerKwh)}/kWh projected output
                </div>
              </div>

              <div
                className={`rounded-2xl p-4 ${
                  theme === "dark" ? "bg-slate-800" : "bg-slate-50"
                }`}
              >
                <div className={`text-xs uppercase tracking-wider ${subTextClass}`}>
                  Rig Health
                </div>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {telemetry.healthLabel}
                </div>
                <div className={`text-xs mt-2 ${subTextClass}`}>
                  Settlement queue: {pendingPayoutRows.length} batch(es) |{" "}
                  {formatCurrency(totalPendingPayoutUsd)}
                </div>
              </div>
            </div>

            <div
              className={`mt-5 rounded-2xl p-4 ${
                theme === "dark" ? "bg-slate-800" : "bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm tracking-wide">
                  Realtime 5m Trend
                </h3>
                <div className={`text-xs ${subTextClass}`}>
                  Hashrate + Hourly Payout Projection
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full min-w-[520px] h-48"
                >
                  <line
                    x1="0"
                    y1={chartHeight * 0.25}
                    x2={chartWidth}
                    y2={chartHeight * 0.25}
                    stroke={theme === "dark" ? "#334155" : "#cbd5e1"}
                    strokeDasharray="4 4"
                  />
                  <line
                    x1="0"
                    y1={chartHeight * 0.5}
                    x2={chartWidth}
                    y2={chartHeight * 0.5}
                    stroke={theme === "dark" ? "#334155" : "#cbd5e1"}
                    strokeDasharray="4 4"
                  />
                  <line
                    x1="0"
                    y1={chartHeight * 0.75}
                    x2={chartWidth}
                    y2={chartHeight * 0.75}
                    stroke={theme === "dark" ? "#334155" : "#cbd5e1"}
                    strokeDasharray="4 4"
                  />

                  <path
                    d={hashRatePath}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={payoutPath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-xs">
                <div className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-400" />
                  <span className={subTextClass}>Hashrate</span>
                </div>
                <div className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className={subTextClass}>Projected hourly payout</span>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className={`${panelClass} rounded-3xl p-6`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FontAwesomeIcon icon={faBolt} className="text-yellow-400" />
              Mining Boost Stack
            </h2>
            <div className={`text-sm ${subTextClass}`}>
              Network x{networkBoostMultiplier.toFixed(2)} | Fleet x
              {fleetBoostMultiplier.toFixed(2)} | Selected x
              {selectedBoostMultiplier.toFixed(2)}
            </div>
          </div>

          {purchasedBoostBots.length === 0 ? (
            <p className={subTextClass}>
              Buy trading bots in the Buy Bots page to unlock extra mining
              multipliers. Each purchased bot adds a permanent fleet boost.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {purchasedBoostBots.map((bot) => {
                  const selected = selectedBoostBot?.id === bot.id;
                  return (
                    <button
                      key={bot.id}
                      onClick={() =>
                        setSelectedBoostBotId(selected ? null : bot.id)
                      }
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        selected
                          ? "bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-lg"
                          : theme === "dark"
                          ? "bg-slate-800 hover:bg-slate-700"
                          : "bg-slate-100 hover:bg-slate-200"
                      }`}
                    >
                      <FontAwesomeIcon icon={faRobot} className="mr-2" />
                      {bot.name} (Lv.{bot.botLevel})
                    </button>
                  );
                })}
              </div>
              <p className={`text-sm ${subTextClass}`}>
                Selected bot boost applies immediately and scales cycle payout.
              </p>
            </div>
          )}
        </section>

        <section className={`${panelClass} rounded-3xl p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Configure New Miner</h2>
            <button
              onClick={() => setIsAddingBot((previous) => !previous)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                isAddingBot
                  ? "bg-rose-600 hover:bg-rose-500 text-white"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
              }`}
            >
              {isAddingBot ? "Close Setup" : "Add Miner"}
            </button>
          </div>

          {isAddingBot && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <label className={`block mb-2 text-sm ${subTextClass}`}>
                  Asset
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(COIN_CONFIG).map(([symbol, config]) => (
                    <button
                      key={symbol}
                      onClick={() => setNewBotCrypto(symbol)}
                      className={`rounded-xl p-3 border transition-all ${
                        newBotCrypto === symbol
                          ? "border-cyan-500 bg-cyan-500/10"
                          : theme === "dark"
                          ? "border-slate-700 bg-slate-800 hover:bg-slate-700"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center ${config.color}`}
                      >
                        <FontAwesomeIcon icon={config.icon} className="text-white" />
                      </div>
                      <div className="mt-2 text-sm font-semibold">{config.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block mb-2 text-sm ${subTextClass}`}>
                  Hash Rate (GH/s)
                </label>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={newBotHashRate}
                  onChange={(event) => setNewBotHashRate(event.target.value)}
                  className="w-full"
                />
                <div className="flex justify-between text-xs mt-2">
                  <span className={subTextClass}>100 GH/s</span>
                  <span className={subTextClass}>10,000 GH/s</span>
                </div>
                <div className="text-3xl font-black mt-4 text-cyan-400">
                  {toNumber(newBotHashRate)} GH/s
                </div>
              </div>

              <div
                className={`rounded-2xl p-4 ${
                  theme === "dark" ? "bg-slate-800" : "bg-slate-50"
                }`}
              >
                <div className={`text-sm ${subTextClass}`}>Estimated Daily Yield</div>
                <div className="text-2xl font-bold text-emerald-500 mt-1">
                  {formatCurrency(
                    getProjectedDailyUsd(newBotCrypto, toNumber(newBotHashRate))
                  )}
                </div>

                <div className={`text-sm mt-4 ${subTextClass}`}>Activation Cost</div>
                <div className="text-2xl font-bold text-rose-500 mt-1">
                  -{formatCurrency(currentBotCost)}
                </div>

                <button
                  onClick={handleAddBot}
                  className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold"
                >
                  Activate Miner
                </button>
              </div>
            </div>
          )}
        </section>

        <section className={`${panelClass} rounded-3xl p-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <h2 className="text-2xl font-bold">Mining Operations</h2>
            <div className={`text-sm ${subTextClass}`}>
              {activeMiningBotCount} active of {bots.length} total miners
            </div>
          </div>

          {bots.length === 0 ? (
            <div
              className={`rounded-2xl p-10 text-center ${
                theme === "dark" ? "bg-slate-800/60" : "bg-slate-50"
              }`}
            >
              <FontAwesomeIcon icon={faRobot} className="text-4xl text-slate-400" />
              <h3 className="mt-4 text-xl font-semibold">No miners active</h3>
              <p className={`mt-2 ${subTextClass}`}>
                Add a mining bot and rewards will start streaming in real time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {bots.map((rawBot) => {
                const bot = sanitizeMiningBot(rawBot);
                const config = COIN_CONFIG[bot.crypto];
                const now = bot.active ? Date.now() : bot.lastTickAt;
                const cycleElapsedMs = Math.max(0, now - bot.cycleStartedAt);
                const cycleDurationMs = Math.max(30000, bot.cycleDurationMs);
                const cycleProgress =
                  ((cycleElapsedMs % cycleDurationMs) / cycleDurationMs) * 100;
                const cycleRemainingMs =
                  cycleDurationMs - (cycleElapsedMs % cycleDurationMs);
                const uptimeMs = Math.max(0, now - bot.createdAt);
                const rateCoinPerSecond =
                  bot.hashRate * (config?.rate || 0) * totalBoostMultiplier;
                const projectedCycleUsd =
                  rateCoinPerSecond * (cycleDurationMs / 1000) * (config?.price || 0);

                return (
                  <article
                    key={bot.id}
                    className={`rounded-2xl p-5 border ${
                      theme === "dark"
                        ? "bg-slate-800 border-slate-700"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${config?.color}`}
                        >
                          <FontAwesomeIcon
                            icon={config?.icon || faCoins}
                            className="text-white text-lg"
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">
                            {config?.name || bot.crypto} Miner
                          </h3>
                          <div className="flex items-center gap-2 text-xs">
                            <span
                              className={`px-2 py-1 rounded-full ${
                                theme === "dark"
                                  ? "bg-slate-700 text-slate-200"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {bot.hashRate} GH/s
                            </span>
                            <FontAwesomeIcon
                              icon={faCircle}
                              className={
                                bot.active ? "text-emerald-500" : "text-slate-400"
                              }
                            />
                            <span className={subTextClass}>
                              {bot.active ? "Active" : "Paused"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleBot(bot.id)}
                          className={`w-9 h-9 rounded-full text-white ${
                            bot.active
                              ? "bg-rose-600 hover:bg-rose-500"
                              : "bg-emerald-600 hover:bg-emerald-500"
                          }`}
                          title={bot.active ? "Pause miner" : "Resume miner"}
                        >
                          <FontAwesomeIcon icon={bot.active ? faCircle : faBolt} />
                        </button>
                        <button
                          onClick={() => deleteBot(bot.id)}
                          className="w-9 h-9 rounded-full bg-slate-500 hover:bg-slate-600 text-white"
                          title="Remove miner"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className={subTextClass}>Cycle countdown</span>
                        <span className="font-semibold text-cyan-400">
                          {formatDuration(cycleRemainingMs)}
                        </span>
                      </div>
                      <div
                        className={`h-2 rounded-full overflow-hidden ${
                          theme === "dark" ? "bg-slate-700" : "bg-slate-200"
                        }`}
                      >
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                          style={{ width: `${cycleProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div
                        className={`rounded-xl p-3 ${
                          theme === "dark" ? "bg-slate-900" : "bg-slate-50"
                        }`}
                      >
                        <div className={subTextClass}>Cycle (USD)</div>
                        <div className="font-bold text-emerald-500">
                          {formatCurrency(bot.cycleEarningsUsd)}
                        </div>
                        <div className={`text-xs ${subTextClass}`}>
                          projected {formatCurrency(projectedCycleUsd)}
                        </div>
                      </div>

                      <div
                        className={`rounded-xl p-3 ${
                          theme === "dark" ? "bg-slate-900" : "bg-slate-50"
                        }`}
                      >
                        <div className={subTextClass}>Pending payout</div>
                        <div className="font-bold text-amber-400">
                          {formatCurrency(bot.pendingPayoutUsd)}
                        </div>
                        <div className={`text-xs ${subTextClass}`}>
                          credited automatically
                        </div>
                      </div>

                      <div
                        className={`rounded-xl p-3 ${
                          theme === "dark" ? "bg-slate-900" : "bg-slate-50"
                        }`}
                      >
                        <div className={subTextClass}>Total mined</div>
                        <div className="font-bold text-cyan-400">
                          {bot.totalEarningsCoin.toFixed(6)} {bot.crypto}
                        </div>
                        <div className={`text-xs ${subTextClass}`}>
                          {formatCurrency(bot.totalEarningsUsd)}
                        </div>
                      </div>

                      <div
                        className={`rounded-xl p-3 ${
                          theme === "dark" ? "bg-slate-900" : "bg-slate-50"
                        }`}
                      >
                        <div className={subTextClass}>Settled</div>
                        <div className="font-bold text-violet-400">
                          {formatCurrency(bot.totalPaidUsd)}
                        </div>
                        <div className={`text-xs ${subTextClass}`}>
                          {Math.floor(toNumber(bot.cyclesCompleted))} cycles
                        </div>
                      </div>
                    </div>

                    <div className={`mt-4 text-xs ${subTextClass}`}>
                      Runtime: {formatDuration(uptimeMs)}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default MiningPage;
