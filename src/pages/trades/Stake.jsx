"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "react-toastify";
import { useUser } from "../../context/UserContext";
import { useNotifications } from "../../context/NotificationContext";
import { useTransactions } from "../../context/TransactionContext";
import { API_BASE_URL } from "../../config/api";
import {
  FaCalendarAlt,
  FaChevronRight,
  FaClock,
  FaCoins,
  FaLock,
  FaPercentage,
  FaSync,
  FaWallet,
} from "react-icons/fa";

import cp1 from "../../pictures/cp1.avif";
import cp2 from "../../pictures/cp2.avif";
import cp3 from "../../pictures/cp3.avif";
import cp4 from "../../pictures/cp4.avif";
import cp5 from "../../pictures/cp5.avif";
import cp6 from "../../pictures/cp6.avif";
import cp7 from "../../pictures/cp7.avif";
import cp8 from "../../pictures/cp8.avif";
import cp9 from "../../pictures/cp9.avif";

const STAKING_STORAGE_KEY = "stakingPositionsV2";
const PRICE_REFRESH_MS = 60 * 1000;
const HEARTBEAT_MS = 1000;
const SETTLE_RETRY_MS = 15 * 1000;

const STAKE_ASSETS = [
  { name: "Bitcoin", symbol: "BTC", coingeckoId: "bitcoin", img: cp1, min: 0.001, max: 10, apy: 5.2, color: "bg-orange-500" },
  { name: "Ethereum", symbol: "ETH", coingeckoId: "ethereum", img: cp2, min: 0.01, max: 100, apy: 6.8, color: "bg-purple-500" },
  { name: "Cardano", symbol: "ADA", coingeckoId: "cardano", img: cp3, min: 10, max: 50000, apy: 4.5, color: "bg-blue-600" },
  { name: "Solana", symbol: "SOL", coingeckoId: "solana", img: cp4, min: 0.1, max: 500, apy: 7.2, color: "bg-indigo-500" },
  { name: "Polkadot", symbol: "DOT", coingeckoId: "polkadot", img: cp5, min: 1, max: 5000, apy: 8.1, color: "bg-pink-500" },
  { name: "Avalanche", symbol: "AVAX", coingeckoId: "avalanche-2", img: cp6, min: 0.1, max: 5000, apy: 6.5, color: "bg-red-500" },
  { name: "Chainlink", symbol: "LINK", coingeckoId: "chainlink", img: cp7, min: 1, max: 10000, apy: 5.9, color: "bg-sky-500" },
  { name: "Litecoin", symbol: "LTC", coingeckoId: "litecoin", img: cp8, min: 0.1, max: 1000, apy: 4.8, color: "bg-gray-500" },
  { name: "Ripple", symbol: "XRP", coingeckoId: "ripple", img: cp9, min: 10, max: 100000, apy: 3.7, color: "bg-black" },
];

const COINCAP_ASSET_ID_BY_COINGECKO = {
  "avalanche-2": "avalanche",
  ripple: "xrp",
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(value));

const formatToken = (value, symbol) => `${toNumber(value).toFixed(6)} ${symbol}`;

const useLocalStorage = (key, defaultValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setValue = (valueOrUpdater) => {
    setStoredValue((previous) => {
      const next =
        typeof valueOrUpdater === "function"
          ? valueOrUpdater(previous)
          : valueOrUpdater;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return [storedValue, setValue];
};

const normalizePosition = (raw, assetMap) => {
  const asset = assetMap.get(raw?.asset) || null;
  const durationDays = Math.max(1, Math.floor(toNumber(raw?.durationDays, toNumber(raw?.duration, 30))));
  const startAt = toNumber(raw?.startAt, Date.parse(raw?.startDate || Date.now()));
  const endAt = toNumber(raw?.endAt, Date.parse(raw?.endDate || startAt + durationDays * 86400000));
  const principalUsd = Math.max(0, toNumber(raw?.principalUsd, toNumber(raw?.amountUSD, 0)));
  const apy = toNumber(raw?.apy, toNumber(asset?.apy, 0));
  const rewardUsdTotal = Math.max(
    0,
    toNumber(raw?.rewardUsdTotal, (principalUsd * apy * durationDays) / 36500)
  );

  return {
    id: raw?.id || `stake-${Date.now()}`,
    ref: raw?.ref || `REF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    asset: raw?.asset || asset?.symbol || "BTC",
    coingeckoId: raw?.coingeckoId || asset?.coingeckoId || "bitcoin",
    amountToken: Math.max(0, toNumber(raw?.amountToken, toNumber(raw?.amount, 0))),
    principalUsd,
    apy,
    durationDays,
    startAt,
    endAt,
    rewardUsdTotal,
    status: `${raw?.status || "active"}`.toLowerCase(),
    settledAt: raw?.settledAt || null,
    payoutUsd: Math.max(0, toNumber(raw?.payoutUsd, 0)),
    retryAt: Math.max(0, toNumber(raw?.retryAt, 0)),
    lastError: raw?.lastError || "",
  };
};

export default function StakePage() {
  const { theme } = useTheme();
  const { userData, updateUserBalance, getAuthToken, isAuthenticated } = useUser();
  const { addNotification } = useNotifications();
  const { addTransaction } = useTransactions();

  const [stakingPositions, setStakingPositions] = useLocalStorage(STAKING_STORAGE_KEY, []);
  const [isSyncingStakes, setIsSyncingStakes] = useState(false);
  const [isProcessingStake, setIsProcessingStake] = useState(false);
  const [stakeSyncError, setStakeSyncError] = useState("");
  const [activeTab, setActiveTab] = useState("pools");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [duration, setDuration] = useState(30);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [livePrices, setLivePrices] = useState({});
  const [pricesLoading, setPricesLoading] = useState(false);
  const [priceSyncAt, setPriceSyncAt] = useState(0);
  const [priceError, setPriceError] = useState("");
  const [nowTick, setNowTick] = useState(Date.now());
  const [prefersDarkMode, setPrefersDarkMode] = useState(false);

  const settlingPositionsRef = useRef(new Set());
  const normalizedRef = useRef(false);
  const latestPositionsRef = useRef([]);
  const assetMap = useMemo(
    () => new Map(STAKE_ASSETS.map((asset) => [asset.symbol, asset])),
    []
  );

  useEffect(() => {
    if (normalizedRef.current) return;
    normalizedRef.current = true;
    setStakingPositions((prev) =>
      Array.isArray(prev) ? prev.map((item) => normalizePosition(item, assetMap)) : []
    );
  }, [assetMap, setStakingPositions]);

  useEffect(() => {
    latestPositionsRef.current = Array.isArray(stakingPositions)
      ? stakingPositions
      : [];
  }, [stakingPositions]);

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

  const toBackendStatus = (status) =>
    status === "completed" ? "Completed" : status === "cancelled" ? "Cancelled" : "Active";

  const mapBackendStakeToPosition = useCallback(
    (row) => {
      const startedAt = row?.startedAt ? Date.parse(row.startedAt) : Date.now();
      const durationDays = Math.max(1, Math.floor(toNumber(row?.durationDays, 30)));
      const endAt = row?.endsAt
        ? Date.parse(row.endsAt)
        : startedAt + durationDays * 86400000;

      return normalizePosition(
        {
          id: String(row?._id || row?.id || `stake-${startedAt}`),
          ref: row?.reference || row?.ref,
          asset: row?.asset,
          coingeckoId: row?.coingeckoId,
          amountToken: toNumber(row?.amount),
          principalUsd: toNumber(row?.principalUsd),
          apy: toNumber(row?.apy),
          durationDays,
          startAt: startedAt,
          endAt,
          rewardUsdTotal: toNumber(row?.rewardUsdTotal),
          status: `${row?.status || "Active"}`.toLowerCase(),
          settledAt: row?.settledAt || null,
          payoutUsd: toNumber(row?.payoutUsd),
        },
        assetMap
      );
    },
    [assetMap]
  );

  const buildBackendPayloadFromPosition = useCallback(
    (position) => ({
      asset: position.asset,
      coingeckoId: position.coingeckoId,
      amount: position.amountToken,
      apy: position.apy,
      principalUsd: position.principalUsd,
      durationDays: position.durationDays,
      rewardUsdTotal: position.rewardUsdTotal,
      reference: position.ref,
      startedAt: new Date(position.startAt).toISOString(),
      endsAt: new Date(position.endAt).toISOString(),
      settledAt: position.settledAt || null,
      payoutUsd: toNumber(position.payoutUsd),
      status: toBackendStatus(position.status),
    }),
    []
  );

  const migrateLocalStakesToBackend = useCallback(
    async (token, localPositions) => {
      const migrated = [];
      for (const position of localPositions) {
        try {
          const response = await fetch(`${API_BASE_URL}/Stake/Create`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(buildBackendPayloadFromPosition(position)),
          });
          const { json: result } = await parseJsonSafely(response);
          if (!response.ok || !result?.success) continue;
          migrated.push(mapBackendStakeToPosition(result.data));
        } catch (error) {
          console.warn("Stake migration skipped:", error);
        }
      }
      return migrated;
    },
    [buildBackendPayloadFromPosition, mapBackendStakeToPosition]
  );

  const syncStakesFromBackend = useCallback(async () => {
    const token = getCleanToken();
    if (!token) return;

    setIsSyncingStakes(true);
    setStakeSyncError("");
    try {
      const response = await fetch(`${API_BASE_URL}/Stake`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const { json: result } = await parseJsonSafely(response);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Stake sync failed");
      }

      const rows = Array.isArray(result?.data) ? result.data : [];
      let normalizedRows = rows.map(mapBackendStakeToPosition);

      if (!normalizedRows.length && latestPositionsRef.current.length) {
        normalizedRows = await migrateLocalStakesToBackend(
          token,
          latestPositionsRef.current
        );
      }

      setStakingPositions(normalizedRows);
    } catch (error) {
      console.error("Failed to sync stakes:", error);
      setStakeSyncError("Unable to sync stake records from backend.");
    } finally {
      setIsSyncingStakes(false);
    }
  }, [
    getCleanToken,
    mapBackendStakeToPosition,
    migrateLocalStakesToBackend,
    setStakingPositions,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => setPrefersDarkMode(event.matches);
    setPrefersDarkMode(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    syncStakesFromBackend();
  }, [isAuthenticated, syncStakesFromBackend, userData?.userId, userData?.uid]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const handleFocusSync = () => syncStakesFromBackend();
    window.addEventListener("focus", handleFocusSync);
    return () => window.removeEventListener("focus", handleFocusSync);
  }, [isAuthenticated, syncStakesFromBackend]);

  const fetchLivePrices = useCallback(async () => {
    const ids = STAKE_ASSETS.map((asset) => asset.coingeckoId).join(",");
    setPricesLoading(true);
    setPriceError("");
    try {
      const token = getCleanToken();
      const headers = {
        Accept: "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_BASE_URL}/Market/Prices?ids=${encodeURIComponent(ids)}&vs_currencies=usd`,
        { headers }
      );
      const { json: result } = await parseJsonSafely(response);
      if (!response.ok || !result?.success || typeof result?.data !== "object") {
        throw new Error(
          result?.message || `Backend price sync failed (${response.status})`
        );
      }

      const mapped = {};
      STAKE_ASSETS.forEach((asset) => {
        mapped[asset.symbol] = toNumber(result?.data?.[asset.coingeckoId]?.usd, 0);
      });
      const hasPrice = Object.values(mapped).some((value) => value > 0);
      if (!hasPrice) {
        throw new Error("Backend returned empty market prices");
      }
      setLivePrices(mapped);
      setPriceSyncAt(Date.now());
    } catch (primaryError) {
      try {
        const fallbackIds = STAKE_ASSETS.map(
          (asset) => COINCAP_ASSET_ID_BY_COINGECKO[asset.coingeckoId] || asset.coingeckoId
        ).join(",");
        const fallbackResponse = await fetch(
          `https://api.coincap.io/v2/assets?ids=${encodeURIComponent(fallbackIds)}`
        );
        if (!fallbackResponse.ok) {
          throw new Error(`CoinCap fallback failed (${fallbackResponse.status})`);
        }
        const fallbackData = await fallbackResponse.json();
        const rows = Array.isArray(fallbackData?.data) ? fallbackData.data : [];
        const priceById = new Map(
          rows.map((row) => [String(row?.id || "").toLowerCase(), toNumber(row?.priceUsd, 0)])
        );

        const mapped = {};
        STAKE_ASSETS.forEach((asset) => {
          const coincapId =
            COINCAP_ASSET_ID_BY_COINGECKO[asset.coingeckoId] || asset.coingeckoId;
          mapped[asset.symbol] = toNumber(priceById.get(coincapId), 0);
        });
        const hasFallbackPrice = Object.values(mapped).some((value) => value > 0);
        if (!hasFallbackPrice) {
          throw new Error("CoinCap fallback returned empty market prices");
        }

        setLivePrices(mapped);
        setPriceSyncAt(Date.now());
      } catch (fallbackError) {
        setPriceError("Unable to sync live prices.");
        console.error("Price sync failed:", primaryError, fallbackError);
      }
    } finally {
      setPricesLoading(false);
    }
  }, [getCleanToken]);

  useEffect(() => {
    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, PRICE_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchLivePrices]);

  const computePositionLive = useCallback(
    (position) => {
      const durationMs = Math.max(1, position.durationDays * 86400000);
      const elapsed = Math.max(0, nowTick - position.startAt);
      const progress = Math.min(1, elapsed / durationMs);
      const accruedRewardUsd =
        position.status === "completed"
          ? position.rewardUsdTotal
          : position.rewardUsdTotal * progress;
      const payoutAtMaturity = position.principalUsd + position.rewardUsdTotal;
      const daysLeft = Math.max(0, Math.ceil((position.endAt - nowTick) / 86400000));
      return { progress, accruedRewardUsd, payoutAtMaturity, daysLeft };
    },
    [nowTick]
  );

  const settlePosition = useCallback(
    async (position) => {
      if (settlingPositionsRef.current.has(position.id)) return;
      settlingPositionsRef.current.add(position.id);

      const payoutUsd = position.principalUsd + position.rewardUsdTotal;
      const token = getCleanToken();
      try {
        const balanceResult = await updateUserBalance(payoutUsd);
        if (!balanceResult?.success) {
          throw new Error(balanceResult?.error || "Balance settlement failed");
        }

        let backendSyncError = "";
        if (token) {
          try {
            const response = await fetch(`${API_BASE_URL}/Stake/${position.id}`, {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                status: "Completed",
                settledAt: new Date().toISOString(),
                payoutUsd,
              }),
            });
            const { json: result } = await parseJsonSafely(response);
            if (!response.ok || !result?.success) {
              backendSyncError =
                result?.message || "Stake status synced locally but backend update failed.";
            }
          } catch (syncError) {
            backendSyncError =
              syncError?.message || "Stake status synced locally but backend update failed.";
          }
        } else {
          backendSyncError = "Session unavailable during stake backend update.";
        }

        setStakingPositions((prev) =>
          prev.map((item) =>
            item.id === position.id
              ? {
                  ...item,
                  status: "completed",
                  settledAt: new Date().toISOString(),
                  payoutUsd,
                  retryAt: backendSyncError ? Date.now() + SETTLE_RETRY_MS : 0,
                  lastError: backendSyncError,
                }
              : item
          )
        );

        await addTransaction({
          type: "credit",
          category: "stake",
          amount: payoutUsd,
          status: "completed",
          currency: "USD",
          description: `Stake matured: ${position.asset}`,
          metadata: {
            principalUsd: position.principalUsd,
            rewardUsd: position.rewardUsdTotal,
            durationDays: position.durationDays,
          },
        });

        addNotification(
          `${position.asset} stake matured. ${formatCurrency(position.rewardUsdTotal)} profit credited.`,
          "success"
        );
        if (backendSyncError) {
          toast.warn(backendSyncError);
        } else {
          toast.success(
            `Stake payout completed: ${formatCurrency(payoutUsd)} credited.`
          );
        }
      } catch (error) {
        console.error("Stake settlement failed:", error);
        setStakingPositions((prev) =>
          prev.map((item) =>
            item.id === position.id
                ? {
                    ...item,
                    status: "active",
                    retryAt: Date.now() + SETTLE_RETRY_MS,
                    lastError: error.message || "Settlement failed",
                }
              : item
          )
        );
      } finally {
        settlingPositionsRef.current.delete(position.id);
      }
    },
    [
      addNotification,
      addTransaction,
      getCleanToken,
      setStakingPositions,
      updateUserBalance,
    ]
  );

  useEffect(() => {
    const due = stakingPositions.filter(
      (position) =>
        position.status === "active" &&
        nowTick >= position.endAt &&
        (!position.retryAt || nowTick >= position.retryAt)
    );
    due.forEach((position) => settlePosition(position));
  }, [nowTick, settlePosition, stakingPositions]);

  const estimatedRewardUsd = useMemo(() => {
    if (!selectedAsset) return 0;
    const amountToken = toNumber(stakeAmount, 0);
    const tokenPrice = toNumber(livePrices[selectedAsset.symbol], 0);
    const principalUsd = amountToken * tokenPrice;
    return (principalUsd * selectedAsset.apy * duration) / 36500;
  }, [duration, livePrices, selectedAsset, stakeAmount]);

  const availableBalance = toNumber(userData?.balance, 0);
  const isDarkTheme = theme === "dark" || (theme === "system" && prefersDarkMode);

  const activePositions = useMemo(
    () => stakingPositions.filter((position) => position.status === "active"),
    [stakingPositions]
  );
  const totalStakedUsd = useMemo(
    () =>
      activePositions.reduce(
        (sum, position) => sum + toNumber(position.principalUsd),
        0
      ),
    [activePositions]
  );
  const totalAccruedProfitUsd = useMemo(
    () =>
      activePositions.reduce(
        (sum, position) => sum + computePositionLive(position).accruedRewardUsd,
        0
      ),
    [activePositions, computePositionLive]
  );

  const openStakeModal = (asset) => {
    setSelectedAsset(asset);
    setDuration(30);
    setStakeAmount("");
    setShowStakeModal(true);
  };
  const closeStakeModal = () => {
    setShowStakeModal(false);
    setSelectedAsset(null);
    setStakeAmount("");
  };

  const handleStake = async () => {
    if (isProcessingStake) return;
    if (!selectedAsset) return;

    const token = getCleanToken();
    if (!token) {
      toast.error("Session expired. Please sign in again.");
      return;
    }

    const amountToken = toNumber(stakeAmount, 0);
    const tokenPrice = toNumber(livePrices[selectedAsset.symbol], 0);

    if (!tokenPrice) {
      toast.error("Live price unavailable for this asset. Please retry.");
      return;
    }
    if (
      amountToken < selectedAsset.min ||
      amountToken > selectedAsset.max
    ) {
      toast.error(
        `Stake amount must be between ${selectedAsset.min} and ${selectedAsset.max} ${selectedAsset.symbol}.`
      );
      return;
    }

    const principalUsd = amountToken * tokenPrice;
    if (principalUsd > availableBalance) {
      toast.error(`Insufficient balance. You need ${formatCurrency(principalUsd)}.`);
      return;
    }

    const rewardUsdTotal = (principalUsd * selectedAsset.apy * duration) / 36500;
    const startAt = Date.now();
    const endAt = startAt + duration * 86400000;
    setIsProcessingStake(true);

    let balanceDebited = false;
    try {
      const balanceResult = await updateUserBalance(-principalUsd);
      if (!balanceResult?.success) {
        throw new Error(balanceResult?.error || "Failed to place stake.");
      }
      balanceDebited = true;

      await addTransaction({
        type: "debit",
        category: "stake",
        amount: principalUsd,
        status: "completed",
        currency: "USD",
        description: `Stake opened: ${selectedAsset.symbol}`,
        metadata: { amountToken, apy: selectedAsset.apy, durationDays: duration },
      });

      const payload = {
        asset: selectedAsset.symbol,
        coingeckoId: selectedAsset.coingeckoId,
        amount: amountToken,
        principalUsd,
        apy: selectedAsset.apy,
        durationDays: duration,
        rewardUsdTotal,
        reference: `REF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        startedAt: new Date(startAt).toISOString(),
        endsAt: new Date(endAt).toISOString(),
        status: "Active",
      };

      const response = await fetch(`${API_BASE_URL}/Stake/Create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const { json: result } = await parseJsonSafely(response);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Stake backend sync failed.");
      }

      const position = mapBackendStakeToPosition(result.data);
      setStakingPositions((prev) => [position, ...prev]);

      addNotification(
        `Staked ${formatToken(amountToken, selectedAsset.symbol)} for ${duration} days.`,
        "success"
      );
      toast.success("Stake created successfully.");
      setShowStakeModal(false);
      setStakeAmount("");
    } catch (error) {
      console.error("Stake creation failed:", error);
      if (balanceDebited) {
        const rollback = await updateUserBalance(principalUsd);
        if (rollback?.success) {
          await addTransaction({
            type: "credit",
            category: "stake",
            amount: principalUsd,
            status: "completed",
            currency: "USD",
            description: `Stake rollback: ${selectedAsset.symbol}`,
            metadata: { reason: "stake-create-failed" },
          });
        }
      }
      toast.error(error?.message || "Failed to place stake.");
    } finally {
      setIsProcessingStake(false);
    }
  };

  return (
    <div
      className={`min-h-screen px-4 py-10 sm:px-6 lg:px-8 ${
        isDarkTheme ? "bg-zinc-950" : "bg-gray-50"
      }`}
    >
      <div className="w-full space-y-8">
        <section
          className={`rounded-3xl p-6 ${
            isDarkTheme
              ? "bg-slate-900/70 border border-slate-700 text-white"
              : "bg-white border border-slate-200 text-slate-900"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div
              className={`rounded-2xl p-4 ${
                isDarkTheme ? "bg-slate-800" : "bg-slate-50"
              }`}
            >
              <div className="text-xs uppercase tracking-wide opacity-70">Balance</div>
              <div className="text-2xl font-bold text-emerald-500">
                {formatCurrency(availableBalance)}
              </div>
            </div>
            <div
              className={`rounded-2xl p-4 ${
                isDarkTheme ? "bg-slate-800" : "bg-slate-50"
              }`}
            >
              <div className="text-xs uppercase tracking-wide opacity-70">
                Active Stakes
              </div>
              <div className="text-2xl font-bold text-cyan-400">
                {activePositions.length}
              </div>
            </div>
            <div
              className={`rounded-2xl p-4 ${
                isDarkTheme ? "bg-slate-800" : "bg-slate-50"
              }`}
            >
              <div className="text-xs uppercase tracking-wide opacity-70">Total Staked</div>
              <div className="text-2xl font-bold text-violet-400">
                {formatCurrency(totalStakedUsd)}
              </div>
            </div>
            <div
              className={`rounded-2xl p-4 ${
                isDarkTheme ? "bg-slate-800" : "bg-slate-50"
              }`}
            >
              <div className="text-xs uppercase tracking-wide opacity-70">
                Live Accrued Profit
              </div>
              <div className="text-2xl font-bold text-amber-400">
                {formatCurrency(totalAccruedProfitUsd)}
              </div>
              <div className="text-xs mt-1 opacity-70 flex items-center gap-1">
                <FaSync className={pricesLoading ? "animate-spin" : ""} />{" "}
                {priceSyncAt
                  ? `price sync ${new Date(priceSyncAt).toLocaleTimeString()}`
                  : "syncing prices..."}
              </div>
            </div>
          </div>
          {priceError && (
            <div className="mt-3 text-sm text-rose-400">{priceError}</div>
          )}
          {isSyncingStakes && (
            <div className="mt-2 text-xs text-cyan-400">Syncing stake records...</div>
          )}
          {stakeSyncError && (
            <div className="mt-2 text-xs text-rose-400">{stakeSyncError}</div>
          )}
        </section>

        <section className="flex gap-2 border-b border-teal-800/40 pb-2">
          <button
            onClick={() => setActiveTab("pools")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              activeTab === "pools"
                ? "bg-gradient-to-r from-teal-600 to-cyan-700 text-white"
                : isDarkTheme
                ? "bg-slate-800 text-slate-300"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            Staking Pools
          </button>
          <button
            onClick={() => setActiveTab("positions")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              activeTab === "positions"
                ? "bg-gradient-to-r from-teal-600 to-cyan-700 text-white"
                : isDarkTheme
                ? "bg-slate-800 text-slate-300"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            Your Positions
          </button>
        </section>

        {activeTab === "pools" && (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {STAKE_ASSETS.map((asset) => {
              const livePrice = toNumber(livePrices[asset.symbol], 0);
              return (
                <article
                  key={asset.symbol}
                  className={`rounded-2xl p-5 ${
                    isDarkTheme
                      ? "bg-slate-900/70 border border-slate-700"
                      : "bg-white border border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${asset.color}`}
                    >
                      <img src={asset.img} alt={asset.name} className="w-8 h-8 rounded-full" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{asset.name}</h3>
                      <div className="text-xs opacity-75">{asset.symbol}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div>
                      <div className="opacity-70 flex items-center gap-1">
                        <FaPercentage /> APY
                      </div>
                      <div className="font-bold text-cyan-400">{asset.apy}%</div>
                    </div>
                    <div>
                      <div className="opacity-70 flex items-center gap-1">
                        <FaWallet /> Live Price
                      </div>
                      <div className="font-bold">
                        {livePrice ? formatCurrency(livePrice) : "Unavailable"}
                      </div>
                    </div>
                    <div>
                      <div className="opacity-70 flex items-center gap-1">
                        <FaLock /> Min
                      </div>
                      <div className="font-bold">{asset.min} {asset.symbol}</div>
                    </div>
                    <div>
                      <div className="opacity-70 flex items-center gap-1">
                        <FaCoins /> Max
                      </div>
                      <div className="font-bold">{asset.max} {asset.symbol}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => openStakeModal(asset)}
                    disabled={!livePrice}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${
                      livePrice
                        ? "bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-500 hover:to-cyan-600 text-white"
                        : "bg-slate-500/40 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    Stake Now <FaChevronRight className="text-xs" />
                  </button>
                </article>
              );
            })}
          </section>
        )}

        {activeTab === "positions" && (
          <section
            className={`rounded-2xl p-5 ${
              isDarkTheme
                ? "bg-slate-900/70 border border-slate-700"
                : "bg-white border border-slate-200"
            }`}
          >
            {stakingPositions.length === 0 ? (
              <div className="text-center py-16 opacity-80">
                <FaCoins className="text-4xl mx-auto mb-3 text-cyan-400" />
                <div className="text-lg font-semibold">No staking positions yet</div>
              </div>
            ) : (
              <div className="space-y-4">
                {stakingPositions.map((position) => {
                  const live = computePositionLive(position);
                  const progressPercent = Math.min(100, live.progress * 100);
                  const rewardToken =
                    toNumber(livePrices[position.asset], 0) > 0
                      ? live.accruedRewardUsd / toNumber(livePrices[position.asset], 1)
                      : 0;
                  return (
                    <div
                      key={position.id}
                      className={`rounded-xl p-4 ${
                        isDarkTheme ? "bg-slate-800" : "bg-slate-50"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                        <div>
                          <div className="text-sm opacity-70">Ref: {position.ref}</div>
                          <h3 className="text-lg font-bold">{position.asset} Stake</h3>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            position.status === "completed"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-cyan-500/20 text-cyan-400"
                          }`}
                        >
                          {position.status === "completed"
                            ? "Completed"
                            : `${live.daysLeft}d remaining`}
                        </span>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1 opacity-80">
                          <span>Progress</span>
                          <span>{progressPercent.toFixed(1)}%</span>
                        </div>
                        <div className={`h-2 rounded-full ${isDarkTheme ? "bg-slate-700" : "bg-slate-200"}`}>
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                        <div>
                          <div className="opacity-70">Principal</div>
                          <div className="font-bold">{formatCurrency(position.principalUsd)}</div>
                        </div>
                        <div>
                          <div className="opacity-70">Live Profit</div>
                          <div className="font-bold text-cyan-400">
                            {formatCurrency(live.accruedRewardUsd)}
                          </div>
                        </div>
                        <div>
                          <div className="opacity-70">Profit (Token)</div>
                          <div className="font-bold">{formatToken(rewardToken, position.asset)}</div>
                        </div>
                        <div>
                          <div className="opacity-70">Maturity Payout</div>
                          <div className="font-bold text-emerald-400">
                            {formatCurrency(live.payoutAtMaturity)}
                          </div>
                        </div>
                        <div>
                          <div className="opacity-70 flex items-center gap-1">
                            <FaCalendarAlt /> End
                          </div>
                          <div className="font-bold">
                            {new Date(position.endAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {position.lastError && (
                        <div className="mt-2 text-xs text-rose-400">
                          Settlement retry queued: {position.lastError}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      {showStakeModal && selectedAsset && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-2xl p-5 ${
              isDarkTheme
                ? "bg-slate-900 border border-slate-700 text-white"
                : "bg-white border border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">
                Stake {selectedAsset.name} ({selectedAsset.symbol})
              </h3>
              <button onClick={closeStakeModal} className="text-sm opacity-70 hover:opacity-100">
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm opacity-80">Amount ({selectedAsset.symbol})</label>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(event) => setStakeAmount(event.target.value)}
                  className={`mt-1 w-full rounded-xl border px-4 py-3 ${
                    isDarkTheme
                      ? "bg-slate-800 border-slate-700"
                      : "bg-slate-50 border-slate-300"
                  }`}
                  placeholder={`${selectedAsset.min} - ${selectedAsset.max}`}
                />
              </div>

              <div>
                <label className="text-sm opacity-80 flex items-center gap-2">
                  <FaClock /> Duration
                </label>
                <div className="grid grid-cols-5 gap-2 mt-1">
                  {[7, 14, 30, 60, 90].map((days) => (
                    <button
                      key={days}
                      onClick={() => setDuration(days)}
                      className={`rounded-lg py-2 text-sm ${
                        duration === days
                          ? "bg-gradient-to-r from-teal-600 to-cyan-700 text-white"
                          : isDarkTheme
                          ? "bg-slate-800"
                          : "bg-slate-100"
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>

              <div
                className={`rounded-xl p-4 ${
                  isDarkTheme ? "bg-slate-800" : "bg-slate-50"
                }`}
              >
                <div className="text-sm opacity-80 mb-2">Estimated Reward (Live)</div>
                <div className="text-2xl font-bold text-cyan-400">
                  {formatCurrency(estimatedRewardUsd)}
                </div>
                <div className="text-xs opacity-70 mt-1">
                  Principal uses live market price at stake time.
                </div>
              </div>

              <button
                onClick={handleStake}
                disabled={
                  isProcessingStake || !stakeAmount || toNumber(stakeAmount) <= 0
                }
                className={`w-full py-3 rounded-xl font-bold ${
                  isProcessingStake || !stakeAmount || toNumber(stakeAmount) <= 0
                    ? "bg-slate-500/40 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-500 hover:to-cyan-600 text-white"
                }`}
              >
                {isProcessingStake ? "Processing..." : "Confirm Stake"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
