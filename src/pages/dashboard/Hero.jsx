import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { useTheme } from "next-themes";
import { Link } from "react-router-dom";
import WelcomeCard from "../../components/dashboard/WelcomeCard";
import BalanceCard from "../../components/dashboard/BalanceCard";
import QuickActions from "../../components/dashboard/QuickAction";
import StatsGrid from "../../components/dashboard/StatsGrid";
import TradeVolumes from "../../components/dashboard/TradeVolumes";
import TradeProgress from "../../components/dashboard/TradeProgress";
import VerifyAccount from "../../components/dashboard/VerifyBar";
import CryptoTiles from "../../components/dashboard/CryptoTiles";
import { useCopyTraders } from "../../context/CopyTraderContext";
import { useUser } from "../../context/UserContext";
import { API_BASE_URL } from "../../config/api";

const abbreviateVolume = (volume) => {
  if (volume >= 1_000_000_000)
    return `$${(volume / 1_000_000_000).toFixed(1)}B`;
  if (volume >= 1_000_000) return `$${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `$${(volume / 1_000).toFixed(1)}K`;
  return `$${volume.toLocaleString()}`;
};

const getDurationInMs = (duration) => {
  if (!duration) return 5 * 60 * 1000;
  if (typeof duration === "number") return duration * 60 * 1000;

  const [value, unit] = `${duration || "5 Minutes"}`.split(" ");
  const numericValue = parseInt(value, 10);

  switch ((unit || "minutes").toLowerCase()) {
    case "minutes":
    case "minute":
      return numericValue * 60 * 1000;
    case "hours":
    case "hour":
      return numericValue * 60 * 60 * 1000;
    case "days":
    case "day":
      return numericValue * 24 * 60 * 60 * 1000;
    default:
      return 5 * 60 * 1000;
  }
};

const normalizeApiTrade = (trade) => {
  const amount = Number(trade?.amount) || 0;
  const createdAt = trade?.createdAt || trade?.date || trade?.startedAt;
  const startTime =
    typeof trade?.startTime === "number"
      ? trade.startTime
      : Number(trade?.startTime) ||
        (createdAt ? new Date(createdAt).getTime() : Date.now());
  const durationMs =
    Number(trade?.durationMs) || getDurationInMs(trade?.duration);
  const elapsed = Math.max(0, Date.now() - startTime);
  const progress = durationMs
    ? Math.min(100, (elapsed / durationMs) * 100)
    : 0;
  const profitLoss = Number(trade?.profitLoss) || 0;
  const rawStatus = (trade?.status || "").toString().toLowerCase();
  const rawResult = (trade?.result || "").toString().toLowerCase();
  const isActive =
    progress < 100 &&
    (rawStatus === "active" || (!rawStatus && !trade?.status));
  const normalizedStatus = isActive
    ? "Active"
    : rawStatus.startsWith("win")
    ? "Win"
    : rawStatus.startsWith("loss")
    ? "Loss"
    : rawStatus === "completed" && rawResult
    ? rawResult === "win"
      ? "Win"
      : rawResult === "loss"
      ? "Loss"
      : "Completed"
    : rawStatus
    ? rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1)
    : progress >= 100
    ? "Completed"
    : "Active";
  const timeRemaining = Math.max(0, durationMs - elapsed);

  return {
    ...trade,
    id: trade?.id || trade?._id || trade?.tradeId,
    type: trade?.direction || trade?.type || "buy",
    amount,
    startTime,
    durationMs,
    progress,
    timeRemaining,
    profitLoss,
    status: normalizedStatus,
    isActive: normalizedStatus === "Active",
  };
};

export default function DashPage() {
  const { theme } = useTheme();
  const { userData, isLoading: userLoading, isAuthenticated, refreshUser, updateUserBalance, getAuthToken } = useUser();

  const CLEARED_TRADES_KEY = "clearedPlaceTrades";
  const getClearedTradeIds = () => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = window.localStorage.getItem(CLEARED_TRADES_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.warn("Failed to parse cleared trades", error);
      return new Set();
    }
  };

  const persistClearedTradeIds = (ids) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        CLEARED_TRADES_KEY,
        JSON.stringify([...ids])
      );
    } catch (error) {
      console.warn("Failed to persist cleared trades", error);
    }
  };

  const addClearedTradeId = (tradeId) => {
    const next = getClearedTradeIds();
    next.add(tradeId);
    persistClearedTradeIds(next);
  };
  
  const [cryptoData, setCryptoData] = useState([]);
  const [kycStatus, setKycStatus] = useState("not_verified");
  const [loading, setLoading] = useState(true);
  const [activeTrades, setActiveTrades] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [placeTrades, setPlaceTrades] = useState([]);

  const {
    tradeVolumes: copiedTradeVolumes,
    totalCopiedTrades,
    tradingStats: copyTraderStats,
    performanceMetrics,
  } = useCopyTraders();

  const fetchPlaceTrades = useCallback(async () => {
    if (!isAuthenticated) {
      setPlaceTrades([]);
      setActiveTrades([]);
      return;
    }

    const token = getAuthToken?.();
    if (!token) {
      setPlaceTrades([]);
      setActiveTrades([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/PlaceTrade`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const result = await response.json();
      if (response.ok && result?.success) {
        const clearedIds = getClearedTradeIds();
        const normalized = (result.data || [])
          .map(normalizeApiTrade)
          .filter((trade) => !clearedIds.has(trade.id));
        setPlaceTrades(normalized);
        setActiveTrades(normalized.filter((trade) => trade.status === "Active"));
      } else {
        setPlaceTrades([]);
        setActiveTrades([]);
      }
    } catch (error) {
      console.error("Failed to fetch place trades:", error);
      setPlaceTrades([]);
      setActiveTrades([]);
    }
  }, [isAuthenticated, getAuthToken, setPlaceTrades, setActiveTrades]);

  useEffect(() => {
    fetchPlaceTrades();
  }, [fetchPlaceTrades, lastUpdate]);

  const totalLiveTrades = activeTrades.length + (copyTraderStats.liveTrades || 0);

  const placeTradeMetrics = useMemo(() => {
    const trades = placeTrades || [];
    const totalTrades = trades.length;
    const totalVolume = trades.reduce(
      (total, trade) => total + (trade.amount || 0),
      0
    );
    const avgTradeSize = totalTrades ? totalVolume / totalTrades : 0;
    const wins = trades.filter((trade) => {
      const status = (trade.status || "").toString().toLowerCase();
      if (status.includes("win")) return true;
      if (status.includes("loss")) return false;
      return (trade.profitLoss || 0) >= 0;
    }).length;
    const winRate = totalTrades ? (wins / totalTrades) * 100 : 0;
    const profitLoss = trades.reduce(
      (sum, trade) => sum + (trade.profitLoss || 0),
      0
    );
    const lossSum = trades.reduce(
      (sum, trade) => sum + Math.max(0, -(trade.profitLoss || 0)),
      0
    );
    const profitFactor =
      lossSum > 0
        ? Math.max(1, profitLoss / lossSum)
        : Math.max(1, Math.abs(profitLoss) || 1);
    const maxDrawdown = Math.min(
      25,
      Math.max(3, (lossSum / Math.max(1, totalVolume)) * 100)
    );

    return {
      totalTrades,
      avgTradeSize,
      winRate,
      profitFactor,
      maxDrawdown,
      totalVolume,
      activeTradesCount: trades.filter((trade) => trade.status === "Active")
        .length,
    };
  }, [placeTrades]);

  const combinedPerformanceMetrics = useMemo(() => {
    const copyCount = copyTraderStats.liveTrades || totalCopiedTrades || 0;
    const placeCount = placeTradeMetrics.totalTrades || 0;
    const totalCount = Math.max(1, copyCount + placeCount);

    const avgTradeSize =
      ((performanceMetrics.avgTradeSize || 0) * copyCount +
        (placeTradeMetrics.avgTradeSize || 0) * placeCount) /
      totalCount;
    const winRate =
      ((performanceMetrics.winRate || 0) * copyCount +
        (placeTradeMetrics.winRate || 0) * placeCount) /
      totalCount;

    return {
      avgTradeSize,
      winRate,
      profitFactor: Math.max(
        performanceMetrics.profitFactor || 1,
        placeTradeMetrics.profitFactor || 1
      ),
      maxDrawdown: Math.max(
        performanceMetrics.maxDrawdown || 0,
        placeTradeMetrics.maxDrawdown || 0
      ),
    };
  }, [
    performanceMetrics,
    copyTraderStats.liveTrades,
    totalCopiedTrades,
    placeTradeMetrics,
  ]);

  const placeTradeSummary = {
    totalTrades: placeTradeMetrics.totalTrades,
    avgTradeSize: placeTradeMetrics.avgTradeSize,
  };

  // Refresh user data manually
  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.warn("No token found for refresh");
        return;
      }

      console.log("🔄 Refreshing user data...");
      await refreshUser();
      setLastUpdate(Date.now());
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  // Get KYC status from UserContext (already fetched from /User/Dashboard)
  const updateKycStatus = () => {
    // 🔥 FIXED: Use userData from UserContext instead of non-existent /Kyc/Status endpoint
    // The KYC status is already available in UserContext from /User/Dashboard
    const kycVerified = userData?.kycVerified || false;
    const kycStatus = userData?.kycStatus || "not_verified";
    
    console.log("✅ KYC status from UserContext:", { kycVerified, kycStatus });
    setKycStatus(kycVerified ? "verified" : kycStatus);
  };

  // Fetch user data and active trades
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          console.log("No token found, setting loading to false");
          setLoading(false);
          return;
        }

        console.log("📊 Fetching user dashboard data...");

        // Update KYC status from UserContext
        updateKycStatus();

        console.log("Dashboard data loaded from backend.");
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch data if user is authenticated and not loading
    if (!userLoading && isAuthenticated) {
      console.log("✅ User authenticated, fetching dashboard data");
      fetchUserData();
    } else if (userLoading) {
      console.log("⏳ User loading, waiting...");
      setLoading(true);
    } else {
      console.log("❌ User not authenticated or loading complete");
      setLoading(false);
    }
  }, [userLoading, isAuthenticated, userData.uid, lastUpdate]);

  // Handle KYC submission success
  useEffect(() => {
    const checkKycSubmission = () => {
      const kycLastSubmitted = localStorage.getItem("kycLastSubmitted");
      if (kycLastSubmitted) {
        // If KYC was submitted recently but status is not verified, set to pending
        if (kycStatus === "not_verified") {
          setKycStatus("pending");
        }
      }
    };

    checkKycSubmission();
  }, [kycStatus]);

  const handleTradeComplete = async (
    tradeId,
    result,
    removeImmediately = false
  ) => {
    if (removeImmediately) {
      addClearedTradeId(tradeId);
      setActiveTrades((prev) => prev.filter((t) => t.id !== tradeId));
      setPlaceTrades((prev) => prev.filter((t) => t.id !== tradeId));
      return;
    }

    // 🔴 TODO: /Trades/Complete endpoint does not exist in API yet
    console.warn(
      "⚠️ Trade completion not yet implemented - /Trades/Complete endpoint missing from API"
    );
    toast.info("Trade completion feature coming soon!");
    return;
    
    /* Original code - disabled until backend implements endpoint
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/Trades/Complete`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tradeId,
          result,
        }),
      });

      if (response.ok) {
        const resultData = await response.json();
        console.log("Trade completed:", resultData);
        
        // Update user balance in context
        if (resultData.newBalance !== undefined) {
          await updateUserBalance(resultData.newBalance - userData.balance);
        }
        
        // Remove from active trades
        if (removeImmediately) {
          setActiveTrades((prev) => prev.filter((t) => t.id !== tradeId));
        }
        
        // Refresh user data
        refreshUserData();
      } else {
        console.error("Failed to complete trade");
      }
    } catch (error) {
      console.error("Error completing trade:", error);
    }
    */
  };

  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        const response = await axios.get(
          "https://api.coingecko.com/api/v3/coins/markets",
          {
            params: {
              vs_currency: "usd",
              ids: "bitcoin,ethereum,tether,ripple,binancecoin,solana,usd-coin,cardano,dogecoin,uniswap,litecoin,chainlink,filecoin,vechain,monero,avalanche-2,polygon",
              order: "market_cap_desc",
              per_page: 22,
              page: 1,
              sparkline: false,
            },
          }
        );

        const formattedData = response.data.map((crypto) => ({
          name: crypto.name,
          symbol: crypto.symbol.toUpperCase(),
          price: `$${crypto.current_price.toLocaleString()}`,
          change: `${crypto.price_change_percentage_24h.toFixed(2)}%`,
          volume: abbreviateVolume(crypto.total_volume),
          image: crypto.image,
        }));

        setCryptoData(formattedData);
      } catch (error) {
        console.error("Error fetching crypto data:", error);
      }
    };

    fetchCryptoData();
  }, []);

  const bgColor = theme === "dark" ? "bg-zinc-950" : "bg-gray-50";
  const cardBg = theme === "dark" ? "bg-slate-900" : "bg-white";
  const borderColor = theme === "dark" ? "border-slate-700" : "border-gray-200";
  const textColor = theme === "dark" ? "text-white" : "text-gray-900";
  const secondaryText = theme === "dark" ? "text-gray-300" : "text-gray-600";

  // Enhanced KYC verification check using backend status
  const isKycVerified = kycStatus === "verified";
  const isKycPending = kycStatus === "pending";

  // Debug authentication state
  console.log("🔍 Dashboard Auth State:", {
    userLoading,
    isAuthenticated,
    userData: {
      email: userData.email,
      uid: userData.uid,
      firstName: userData.firstName,
      name: userData.name
    },
    hasToken: !!localStorage.getItem("authToken")
  });

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated - FIXED: Better authentication check
  if (!isAuthenticated) {
    console.log("🚫 Dashboard: User not authenticated, showing login prompt");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">Please log in to access the dashboard</p>
          <Link 
            to="/login" 
            className="inline-block bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Get user name with proper fallbacks
  const getUserName = () => {
    return userData?.firstName || 
           userData?.name || 
           userData?.displayName || 
           userData?.email?.split('@')[0] || 
           'User';
  };

  const userName = getUserName();

  console.log("🎯 Dashboard rendering for user:", userName);

  return (
      <section
        className={`flex flex-col px-5 py-10 lg:flex-row min-h-screen ${bgColor} ${textColor} overflow-x-hidden`}
      >
        {/* Left Column */}
        <div className="w-full lg:w-1/2 lg:pr-4">
          <WelcomeCard
            theme={theme}
            borderColor={borderColor}
            secondaryText={secondaryText}
          />
          
          <BalanceCard
            balance={userData.balance || 0}
            currency="USD"
            isKycVerified={isKycVerified || isKycPending}
            theme={theme}
            borderColor={borderColor}
            onRefresh={refreshUserData}
          />
          
          {/* KYC Status Banner */}
          {!isKycVerified && !isKycPending && (
            <div
              className={`p-4 my-4 rounded-lg border ${
                theme === "dark"
                  ? "bg-teal-900 border-teal-700 text-teal-100"
                  : "bg-teal-50 border-teal-300 text-teal-800"
              } shadow-md`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    🔒 Complete KYC Verification
                  </p>
                  <p className="text-xs mt-1 opacity-90">
                    Verify your identity to enable deposits, withdrawals, and full trading features.
                  </p>
                </div>
                <Link 
                  to="/kyc-verification" 
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap text-center"
                >
                  Verify Now
                </Link>
              </div>
            </div>
          )}

          {isKycPending && (
            <div
              className={`p-4 my-4 rounded-lg border ${
                theme === "dark"
                  ? "bg-blue-900 border-blue-700 text-blue-100"
                  : "bg-blue-50 border-blue-300 text-blue-800"
              } shadow-md`}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                </div>
                <div className="ml-3">
                  <p className="font-semibold text-sm">
                    KYC Verification Pending
                  </p>
                  <p className="text-xs mt-1 opacity-90">
                    Your documents are under review. You can still access most features.
                  </p>
                </div>
              </div>
            </div>
          )}

          <QuickActions
            theme={theme}
            isKycVerified={isKycVerified || isKycPending}
            balance={userData.balance || 0}
            refreshBalance={refreshUserData}
          />
          <StatsGrid
            theme={theme}
            borderColor={borderColor}
            secondaryText={secondaryText}
            performanceMetrics={combinedPerformanceMetrics}
            liveTrades={totalLiveTrades}
            copiedTrades={totalCopiedTrades}
            placeTradeSummary={placeTradeSummary}
          />
          <TradeVolumes
            theme={theme}
            borderColor={borderColor}
            textColor={textColor}
            secondaryText={secondaryText}
            tradeVolumes={activeTrades.map((t) => t.amount)}
            copiedTradeVolumes={copiedTradeVolumes}
            totalTrades={activeTrades.length}
            totalCopiedTrades={totalCopiedTrades}
            performanceMetrics={combinedPerformanceMetrics}
          />
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-1/2 lg:pl-4">
          <div
            className={`mb-6 p-3 rounded-lg ${cardBg} ${borderColor} border`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${textColor}`}>
                Active Trades
              </h3>
              <button
                onClick={refreshUserData}
                className="text-teal-600 hover:text-teal-700 text-sm font-medium"
              >
                Refresh
              </button>
            </div>
            {activeTrades.length > 0 ? (
              <div className="space-y-4">
                {activeTrades.map((trade) => (
                  <TradeProgress
                    key={trade.id}
                    theme={theme}
                    trade={trade}
                    onComplete={(result) =>
                      handleTradeComplete(trade.id, result)
                    }
                  />
                ))}
              </div>
            ) : (
              <div className={`text-center ${secondaryText} py-8`}>
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="mt-2">No active trades</p>
                <p className="text-sm mt-1">Place a trade to see it here</p>
                {!isKycVerified && !isKycPending && (
                  <p className="text-xs mt-2 text-orange-600">
                    Complete KYC verification to start trading
                  </p>
                )}
              </div>
            )}
          </div>

          <VerifyAccount theme={theme} isKycVerified={isKycVerified || isKycPending} />
          <CryptoTiles
            cryptoData={cryptoData}
            theme={theme}
            borderColor={borderColor}
            secondaryText={secondaryText}
            textColor={textColor}
          />
        </div>
      </section>
  );
}
