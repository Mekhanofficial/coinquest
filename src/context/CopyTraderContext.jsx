"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useUser } from "./UserContext";
import { API_BASE_URL } from "../config/api";

const CopyTradersContext = createContext();

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeTraderId = (value) => {
  if (value === undefined || value === null || value === "") return "";
  const numeric = Number(value);
  if (Number.isFinite(numeric) && String(numeric) === String(value)) {
    return numeric;
  }
  return value;
};

const parseJsonSafely = async (response) => {
  const text = await response.text();
  try {
    return { json: JSON.parse(text), text };
  } catch (error) {
    return { json: null, text };
  }
};

const resetTradingStats = {
  liveTrades: 0,
  lastProfit: 0,
  capital: 0,
  rewards: 0,
};

const getPriceBasedPerformance = (price) => {
  const value = toNumber(price, 0);
  if (value >= 1500) return 26;
  if (value >= 1000) return 20;
  if (value >= 500) return 15;
  if (value >= 250) return 11;
  return 8;
};

const mapRecordToTrader = (record) => {
  const snapshot =
    record?.traderData && typeof record.traderData === "object"
      ? record.traderData
      : {};
  const sourceId = normalizeTraderId(
    record?.sourceTraderId ?? snapshot?.id ?? record?._id ?? ""
  );
  const amount = toNumber(record?.amount, toNumber(snapshot?.investmentAmount, 0));
  const backendId = String(record?._id || record?.id || snapshot?.backendId || "");

  return {
    ...snapshot,
    id: sourceId || backendId,
    sourceTraderId: sourceId || backendId,
    backendId,
    traderName: record?.traderName || snapshot?.name || "Trader",
    name: snapshot?.name || record?.traderName || "Trader",
    investmentAmount: amount,
    amount,
    performance: toNumber(record?.performance, toNumber(snapshot?.performance, 0)),
    status: record?.status || "Active",
    copiedAt: record?.createdAt || snapshot?.copiedAt || new Date().toISOString(),
    image: snapshot?.image || "",
    profitShare: toNumber(snapshot?.profitShare, 0),
    winRate: toNumber(snapshot?.winRate, 0),
    wins: toNumber(snapshot?.wins, 0),
    losses: toNumber(snapshot?.losses, 0),
    balance: toNumber(snapshot?.balance, amount),
    copyPrice: toNumber(snapshot?.copyPrice, amount),
  };
};

export function CopyTradersProvider({ children }) {
  const [copiedTraders, setCopiedTraders] = useState([]);
  const [tradeVolumes, setTradeVolumes] = useState([]);
  const [tradingStats, setTradingStats] = useState(resetTradingStats);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    avgTradeSize: 0,
    winRate: 0,
    profitFactor: 1,
    maxDrawdown: 0,
  });

  const { userData, updateUserBalance, isAuthenticated, getAuthToken } = useUser();

  const getCleanToken = useCallback(() => {
    const token = getAuthToken?.();
    if (!token) return null;
    return token.replace(/^["']|["']$/g, "").trim();
  }, [getAuthToken]);

  const updateStatsFromTraders = useCallback((traders) => {
    const totalCapital = traders.reduce(
      (sum, trader) =>
        sum +
        toNumber(
          trader.investmentAmount ?? trader.balance ?? trader.amount ?? 0,
          0
        ),
      0
    );

    setTradingStats({
      liveTrades: traders.length,
      lastProfit:
        traders.length > 0
          ? toNumber(
              traders[0].investmentAmount ?? traders[0].balance ?? 0,
              0
            ) * 0.1
          : 0,
      capital: totalCapital,
      rewards: traders.length * 5,
    });
  }, []);

  const applyLoadedTraders = useCallback(
    (traders) => {
      setCopiedTraders(traders);
      const volumes = traders
        .map((trader) => toNumber(trader.investmentAmount, 0))
        .filter((amount) => amount > 0)
        .slice(-10);
      setTradeVolumes(volumes);
      updateStatsFromTraders(traders);
    },
    [updateStatsFromTraders]
  );

  const loadCopiedTraders = useCallback(async () => {
    if (!isAuthenticated) return;

    const token = getCleanToken();
    if (!token) {
      applyLoadedTraders([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/CopyTrade`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const { json: result } = await parseJsonSafely(response);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || `Failed to load copy trades (${response.status})`);
      }

      const records = Array.isArray(result?.data) ? result.data : [];
      const traders = records
        .map(mapRecordToTrader)
        .filter((trader) =>
          ["Active", "Paused"].includes(trader.status || "Active")
        );

      applyLoadedTraders(traders);
    } catch (error) {
      console.error("Failed to load copy trades:", error);
      applyLoadedTraders([]);
    }
  }, [isAuthenticated, getCleanToken, applyLoadedTraders]);

  useEffect(() => {
    if (!isAuthenticated) {
      applyLoadedTraders([]);
    }
  }, [isAuthenticated, applyLoadedTraders]);

  useEffect(() => {
    if (!isAuthenticated || !userData?.userId) return;
    loadCopiedTraders();
  }, [isAuthenticated, userData?.userId, loadCopiedTraders]);

  const addCopiedTrader = async (trader, investmentAmount = 100) => {
    const traderId = normalizeTraderId(trader?.id ?? trader?.sourceTraderId);
    if (!traderId) {
      throw new Error("Invalid trader selection.");
    }

    if (copiedTraders.some((t) => t.id === traderId)) {
      return false;
    }

    const amount = toNumber(investmentAmount, 0);
    const traderPrice = toNumber(
      trader?.copyPrice ?? trader?.investmentAmount ?? trader?.amount ?? amount,
      amount
    );
    const basePerformance = toNumber(trader?.performance, 0);
    const derivedPerformance = Math.max(
      basePerformance,
      getPriceBasedPerformance(traderPrice)
    );
    const currentBalance = toNumber(userData?.balance, 0);
    if (currentBalance < amount) {
      throw new Error(
        `Insufficient balance. You need $${amount} but only have $${currentBalance}`
      );
    }

    const token = getCleanToken();
    if (!token) {
      throw new Error("Authentication required. Please log in again.");
    }

    const balanceResult = await updateUserBalance(-amount);
    if (!balanceResult?.success) {
      throw new Error(balanceResult?.error || "Balance update failed. Please try again.");
    }

    const copiedAt = new Date().toISOString();

    try {
      const payload = {
        sourceTraderId: String(traderId),
        traderName: trader?.name || "Trader",
        amount,
        status: "Active",
        performance: derivedPerformance,
        traderData: {
          ...trader,
          id: traderId,
          investmentAmount: amount,
          copyPrice: traderPrice,
          performance: derivedPerformance,
          copiedAt,
        },
      };

      const response = await fetch(`${API_BASE_URL}/CopyTrade/Create`, {
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
        throw new Error(
          result?.message || `Failed to save copied trader (${response.status})`
        );
      }

      const created = result?.data || {};
      const traderWithInvestment = {
        ...trader,
        id: traderId,
        sourceTraderId: traderId,
        backendId: String(created?._id || created?.id || ""),
        traderName: trader?.name || "Trader",
        investmentAmount: amount,
        amount,
        status: created?.status || "Active",
        performance: toNumber(created?.performance, derivedPerformance),
        copyPrice: traderPrice,
        copiedAt: created?.createdAt || copiedAt,
      };

      const updatedTraders = [...copiedTraders, traderWithInvestment];
      setCopiedTraders(updatedTraders);
      setTradeVolumes((prev) => {
        const newVolumes = [...prev];
        if (newVolumes.length >= 10) newVolumes.shift();
        newVolumes.push(amount);
        return newVolumes;
      });
      updateStatsFromTraders(updatedTraders);

      return true;
    } catch (error) {
      await updateUserBalance(amount);
      throw error;
    }
  };

  const removeCopiedTrader = async (id, refundAmount = null) => {
    const traderToRemove = copiedTraders.find((trader) => trader.id === id);
    if (!traderToRemove) {
      return { success: false, error: "Copied trader not found" };
    }

    const token = getCleanToken();
    if (!token) {
      return { success: false, error: "Authentication required. Please log in again." };
    }

    if (traderToRemove.backendId) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/CopyTrade/${traderToRemove.backendId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        const { json: result } = await parseJsonSafely(response);
        if (!response.ok || !result?.success) {
          return {
            success: false,
            error: result?.message || `Failed to close copy trade (${response.status})`,
          };
        }
      } catch (error) {
        return { success: false, error: error.message || "Failed to close copy trade" };
      }
    }

    const updatedTraders = copiedTraders.filter((trader) => trader.id !== id);
    setCopiedTraders(updatedTraders);
    updateStatsFromTraders(updatedTraders);

    const principal = toNumber(
      traderToRemove.investmentAmount ?? traderToRemove.balance ?? traderToRemove.amount,
      0
    );
    const traderPrice = toNumber(
      traderToRemove.copyPrice ?? traderToRemove.investmentAmount ?? principal,
      principal
    );
    const performancePercent = Math.max(
      toNumber(traderToRemove.performance, 0),
      getPriceBasedPerformance(traderPrice)
    );
    const autoSettlement = Math.max(
      0,
      principal + (principal * performancePercent) / 100
    );
    const hasCustomRefund = refundAmount !== null && refundAmount !== undefined;
    const settlementAmount = hasCustomRefund
      ? Math.max(0, toNumber(refundAmount, 0))
      : autoSettlement;

    let balanceResult = { success: true };
    if (settlementAmount > 0) {
      balanceResult = await updateUserBalance(settlementAmount);
      if (!balanceResult?.success) {
        console.warn("Failed to settle copied trader:", balanceResult?.error);
      }
    }

    return {
      success: !!balanceResult?.success,
      settlementAmount,
      principal,
      profitLoss: settlementAmount - principal,
    };
  };

  const updateTradeStats = (amount, isWin) => {
    setTradingStats((prev) => {
      const profit = isWin ? amount * 0.75 : -amount * 0.15;
      return {
        liveTrades: prev.liveTrades + 1,
        lastProfit: profit,
        capital: prev.capital + amount,
        rewards: prev.rewards + (isWin ? amount * 0.1 : 0),
      };
    });
  };

  const getTotalInvested = () => {
    return copiedTraders.reduce(
      (total, trader) =>
        total + toNumber(trader.investmentAmount ?? trader.balance, 0),
      0
    );
  };

  useEffect(() => {
    const totalVolume = tradeVolumes.reduce((sum, value) => sum + value, 0);
    const avgTradeSize = tradeVolumes.length ? totalVolume / tradeVolumes.length : 0;
    const capital = tradingStats.capital || 0;
    const rewards = tradingStats.rewards || 0;
    const profitFactor =
      capital > 0 ? Math.max(0, rewards / Math.max(1, capital - rewards)) : 1;
    const winRate =
      copiedTraders.length > 0
        ? Math.min(99, Math.max(45, (rewards / Math.max(1, capital)) * 100))
        : 67;
    const maxDrawdown = Math.max(
      3,
      Math.min(25, 15 - (tradingStats.lastProfit || 0) * 0.05 + 5)
    );

    setPerformanceMetrics({
      avgTradeSize,
      winRate,
      profitFactor,
      maxDrawdown,
    });
  }, [
    copiedTraders.length,
    tradeVolumes,
    tradingStats.capital,
    tradingStats.rewards,
    tradingStats.lastProfit,
  ]);

  return (
    <CopyTradersContext.Provider
      value={{
        copiedTraders,
        tradeVolumes,
        totalCopiedTrades: copiedTraders.length,
        tradingStats,
        performanceMetrics,
        totalInvested: getTotalInvested(),
        addCopiedTrader,
        removeCopiedTrader,
        updateTradeStats,
        refreshCopiedTraders: loadCopiedTraders,
      }}
    >
      {children}
    </CopyTradersContext.Provider>
  );
}

export function useCopyTraders() {
  return useContext(CopyTradersContext);
}
