import { useState, useEffect } from "react";
import { useTransactions } from "../../context/TransactionContext";
import { useTheme } from "next-themes";
import { useUser } from "../../context/UserContext";
import { useNotifications } from "../../context/NotificationContext";
import { toast } from "react-hot-toast";
import { FaBolt, FaChartLine, FaCrown, FaRobot } from "react-icons/fa";

// Images
import bt1 from "../../pictures/bt9.avif";
import bt2 from "../../pictures/bt10.avif";
import bt3 from "../../pictures/bt3.jpg";
import bt4 from "../../pictures/bt4.jpg";
import bt5 from "../../pictures/bt5.png";
import bt6 from "../../pictures/bt6.png";
import bt7 from "../../pictures/bt2.jpg";
import bt8 from "../../pictures/bt8.avif";

// Bot data
const bots = [
  {
    id: 1,
    name: "3COMMAS",
    image: bt1,
    profitRate: "25%",
    amount: "$750",
    botLevel: "25",
    winRate: "20%",
  },
  {
    id: 2,
    name: "CRYPTOHOPPER",
    image: bt2,
    profitRate: "30%",
    amount: "$1000",
    botLevel: "30",
    winRate: "25%",
  },
  {
    id: 3,
    name: "TRADINGVIEW",
    image: bt3,
    profitRate: "22%",
    amount: "$600",
    botLevel: "20",
    winRate: "18%",
  },
  {
    id: 4,
    name: "ZIGNALY",
    image: bt4,
    profitRate: "28%",
    amount: "$900",
    botLevel: "28",
    winRate: "22%",
  },
  {
    id: 5,
    name: "SHRIMMPY",
    image: bt5,
    profitRate: "35%",
    amount: "$1200",
    botLevel: "35",
    winRate: "30%",
  },
  {
    id: 6,
    name: "COINRULE",
    image: bt6,
    profitRate: "20%",
    amount: "$500",
    botLevel: "18",
    winRate: "15%",
  },
  {
    id: 7,
    name: "TRADEBOT",
    image: bt7,
    profitRate: "27%",
    amount: "$850",
    botLevel: "25",
    winRate: "20%",
  },
  {
    id: 8,
    name: "BITUNIVERSE",
    image: bt8,
    profitRate: "33%",
    amount: "$1100",
    botLevel: "32",
    winRate: "28%",
  },
];

export default function BuyBotPage() {
  const { theme } = useTheme();
  const { addTransaction } = useTransactions();
  const { userData, updateUserBalance } = useUser();
  const { addNotification } = useNotifications();

  const [purchasedBots, setPurchasedBots] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showManager, setShowManager] = useState(false);

  // Load purchased bots from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("purchasedBots");
    if (stored) setPurchasedBots(JSON.parse(stored));
  }, []);

  // Save purchased bots to localStorage
  useEffect(() => {
    localStorage.setItem("purchasedBots", JSON.stringify(purchasedBots));
  }, [purchasedBots]);

  const handlePurchase = async (id) => {
    const bot = bots.find((b) => b.id === id);
    if (!bot) return; // Bot not found

    if (!userData) {
      toast.error("Please log in to purchase bots.");
      return;
    }

    const botAmount = parseFloat(bot.amount.replace(/[^0-9.-]+/g, ""));
    const currentBalance = userData.balance || 0;

    if (currentBalance < botAmount) {
      toast.error("Insufficient funds to purchase this bot.");
      return;
    }

    if (!purchasedBots.includes(id)) {
      // Optimistically update UI (can be reverted if there's an error)
      setPurchasedBots((prev) => [...prev, id]);

      try {
        // Await the balance update to ensure it completes before proceeding
        const balanceResult = await updateUserBalance(-botAmount);
        if (!balanceResult?.success) {
          setPurchasedBots((prev) => prev.filter((botId) => botId !== id)); // Revert
          toast.error(
            balanceResult?.error ||
              `Failed to purchase ${bot.name}. Please try again.`
          );
          return;
        }

        const transactionResult = await addTransaction({
          type: "debit",
          amount: bot.amount,
          description: `Bot purchase: ${bot.name}`,
          status: "completed",
          category: "bots",
          currency: "USD",
          botDetails: {
            name: bot.name,
            profitRate: bot.profitRate,
            winRate: bot.winRate,
            level: bot.botLevel,
          },
        });

        if (!transactionResult?.success) {
          console.warn(
            "Bot transaction logging failed:",
            transactionResult?.error
          );
        }

        setSuccessMessage(`Successfully purchased ${bot.name} trading bot`);
        setShowSuccessModal(true);
        toast.success(`Successfully purchased ${bot.name}!`); // Success toast
        addNotification(`Successfully purchased ${bot.name} trading bot`, "success");
      } catch (error) {
        // If there's an error in updating balance (e.g., from a backend call),
        // revert the optimistic UI update and show an error.
        setPurchasedBots((prev) => prev.filter((botId) => botId !== id)); // Revert
        toast.error(`Failed to purchase ${bot.name}. Please try again.`);
        console.error("Purchase error:", error);
      }
    } else {
      toast.info(`${bot.name} is already active.`); // Inform if already purchased
    }
  };

  const handleUnsubscribe = async (id) => {
    const bot = bots.find((b) => b.id === id);
    if (!bot) return;

    setPurchasedBots((prev) => prev.filter((botId) => botId !== id));

      const transactionResult = await addTransaction({
        type: "info",
        amount: 0,
        description: `Bot deactivated: ${bot.name}`,
        status: "Cancelled",
        category: "bots",
        currency: "USD",
      });

      if (!transactionResult?.success) {
        console.warn(
          "Bot deactivation log failed:",
          transactionResult?.error
        );
      }

    setSuccessMessage(`${bot.name} has been deactivated.`);
    setShowSuccessModal(true);
    toast.success(`${bot.name} has been deactivated.`); // Add success toast for deactivation
    addNotification(`${bot.name} has been deactivated.`, "info");
  };

  const toggleManager = () => setShowManager((prev) => !prev);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <section
      className={`min-h-screen ${
        theme === "dark"
          ? "bg-gradient-to-br from-teal-950 via-slate-900 to-slate-950"
          : "bg-gradient-to-br from-gray-50 to-slate-100"
      }`}
    >
      <div className="container mx-auto px-4 py-16">
        {/* Heading */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center mb-6">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                theme === "dark" ? "bg-slate-800" : "bg-teal-100"
              }`}
            >
              <FaRobot
                className={`text-3xl ${
                  theme === "dark" ? "text-teal-400" : "text-teal-600"
                }`}
              />
            </div>
          </div>

          <h1
            className={`text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${
              theme === "dark"
                ? "from-teal-400 to-cyan-500"
                : "from-teal-600 to-cyan-700"
            }`}
          >
            AI Trading Bots
          </h1>

          <p
            className={`mt-4 max-w-2xl mx-auto text-xl ${
              theme === "dark" ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Advanced algorithms that trade 24/7 to maximize your profits
          </p>

          <button
            onClick={toggleManager}
            className={`mt-8 px-8 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto shadow-lg transition-all ${
              theme === "dark"
                ? "bg-gradient-to-r from-teal-600 to-slate-700 text-white"
                : "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
            }`}
          >
            {showManager ? "Close Manager" : "Manage My Bots"}
          </button>
        </div>

        {/* Purchased Bots Section */}
        {showManager && (
          <div className="mb-16 max-w-6xl mx-auto p-6 rounded-2xl backdrop-blur-lg bg-white/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2 text-teal-600 dark:text-teal-300">
              <FaCrown className="text-yellow-600 dark:text-yellow-400" />
              My Trading Fleet
            </h2>
            {purchasedBots.length === 0 ? (
              <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                <FaRobot className="text-4xl mx-auto mb-2" />
                No active bots. Purchase one to get started!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {bots
                  .filter((bot) => purchasedBots.includes(bot.id))
                  .map((bot) => (
                    <div
                      key={bot.id}
                      className="p-5 rounded-xl shadow-md bg-white hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <img
                          src={bot.image}
                          alt={bot.name}
                          className="w-16 h-16 rounded-xl object-cover border-2 border-teal-400/30"
                        />
                        <div>
                          <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                            {bot.name}
                          </h3>
                          <span className="text-xs px-2 py-1 bg-teal-500 text-white rounded-full">
                            +{bot.profitRate} ROI
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnsubscribe(bot.id)}
                        className="w-full py-2 rounded-lg bg-slate-600 text-white hover:bg-slate-700 transition"
                      >
                        Deactivate
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* All Bots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {bots.map((bot) => {
            const isPurchased = purchasedBots.includes(bot.id);
            return (
              <div
                key={bot.id}
                className={`relative rounded-3xl overflow-hidden border-2 shadow-lg transition ${
                  theme === "dark"
                    ? "bg-slate-900 border-teal-700"
                    : "bg-white border-slate-200"
                }`}
              >
                {/* Banner */}
                <div className="h-36 bg-gradient-to-r from-teal-100 via-slate-50 to-white dark:from-teal-900 dark:via-slate-800 dark:to-slate-900 relative">
                  <img
                    src={bot.image}
                    alt={bot.name}
                    className="absolute top-4 left-4 w-14 h-14 object-cover rounded-xl border-2 border-white/30"
                  />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h2 className="text-lg font-bold">{bot.name}</h2>
                    <div className="text-sm text-teal-300 flex items-center gap-2">
                      <FaChartLine />
                      {bot.profitRate} Profit
                    </div>
                  </div>
                  {isPurchased && (
                    <div className="absolute top-4 right-4 bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                      <FaBolt className="text-yellow-300" />
                      ACTIVE
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-5">
                  <div className="text-sm text-slate-400 flex justify-between mb-2">
                    <span>Investment</span>
                    <span className="text-slate-700 dark:text-slate-200 font-semibold">
                      {bot.amount}
                    </span>
                  </div>
                  <div className="text-sm text-slate-400 flex justify-between mb-2">
                    <span>Level</span>
                    <span className="text-slate-700 dark:text-slate-200 font-semibold">
                      {bot.botLevel}
                    </span>
                  </div>
                  <div className="text-sm text-slate-400 flex justify-between mb-4">
                    <span>Win Rate</span>
                    <span className="text-green-500 font-semibold">
                      {bot.winRate}
                    </span>
                  </div>
                  {!isPurchased ? (
                    <button
                      onClick={() => handlePurchase(bot.id)}
                      disabled={isPurchased} // This disabled prop will still correctly disable if the button is somehow rendered when it shouldn't be.
                      className={`w-full py-2 rounded-xl ${
                        isPurchased
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-teal-600 to-slate-700 text-white hover:from-teal-500 hover:to-slate-600"
                      }`}
                    >
                      {isPurchased ? "Purchased" : "Purchase"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnsubscribe(bot.id)}
                      className="w-full py-2 rounded-xl bg-slate-600 text-white hover:bg-slate-700"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className={`p-6 rounded-xl max-w-md w-full mx-4 ${
              theme === "dark" ? "bg-slate-900" : "bg-white"
            }`}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
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
              <h2 className="text-xl font-bold mb-2">Success!</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {successMessage}
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
