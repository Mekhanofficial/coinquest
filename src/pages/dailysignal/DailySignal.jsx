import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  faSignal,
  faChartLine,
  faCoins,
  faRocket,
  faCrown,
  faGem,
  faStar,
  faCheckCircle,
  faSyncAlt,
  faTimes,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTransactions } from "../../context/TransactionContext";
import { useUser } from "../../context/UserContext";
import { API_BASE_URL } from "../../config/api";
import { Link } from "react-router-dom";

const performanceData = [
  { day: "Mon", value: 10, profit: 120 },
  { day: "Tue", value: 0, profit: 80 },
  { day: "Wed", value: 100, profit: 450 },
  { day: "Thu", value: 30, profit: 210 },
  { day: "Fri", value: 88, profit: 380 },
  { day: "Sat", value: 15, profit: 150 },
  { day: "Sun", value: 115, profit: 510 },
];

const historicalData = [
  { date: "Jan", signals: 23, winRate: 78, profit: 1200 },
  { date: "Feb", signals: 28, winRate: 82, profit: 1850 },
  { date: "Mar", signals: 31, winRate: 85, profit: 2400 },
  { date: "Apr", signals: 26, winRate: 79, profit: 1650 },
  { date: "May", signals: 29, winRate: 83, profit: 2100 },
  { date: "Jun", signals: 34, winRate: 87, profit: 2950 },
];

const SIGNAL_PLANS = [
  {
    id: 1,
    name: "Learn II Trade",
    price: 9899.0,
    active: false,
    winRate: "85%",
    dailySignals: 3,
    description: "Professional trading signals with high accuracy",
    icon: faChartLine,
    color: "from-blue-500 to-cyan-500",
    darkColor: "from-blue-600 to-cyan-600",
    features: [
      "85% Win Rate",
      "3 Daily Signals",
      "24/7 Support",
      "Market Analysis",
    ],
  },
  {
    id: 2,
    name: "AVA TRADE",
    price: 4999.0,
    active: false,
    winRate: "78%",
    dailySignals: 2,
    description: "Reliable signals for consistent profits",
    icon: faCoins,
    color: "from-emerald-500 to-teal-500",
    darkColor: "from-emerald-600 to-teal-600",
    features: [
      "78% Win Rate",
      "2 Daily Signals",
      "Risk Management",
      "Email Alerts",
    ],
  },
  {
    id: 3,
    name: "RoboForex",
    price: 2899.0,
    active: false,
    winRate: "72%",
    dailySignals: 4,
    description: "Automated trading signals powered by AI",
    icon: faRocket,
    color: "from-violet-500 to-purple-500",
    darkColor: "from-violet-600 to-purple-600",
    features: ["72% Win Rate", "4 Daily Signals", "AI Analysis", "Mobile App"],
  },
  {
    id: 4,
    name: "ZERO TO HERO",
    price: 15988.0,
    active: false,
    winRate: "90%",
    dailySignals: 5,
    description: "Premium signals for serious traders",
    icon: faCrown,
    color: "from-teal-500 to-orange-500",
    darkColor: "from-teal-600 to-orange-600",
    features: [
      "90% Win Rate",
      "5 Daily Signals",
      "VIP Support",
      "Advanced Tools",
    ],
  },
  {
    id: 5,
    name: "1000 PIPS",
    price: 1500.0,
    active: false,
    winRate: "65%",
    dailySignals: 1,
    description: "Basic signals for beginners",
    icon: faSignal,
    color: "from-slate-400 to-slate-500",
    darkColor: "from-slate-500 to-slate-600",
    features: [
      "65% Win Rate",
      "1 Daily Signal",
      "Educational Resources",
      "Community Access",
    ],
  },
  {
    id: 6,
    name: "WeTalkTrade",
    price: 10900.0,
    active: false,
    winRate: "82%",
    dailySignals: 3,
    description: "Community-driven trading signals",
    icon: faGem,
    color: "from-rose-500 to-pink-500",
    darkColor: "from-rose-600 to-pink-600",
    features: [
      "82% Win Rate",
      "3 Daily Signals",
      "Live Chat",
      "Expert Sessions",
    ],
  },
];

export default function DailySignalPage() {
  const { theme } = useTheme();
  const [activeSignal, setActiveSignal] = useState(null);
  const [signalBackendId, setSignalBackendId] = useState(null);
  const [isSyncingSignals, setIsSyncingSignals] = useState(false);
  const [showSignalManager, setShowSignalManager] = useState(false);
  const [planAmounts, setPlanAmounts] = useState({});
  const [plans, setPlans] = useState(SIGNAL_PLANS);
  const [activeTab, setActiveTab] = useState("performance");
  const [errors, setErrors] = useState({});
  const [touchedInputs, setTouchedInputs] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { addTransaction } = useTransactions();
  const { userData, updateUserBalance, getAuthToken, isAuthenticated } = useUser();

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

  const mapSignalRecordToPlan = useCallback((record) => {
    const planId = Number(record?.planId);
    let selectedPlan = SIGNAL_PLANS.find((plan) => plan.id === planId) || null;

    if (!selectedPlan && record?.planName) {
      selectedPlan =
        SIGNAL_PLANS.find(
          (plan) =>
            plan.name.toLowerCase() === `${record.planName}`.toLowerCase()
        ) || null;
    }

    if (!selectedPlan) return null;

    return {
      ...selectedPlan,
      active: true,
      purchaseDate:
        record?.purchaseDate || record?.createdAt || new Date().toISOString(),
      amountPaid: Number(record?.amountPaid ?? selectedPlan.price),
      backendId: String(record?._id || record?.id || ""),
    };
  }, []);

  const syncSignalsFromBackend = useCallback(async () => {
    const token = getCleanToken();
    if (!token) return;

    setIsSyncingSignals(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Signal`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const { json: result } = await parseJsonSafely(response);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Failed to sync signal plan.");
      }

      const records = Array.isArray(result?.data) ? result.data : [];
      const activeRecord =
        records.find((item) =>
          `${item?.status || ""}`.toLowerCase().startsWith("active")
        ) || null;

      const mapped = activeRecord ? mapSignalRecordToPlan(activeRecord) : null;
      setActiveSignal(mapped);
      setSignalBackendId(mapped?.backendId || null);
      setPlans(
        SIGNAL_PLANS.map((plan) => ({
          ...plan,
          active: mapped ? mapped.id === plan.id : false,
        }))
      );

      if (mapped) {
        localStorage.setItem("activeSignal", JSON.stringify(mapped));
      } else {
        localStorage.removeItem("activeSignal");
      }
    } catch (error) {
      console.error("Signal sync failed:", error);
      const savedSignal = localStorage.getItem("activeSignal");
      if (savedSignal) {
        try {
          const parsed = JSON.parse(savedSignal);
          setActiveSignal(parsed);
          setPlans(
            SIGNAL_PLANS.map((plan) => ({
              ...plan,
              active: plan.id === parsed.id,
            }))
          );
        } catch {
          setActiveSignal(null);
          setPlans(SIGNAL_PLANS);
        }
      } else {
        setActiveSignal(null);
        setPlans(SIGNAL_PLANS);
      }
    } finally {
      setIsSyncingSignals(false);
    }
  }, [getCleanToken, mapSignalRecordToPlan]);

  useEffect(() => {
    if (!isAuthenticated) return;
    syncSignalsFromBackend();
  }, [isAuthenticated, syncSignalsFromBackend, userData?.userId, userData?.uid]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const handleFocusSync = () => syncSignalsFromBackend();
    window.addEventListener("focus", handleFocusSync);
    return () => window.removeEventListener("focus", handleFocusSync);
  }, [isAuthenticated, syncSignalsFromBackend]);

  const handlePurchase = async (planId) => {
    if (isSyncingSignals) return;
    const selectedPlan = plans.find((plan) => plan.id === planId);
    if (!selectedPlan) return;
    const token = getCleanToken();
    if (!token) {
      setErrors((prev) => ({
        ...prev,
        [planId]: "Session expired. Please log in again.",
      }));
      return;
    }

    const amount = planAmounts[planId] || "";
    const parsedAmount = parseFloat(amount);

    setErrors((prev) => ({ ...prev, [planId]: null }));

    if (!amount) {
      setErrors((prev) => ({
        ...prev,
        [planId]: "Please enter the subscription amount",
      }));
      return;
    }

    if (parsedAmount !== selectedPlan.price) {
      setErrors((prev) => ({
        ...prev,
        [planId]: `Amount must be exactly ${formatCurrency(
          selectedPlan.price
        )}`,
      }));
      return;
    }

    // Check if user has sufficient balance
    if (!userData || userData.balance < parsedAmount) {
      setShowInsufficientModal(true);
      return;
    }

    let debited = false;
    try {
      // Deduct the amount from user's balance
      const balanceResult = await updateUserBalance(-parsedAmount);
      if (!balanceResult.success) {
        setErrors((prev) => ({
          ...prev,
          [planId]:
            balanceResult.error || "Balance update failed. Please try again.",
        }));
        return;
      }
      debited = true;

      // Add transaction record with full signal details
      const transactionResult = await addTransaction({
        type: "Signal",
        amount: parsedAmount,
        description: `Signal subscription: ${selectedPlan.name}`,
        status: "Completed",
        method: selectedPlan.name,
        category: "signals",
        currency: "USD",
        signalDetails: {
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          winRate: selectedPlan.winRate,
          dailySignals: selectedPlan.dailySignals,
          price: selectedPlan.price,
          features: selectedPlan.features,
          description: selectedPlan.description,
        },
      });

      if (!transactionResult?.success) {
        console.warn("Signal transaction logging failed:", transactionResult?.error);
      }

      const signalPayload = {
        provider: selectedPlan.name,
        title: `${selectedPlan.name} Signal Plan`,
        message: selectedPlan.description,
        asset: "MULTI",
        action: "SUBSCRIBE",
        accuracy: parseFloat(selectedPlan.winRate.replace("%", "")) || 0,
        status: "active",
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        amountPaid: parsedAmount,
        purchaseDate: new Date().toISOString(),
        winRate: selectedPlan.winRate,
        dailySignals: selectedPlan.dailySignals,
        description: selectedPlan.description,
        features: selectedPlan.features,
      };

      const response = await fetch(`${API_BASE_URL}/Signal/Create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(signalPayload),
      });

      const { json: result } = await parseJsonSafely(response);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Failed to save signal subscription.");
      }

      const newActiveSignal = {
        ...selectedPlan,
        active: true,
        purchaseDate: signalPayload.purchaseDate,
        amountPaid: parsedAmount,
        backendId: String(result?.data?._id || result?.data?.id || ""),
      };

      setActiveSignal(newActiveSignal);
      setSignalBackendId(newActiveSignal.backendId || null);
      setPlans((prev) =>
        prev.map((plan) => ({
          ...plan,
          active: plan.id === planId,
        }))
      );
      setPlanAmounts((prev) => ({ ...prev, [planId]: "" }));
      localStorage.setItem("activeSignal", JSON.stringify(newActiveSignal));

      setSuccessMessage(
        `Successfully subscribed to ${selectedPlan.name} signal service`
      );
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Purchase failed:", error);
      if (debited) {
        const rollback = await updateUserBalance(parsedAmount);
        if (rollback?.success) {
          await addTransaction({
            type: "Signal",
            amount: parsedAmount,
            description: `Signal subscription rollback: ${selectedPlan.name}`,
            status: "Cancelled",
            method: selectedPlan.name,
            category: "signals",
            currency: "USD",
            signalDetails: {
              planId: selectedPlan.id,
              planName: selectedPlan.name,
            },
          });
        }
      }
      setErrors((prev) => ({
        ...prev,
        [planId]: error?.message || "Purchase failed. Please try again.",
      }));
    }
  };

  const cancelSignal = async () => {
    if (!activeSignal) return;
    const token = getCleanToken();
    if (!token) {
      setSuccessMessage("Session expired. Please log in again.");
      setShowSuccessModal(true);
      return;
    }

    try {
      const backendId =
        signalBackendId || activeSignal?.backendId || null;
      if (backendId) {
        const response = await fetch(`${API_BASE_URL}/Signal/${backendId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ status: "cancelled" }),
        });

        const { json: result } = await parseJsonSafely(response);
        if (!response.ok || !result?.success) {
          throw new Error(result?.message || "Failed to cancel signal service.");
        }
      }

      setActiveSignal(null);
      setSignalBackendId(null);
      setPlans((prev) =>
        prev.map((plan) => ({
          ...plan,
          active: false,
        }))
      );
      localStorage.removeItem("activeSignal");

      // Add cancellation transaction
      const transactionResult = await addTransaction({
        type: "Signal",
        amount: 0,
        description: "Signal subscription cancelled",
        status: "Cancelled",
        method: activeSignal.name,
        category: "signals",
        currency: "USD",
        signalDetails: {
          planId: activeSignal.id,
          planName: activeSignal.name,
        },
      });

      if (!transactionResult?.success) {
        console.warn("Signal cancellation log failed:", transactionResult?.error);
      }

      setSuccessMessage("Signal subscription cancelled successfully");
      setShowSuccessModal(true);
      await syncSignalsFromBackend();
    } catch (error) {
      console.error("Cancellation failed:", error);
      setSuccessMessage(error?.message || "Cancellation failed. Please try again.");
      setShowSuccessModal(true);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const toggleSignalManager = () => {
    setShowSignalManager(!showSignalManager);
  };

  const handleAmountChange = (planId, value) => {
    setPlanAmounts((prev) => ({
      ...prev,
      [planId]: value,
    }));
    setErrors((prev) => ({ ...prev, [planId]: null }));
  };

  const handleInputBlur = (planId) => {
    setTouchedInputs((prev) => ({ ...prev, [planId]: true }));
  };

  const PerformanceTooltip = ({ active, payload, label }) => {
    if (!activeSignal) {
      return (
        <div
          className={`p-3 rounded-lg shadow-lg ${
            theme === "dark" ? "bg-slate-900" : "bg-white"
          } border ${
            theme === "dark" ? "border-slate-700" : "border-gray-200"
          }`}
        >
          <p className="font-bold">Premium Feature</p>
          <p className="text-yellow-500">
            <FontAwesomeIcon icon={faLock} className="mr-2" />
            Subscribe to a signal plan to view detailed performance data
          </p>
        </div>
      );
    }

    if (active && payload && payload.length) {
      return (
        <div
          className={`p-3 rounded-lg shadow-lg ${
            theme === "dark" ? "bg-slate-900" : "bg-white"
          } border ${
            theme === "dark" ? "border-slate-700" : "border-gray-200"
          }`}
        >
          <p className="font-bold">{label}</p>
          <p className="text-blue-500">Performance: {payload[0].value}%</p>
          <p className="text-teal-500">
            Profit: {formatCurrency(payload[1].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const HistoricalTooltip = ({ active, payload, label }) => {
    if (!activeSignal) {
      return (
        <div
          className={`p-3 rounded-lg shadow-lg ${
            theme === "dark" ? "bg-slate-900" : "bg-white"
          } border ${
            theme === "dark" ? "border-slate-700" : "border-gray-200"
          }`}
        >
          <p className="font-bold">Premium Feature</p>
          <p className="text-yellow-500">
            <FontAwesomeIcon icon={faLock} className="mr-2" />
            Subscribe to a signal plan to view historical data
          </p>
        </div>
      );
    }

    if (active && payload && payload.length) {
      return (
        <div
          className={`p-3 rounded-lg shadow-lg ${
            theme === "dark" ? "bg-slate-900" : "bg-white"
          } border ${
            theme === "dark" ? "border-slate-700" : "border-gray-200"
          }`}
        >
          <p className="font-bold">{label}</p>
          <p className="text-blue-500">Signals: {payload[0].value}</p>
          <p className="text-green-500">Win Rate: {payload[1].value}%</p>
          <p className="text-teal-500">
            Profit: {formatCurrency(payload[2].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (activeTab === "performance") {
      return (
        <div className="h-64 relative">
          {!activeSignal && (
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="text-center p-6 bg-black/70 rounded-lg">
                <FontAwesomeIcon
                  icon={faLock}
                  className="text-yellow-400 text-4xl mb-3"
                />
                <h3 className="text-white font-bold text-xl mb-2">
                  Premium Content
                </h3>
                <p className="text-gray-300 mb-4">
                  Subscribe to a signal plan to unlock performance analytics
                </p>
                <button
                  onClick={toggleSignalManager}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-lg font-medium"
                >
                  View Plans
                </button>
              </div>
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={performanceData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tick={{
                  fill: theme === "dark" ? "#cbd5e1" : "#475569",
                }}
              />
              <YAxis
                tick={{
                  fill: theme === "dark" ? "#cbd5e1" : "#475569",
                }}
              />
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme === "dark" ? "#334155" : "#e2e8f0"}
              />
              <Tooltip content={<PerformanceTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#0ea5e9"
                fillOpacity={1}
                fill="url(#colorValue)"
                name="Performance"
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#14b8a6"
                fillOpacity={1}
                fill="url(#colorProfit)"
                name="Profit"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    } else {
      return (
        <div className="h-64 relative">
          {!activeSignal && (
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="text-center p-6 bg-black/70 rounded-lg">
                <FontAwesomeIcon
                  icon={faLock}
                  className="text-yellow-400 text-4xl mb-3"
                />
                <h3 className="text-white font-bold text-xl mb-2">
                  Premium Content
                </h3>
                <p className="text-gray-300 mb-4">
                  Subscribe to a signal plan to unlock historical data
                </p>
                <button
                  onClick={toggleSignalManager}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-lg font-medium"
                >
                  View Plans
                </button>
              </div>
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={historicalData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme === "dark" ? "#334155" : "#e2e8f0"}
              />
              <XAxis
                dataKey="date"
                tick={{
                  fill: theme === "dark" ? "#cbd5e1" : "#475569",
                }}
              />
              <YAxis
                tick={{
                  fill: theme === "dark" ? "#cbd5e1" : "#475569",
                }}
              />
              <Tooltip content={<HistoricalTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="signals"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
              <Line type="monotone" dataKey="winRate" stroke="#82ca9d" />
              <Line type="monotone" dataKey="profit" stroke="#ffc658" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }
  };

  return (
    <>
      <section
        className={`min-h-screen mx-auto px-4 sm:px-6 lg:px-8 py-10 ${
          theme === "dark" ? "bg-zinc-950" : "bg-gray-50"
        }`}
      >
        {/* Signal Stats Card */}
        {isSyncingSignals && (
          <div className="w-full mb-4 text-xs text-cyan-400">
            Syncing signal subscription from backend...
          </div>
        )}
        <div className="w-full mb-10">
          <div
            className={`rounded-xl shadow-xl overflow-hidden ${
              theme === "dark" ? "bg-slate-900" : "bg-white"
            } border ${
              theme === "dark" ? "border-slate-700" : "border-gray-200"
            }`}
          >
            <div className="p-6 flex flex-col md:flex-row gap-6 items-stretch">
              {/* Current Signal Info */}
              <div className="flex-1">
                <div
                  className={`p-5 rounded-xl h-full ${
                    theme === "dark" ? "bg-slate-800" : "bg-slate-50"
                  } border ${
                    theme === "dark" ? "border-slate-700" : "border-slate-200"
                  }`}
                >
                  {activeSignal ? (
                    <>
                      <div className="flex items-center mb-6">
                        <div
                          className={`p-3 rounded-lg ${
                            theme === "dark" ? "bg-blue-900/50" : "bg-blue-100"
                          } mr-4`}
                        >
                          <FontAwesomeIcon
                            icon={activeSignal.icon}
                            className={`h-6 ${
                              theme === "dark"
                                ? "text-blue-400"
                                : "text-blue-600"
                            }`}
                          />
                        </div>
                        <div>
                          <p
                            className={`text-sm ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            Current Signal
                          </p>
                          <h2 className="text-2xl font-bold">
                            {activeSignal.name}
                            <span className="ml-2 text-green-500 text-sm">
                              (Active)
                            </span>
                          </h2>
                        </div>
                      </div>

                      <div
                        className={`p-5 rounded-xl mb-6 ${
                          theme === "dark" ? "bg-slate-800" : "bg-slate-100"
                        }`}
                      >
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p
                              className={`text-sm ${
                                theme === "dark"
                                  ? "text-gray-400"
                                  : "text-gray-600"
                              }`}
                            >
                              Win Rate
                            </p>
                            <p className="text-xl font-bold text-green-500">
                              {activeSignal.winRate}
                            </p>
                          </div>
                          <div>
                            <p
                              className={`text-sm ${
                                theme === "dark"
                                  ? "text-gray-400"
                                  : "text-gray-600"
                              }`}
                            >
                              Daily Signals
                            </p>
                            <p className="text-xl font-bold text-teal-500">
                              {activeSignal.dailySignals}
                            </p>
                          </div>
                          <div>
                            <p
                              className={`text-sm ${
                                theme === "dark"
                                  ? "text-gray-400"
                                  : "text-gray-600"
                              }`}
                            >
                              Price
                            </p>
                            <p className="text-xl font-bold">
                              {formatCurrency(activeSignal.amountPaid)}
                            </p>
                          </div>
                          <div>
                            <p
                              className={`text-sm ${
                                theme === "dark"
                                  ? "text-gray-400"
                                  : "text-gray-600"
                              }`}
                            >
                              Status
                            </p>
                            <p className="text-xl font-bold text-blue-500">
                              Active
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={cancelSignal}
                          className={`w-full py-2 rounded-lg font-medium text-sm ${
                            theme === "dark"
                              ? "bg-red-600 hover:bg-red-700 text-white"
                              : "bg-red-500 hover:bg-red-600 text-white"
                          }`}
                        >
                          Cancel Subscription
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center mb-6">
                        <div
                          className={`p-3 rounded-lg ${
                            theme === "dark" ? "bg-blue-900/50" : "bg-blue-100"
                          } mr-4`}
                        >
                          <FontAwesomeIcon
                            icon={faSignal}
                            className={`h-6 ${
                              theme === "dark"
                                ? "text-blue-400"
                                : "text-blue-600"
                            }`}
                          />
                        </div>
                        <div>
                          <p
                            className={`text-sm ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            Current Signal
                          </p>
                          <h2 className="text-2xl font-bold">
                            <span className="text-gray-400">
                              No Active Signal
                            </span>
                          </h2>
                        </div>
                      </div>

                      <div
                        className={`p-5 rounded-xl text-center mb-6 ${
                          theme === "dark" ? "bg-slate-800" : "bg-slate-100"
                        }`}
                      >
                        <p
                          className={`mb-4 ${
                            theme === "dark" ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          You don't have an active signal service. Subscribe to
                          one of our premium plans below to get started.
                        </p>
                      </div>
                    </>
                  )}

                  <button
                    onClick={toggleSignalManager}
                    className={`w-full py-3 rounded-xl font-medium transition-all ${
                      theme === "dark"
                        ? "bg-gradient-to-r from-teal-600 to-blue-700 hover:from-teal-700 hover:to-blue-800 text-white"
                        : "bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white"
                    }`}
                  >
                    {showSignalManager
                      ? "Hide Signal Manager"
                      : activeSignal
                      ? "Manage Subscription"
                      : "Subscribe to Signal Service"}
                  </button>
                </div>
              </div>

              {/* Performance Chart */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center mb-6">
                  <div
                    className={`p-3 rounded-lg ${
                      theme === "dark" ? "bg-teal-900/50" : "bg-teal-100"
                    } mr-4`}
                  >
                    <FontAwesomeIcon
                      icon={faChartLine}
                      className={`h-6 ${
                        theme === "dark" ? "text-teal-400" : "text-teal-600"
                      }`}
                    />
                  </div>
                  <h3
                    className={`text-xl font-bold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Signal Performance Preview
                  </h3>
                </div>

                {renderChart()}

                <div className="flex mt-4 space-x-4">
                  <button
                    onClick={() => setActiveTab("performance")}
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${
                      activeTab === "performance"
                        ? theme === "dark"
                          ? "bg-teal-600 text-white"
                          : "bg-teal-500 text-white"
                        : theme === "dark"
                        ? "bg-slate-700 text-gray-300"
                        : "bg-slate-200 text-gray-700"
                    }`}
                  >
                    Performance
                  </button>
                  <button
                    onClick={() => setActiveTab("historical")}
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${
                      activeTab === "historical"
                        ? theme === "dark"
                          ? "bg-blue-600 text-white"
                          : "bg-blue-500 text-white"
                        : theme === "dark"
                        ? "bg-slate-700 text-gray-300"
                        : "bg-slate-200 text-gray-700"
                    }`}
                  >
                    Historical Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Signal Manager Panel */}
        {showSignalManager && (
          <div className="w-full mb-12">
            <div
              className={`rounded-xl shadow-xl p-6 ${
                theme === "dark" ? "bg-slate-900" : "bg-white"
              } border ${
                theme === "dark" ? "border-slate-700" : "border-gray-200"
              }`}
            >
              <div className="flex justify-between items-center mb-6">
                <h2
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  Signal Service {activeSignal ? "Management" : "Subscription"}
                </h2>
                <button
                  onClick={toggleSignalManager}
                  className={`p-2 rounded-full ${
                    theme === "dark"
                      ? "hover:bg-slate-700 text-gray-300"
                      : "hover:bg-gray-100 text-gray-500"
                  }`}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              {activeSignal ? (
                <div
                  className={`p-6 rounded-xl ${
                    theme === "dark" ? "bg-slate-800" : "bg-gray-100"
                  }`}
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-teal-500 to-blue-600 flex items-center justify-center mb-4">
                        <FontAwesomeIcon
                          icon={activeSignal.icon}
                          className="h-8 text-white"
                        />
                      </div>
                      <h3
                        className={`text-xl font-bold mb-2 ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {activeSignal.name}
                      </h3>
                      <p
                        className={`mb-4 ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {activeSignal.description}
                      </p>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <p
                            className={`text-sm ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-600"
                            }`}
                          >
                            Win Rate
                          </p>
                          <p className="text-xl font-bold text-green-500">
                            {activeSignal.winRate}
                          </p>
                        </div>
                        <div>
                          <p
                            className={`text-sm ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-600"
                            }`}
                          >
                            Daily Signals
                          </p>
                          <p className="text-xl font-bold text-teal-500">
                            {activeSignal.dailySignals}
                          </p>
                        </div>
                        <div>
                          <p
                            className={`text-sm ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-600"
                            }`}
                          >
                            Price
                          </p>
                          <p className="text-xl font-bold">
                            {formatCurrency(activeSignal.amountPaid)}
                          </p>
                        </div>
                        <div>
                          <p
                            className={`text-sm ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-600"
                            }`}
                          >
                            Status
                          </p>
                          <p className="text-xl font-bold text-blue-500">
                            Active
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={cancelSignal}
                        className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
                          theme === "dark"
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-red-500 hover:bg-red-600"
                        }`}
                      >
                        Cancel Subscription
                      </button>
                    </div>
                    <div className="flex-1">
                      <h4
                        className={`text-lg font-bold mb-4 ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Subscription Details
                      </h4>
                      <div
                        className={`p-4 rounded-lg mb-4 ${
                          theme === "dark" ? "bg-slate-700" : "bg-white"
                        }`}
                      >
                        <p
                          className={`text-sm ${
                            theme === "dark" ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Purchased On
                        </p>
                        <p className="font-medium">
                          {new Date(
                            activeSignal.purchaseDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div
                        className={`p-4 rounded-lg mb-4 ${
                          theme === "dark" ? "bg-slate-700" : "bg-white"
                        }`}
                      >
                        <p
                          className={`text-sm ${
                            theme === "dark" ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Features
                        </p>
                        <ul className="mt-2 space-y-2">
                          {activeSignal.features.map((feature, i) => (
                            <li key={i} className="flex items-start">
                              <FontAwesomeIcon
                                icon={faCheckCircle}
                                className={`mt-1 mr-2 h-4 ${
                                  theme === "dark"
                                    ? "text-blue-400"
                                    : "text-blue-600"
                                }`}
                              />
                              <span
                                className={`${
                                  theme === "dark"
                                    ? "text-gray-300"
                                    : "text-gray-700"
                                }`}
                              >
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={`p-6 rounded-xl text-center ${
                    theme === "dark" ? "bg-slate-800" : "bg-gray-100"
                  }`}
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                    <FontAwesomeIcon
                      icon={faSignal}
                      className="h-8 text-blue-500"
                    />
                  </div>
                  <h3
                    className={`text-xl font-bold mb-2 ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    No Active Signal Service
                  </h3>
                  <p
                    className={`mb-6 max-w-md mx-auto ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    You don't have an active signal service. Subscribe to one of
                    our premium plans to start receiving trading signals.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Signal Plans Grid */}
        <div className="w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Premium Signal Services</h2>
            <p
              className={`text-xl max-w-2xl mx-auto ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Choose the signal service that matches your trading style and
              goals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-xl shadow-xl overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-slate-700 to-slate-900"
                    : "bg-gradient-to-b from-white to-slate-50"
                } border ${
                  plan.active
                    ? theme === "dark"
                      ? "border-teal-500 ring-2 ring-teal-500/50"
                      : "border-teal-400 ring-2 ring-teal-400/50"
                    : theme === "dark"
                    ? "border-slate-600"
                    : "border-gray-200"
                }`}
              >
                {/* Plan Header */}
                <div
                  className={`p-5 bg-gradient-to-r ${
                    theme === "dark" ? plan.darkColor : plan.color
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-2">
                        <FontAwesomeIcon
                          icon={plan.icon}
                          className="h-5 text-white/90 mr-2"
                        />
                        <h3 className="text-xl font-bold text-white">
                          {plan.name}
                        </h3>
                      </div>
                      <h4 className="text-2xl font-bold text-white mb-1">
                        {formatCurrency(plan.price)}
                      </h4>
                      <p className="text-white/80">{plan.description}</p>
                    </div>

                    {plan.id === 4 && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500 text-white">
                        PREMIUM
                      </span>
                    )}
                  </div>
                </div>

                {/* Plan Body */}
                <div className="p-5">
                  <div className="mb-6">
                    <div className="flex justify-between mb-4">
                      <div>
                        <span
                          className={`font-medium ${
                            theme === "dark" ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Win Rate
                        </span>
                        <p className="text-xl font-bold text-green-500">
                          {plan.winRate}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-medium ${
                            theme === "dark" ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Signals/Day
                        </span>
                        <p className="text-xl font-bold text-teal-500">
                          {plan.dailySignals}
                        </p>
                      </div>
                    </div>

                    <h5
                      className={`font-bold mb-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-800"
                      }`}
                    >
                      Key Features
                    </h5>
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            className={`mt-1 mr-2 h-4 ${
                              theme === "dark"
                                ? "text-blue-400"
                                : "text-blue-600"
                            }`}
                          />
                          <span
                            className={`${
                              theme === "dark"
                                ? "text-gray-300"
                                : "text-gray-700"
                            }`}
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4">
                    <label
                      className={`block text-sm font-semibold mb-2 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Amount to Pay (USD)
                    </label>
                    <div className="relative mb-1">
                      <span
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        $
                      </span>
                      <input
                        type="number"
                        value={planAmounts[plan.id] || ""}
                        onChange={(e) =>
                          handleAmountChange(plan.id, e.target.value)
                        }
                        onBlur={() => handleInputBlur(plan.id)}
                        placeholder={plan.price.toString()}
                        className={`w-full rounded-xl px-8 py-3 focus:outline-none focus:ring-2 ${
                          theme === "dark"
                            ? "bg-slate-800 text-white focus:ring-teal-500"
                            : "bg-slate-100 text-gray-900 focus:ring-teal-400"
                        }`}
                      />
                    </div>
                    {errors[plan.id] && (
                      <p className="text-red-500 text-sm mb-3">
                        {errors[plan.id]}
                      </p>
                    )}

                    <button
                      onClick={() => handlePurchase(plan.id)}
                      disabled={plan.active || !planAmounts[plan.id]}
                      className={`w-full py-3 rounded-xl font-bold text-white transition-all duration-300 shadow-lg ${
                        plan.active
                          ? "bg-gradient-to-r from-gray-500 to-gray-600 cursor-not-allowed"
                          : !planAmounts[plan.id]
                          ? "bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed"
                          : theme === "dark"
                          ? "bg-gradient-to-r from-teal-600 to-blue-700 hover:from-teal-700 hover:to-blue-800"
                          : "bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
                      }`}
                    >
                      {plan.active ? "Active Plan" : "Subscribe Now"}
                    </button>

                    {plan.active && (
                      <div className="mt-3 text-center">
                        <span
                          className={`text-sm font-medium ${
                            theme === "dark" ? "text-blue-400" : "text-blue-600"
                          }`}
                        >
                          ✓ Your active signal service
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div
            className={`rounded-2xl p-6 max-w-md w-full mx-4 transform transition-all duration-300 scale-95 animate-scaleIn ${
              theme === "dark" ? "bg-slate-900" : "bg-white"
            } border ${
              theme === "dark" ? "border-slate-700" : "border-gray-200"
            }`}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h2
                className={`text-2xl font-bold mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                Success!
              </h2>

              <p
                className={`mb-6 px-4 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {successMessage}
              </p>

              <button
                onClick={() => setShowSuccessModal(false)}
                className={`w-full py-3 rounded-xl font-medium ${
                  theme === "dark"
                    ? "bg-teal-700 hover:bg-teal-600 text-white"
                    : "bg-teal-600 hover:bg-teal-700 text-white"
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insufficient Funds Modal */}
      {showInsufficientModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div
            className={`rounded-2xl p-6 max-w-md w-full mx-4 transform transition-all duration-300 scale-95 animate-scaleIn ${
              theme === "dark" ? "bg-slate-900" : "bg-white"
            } border ${
              theme === "dark" ? "border-slate-700" : "border-gray-200"
            }`}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <h2
                className={`text-2xl font-bold mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                Insufficient Funds
              </h2>

              <p
                className={`mb-6 px-4 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Your current balance is {formatCurrency(userData?.balance || 0)}
                . Please deposit more funds to subscribe to this signal service.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowInsufficientModal(false)}
                  className={`flex-1 py-3 rounded-xl font-medium ${
                    theme === "dark"
                      ? "bg-slate-700 hover:bg-slate-600 text-white"
                      : "bg-slate-200 hover:bg-slate-300 text-gray-800"
                  }`}
                >
                  Cancel
                </button>
                <Link to={"/deposits"}>
                  <button
                    onClick={() => {
                      setShowInsufficientModal(false);
                    }}
                    className={`flex-1 py-3 rounded-xl font-medium ${
                      theme === "dark"
                        ? "bg-teal-700 hover:bg-teal-600 text-white"
                        : "bg-teal-600 hover:bg-teal-700 text-white"
                    }`}
                  >
                    Deposit Funds
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}
