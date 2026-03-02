import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useUser } from "../../context/UserContext";
import ChartSection from "../../components/PlaceTrade/ChartSection";
import MarketData from "../../components/PlaceTrade/MarketData";
import TradeForm from "../../components/PlaceTrade/TradeForm";
import RecentTrades from "../../components/PlaceTrade/RecentTrades";
import { API_BASE_URL } from "../../config/api";

const formatCurrency = (value) => {
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned) return "";
  const [integerPart, decimalPart] = cleaned.split(".");
  const formattedInteger = integerPart
    .replace(/^0+(?=\d)/, "")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (decimalPart !== undefined) {
    return `${formattedInteger || "0"}.${decimalPart.slice(0, 2)}`;
  }
  return formattedInteger || "0";
};

export default function PlaceTradePage() {
  const { theme } = useTheme();
  const [tradeType, setTradeType] = useState("");
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState("");
  const [activeTab, setActiveTab] = useState("buy");
  const [amount, setAmount] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [duration, setDuration] = useState("5 Minutes");
  const { userData, isAuthenticated, getAuthToken, refreshUser } = useUser();
  const [error, setError] = useState("");
  const [recentTrades, setRecentTrades] = useState([]);
  const [lotSize, setLotSize] = useState(2);

  const tradeAssets = {
    "VIP Trades": ["VIP Asset 1", "VIP Asset 2", "VIP Asset 3"],
    Crypto: ["BTC/USD", "ETH/USD", "ETM/USD"],
    Forex: ["EUR/USD", "GBP/USD", "JPY/USD"],
  };

  const getDurationInMs = (duration) => {
    if (!duration) return 5 * 60 * 1000; // default 5 minutes
    const [value, unit] = duration.split(" ");
    const numValue = parseInt(value);

    switch (unit.toLowerCase()) {
      case "minutes":
        return numValue * 60 * 1000;
      case "hours":
        return numValue * 60 * 60 * 1000;
      case "days":
        return numValue * 24 * 60 * 60 * 1000;
      default:
        return 5 * 60 * 1000;
    }
  };

  const normalizeTrade = (trade) => {
    if (!trade) return trade;
    const createdAt = trade.createdAt || trade.date || trade.startedAt;
    const startTime = trade.startTime || (createdAt ? new Date(createdAt).getTime() : Date.now());
    const durationMs = trade.durationMs || getDurationInMs(trade.duration || duration);
    const status =
      trade.status === "Completed" && trade.result
        ? trade.result
        : trade.status || "Active";

    return {
      id: trade.id || trade._id,
      type: trade.direction || trade.type || "buy",
      tradeType: trade.tradeType,
      asset: trade.asset,
      amount: Number(trade.amount) || 0,
      lotSize: trade.lotSize || "N/A",
      takeProfit: trade.takeProfit || "N/A",
      stopLoss: trade.stopLoss || "N/A",
      duration: trade.duration || "5 Minutes",
      status,
      date: createdAt || new Date().toISOString(),
      startTime,
      durationMs,
      profitLoss: trade.profitLoss || 0,
      userId: trade.user || userData?.userId || userData?.uid || "self",
    };
  };

  useEffect(() => {
    const fetchTrades = async () => {
      if (!isAuthenticated) {
        setRecentTrades([]);
        return;
      }

      const token = getAuthToken?.();
      if (!token) {
        setRecentTrades([]);
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
          const normalized = (result.data || [])
            .map((trade) => normalizeTrade(trade))
            .slice(0, 10);
          setRecentTrades(normalized);
        } else {
          setRecentTrades([]);
        }
      } catch (err) {
        console.error("Failed to fetch trades:", err);
        setRecentTrades([]);
      }
    };

    fetchTrades();
  }, [isAuthenticated, getAuthToken]);

  const handleTradeTypeChange = (e) => {
    const selectedTradeType = e.target.value;
    setTradeType(selectedTradeType);
    setAssets(tradeAssets[selectedTradeType] || []);
    setSelectedAsset("");
  };

  const handleAssetChange = (e) => {
    setSelectedAsset(e.target.value);
  };

  const handlePlaceOrder = async () => {
    setError("");

    if (!isAuthenticated) {
      setError("You must be signed in to place trades.");
      return;
    }

    if (!tradeType) {
      setError("Please select a trade type");
      return;
    }

    if (!selectedAsset) {
      setError("Please select an asset");
      return;
    }

    if (!amount) {
      setError("Please enter an amount");
      return;
    }

    const sanitizedAmount = amount.replace(/,/g, "");
    const numericAmount = parseFloat(sanitizedAmount);

    if (isNaN(numericAmount)) {
      setError("Please enter a valid amount");
      return;
    }

    if (numericAmount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    const userBalance = userData?.balance ?? 0;
    if (userBalance < numericAmount) {
      setError("Insufficient funds. Please deposit to your account.");
      return;
    }

    try {
      const token = getAuthToken?.();
      if (!token) {
        setError("Session expired. Please log in again.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/PlaceTrade/Create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          tradeType,
          asset: selectedAsset,
          amount: numericAmount,
          direction: activeTab,
          lotSize,
          takeProfit,
          stopLoss,
          duration,
          startTime: Date.now(),
          durationMs: getDurationInMs(duration),
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Failed to place trade");
      }

      if (result.data) {
        const createdTrade = normalizeTrade(result.data);
        if (createdTrade) {
          setRecentTrades((prev) => [createdTrade, ...prev].slice(0, 10));
        }
      }
      await refreshUser?.();

      alert(
        `Trade placed successfully! $${numericAmount.toLocaleString()} ${activeTab} order for ${selectedAsset}`
      );

      setAmount("");
      setTakeProfit("");
      setStopLoss("");
      setLotSize(2);
      setDuration("5 Minutes");
    } catch (err) {
      console.error("Place trade error:", err);
      setError(
        err?.message || "Failed to place trade. Please try again later."
      );
    }
  };

  const calculateProgress = (trade) => {
    if (trade.status !== "Active") return 100;
    const now = new Date().getTime();
    const elapsed = now - trade.startTime;
    return Math.min(100, (elapsed / trade.durationMs) * 100);
  };

  const formatTimeRemaining = (trade) => {
    if (trade.status !== "Active") return "Completed";
    const now = new Date().getTime();
    const remaining = trade.startTime + trade.durationMs - now;

    if (remaining <= 0) return "Closing...";

    const minutes = Math.floor(remaining / (60 * 1000));
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

    return `${minutes}m ${seconds}s`;
  };

  return (
    <>
      <section
        className={`min-h-screen px-4 sm:px-10 lg:px-10 py-14 ${
          theme === "dark" ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <h1
            className={`text-2xl font-bold mb-6 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Trading Dashboard
          </h1>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column */}
            <div className="w-full lg:w-[72%] flex flex-col gap-6">
              <ChartSection theme={theme} selectedAsset={selectedAsset} />
              <MarketData theme={theme} />
            </div>

            {/* Right Column */}
            <div className="w-full lg:w-[28%]">
              <TradeForm
                theme={theme}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                tradeType={tradeType}
                handleTradeTypeChange={handleTradeTypeChange}
                assets={assets}
                selectedAsset={selectedAsset}
                handleAssetChange={handleAssetChange}
                amount={amount}
                setAmount={setAmount}
                userData={userData}
                lotSize={lotSize}
                setLotSize={setLotSize}
                takeProfit={takeProfit}
                setTakeProfit={setTakeProfit}
                stopLoss={stopLoss}
                setStopLoss={setStopLoss}
                duration={duration}
                setDuration={setDuration}
                error={error}
                handlePlaceOrder={handlePlaceOrder}
                formatCurrency={formatCurrency}
              />

            
            </div>
            
          </div>
            <RecentTrades
                theme={theme}
                recentTrades={recentTrades}
                calculateProgress={calculateProgress}
                formatTimeRemaining={formatTimeRemaining}
              />
        </div>
      </section>
    </>
  );
}
