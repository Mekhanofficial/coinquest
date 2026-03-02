import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { API_BASE_URL } from "../../config/api";
import { useUser } from "../../context/UserContext";

export default function TradesRoiPage() {
  const { theme } = useTheme();
  const [recentTrades, setRecentTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, getAuthToken } = useUser();

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

      setLoading(true);
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
          const normalized = (result.data || []).map((trade) => ({
            id: trade.id || trade._id,
            type: trade.direction || trade.type || "buy",
            tradeType: trade.tradeType,
            asset: trade.asset,
            amount: Number(trade.amount) || 0,
            lotSize: trade.lotSize || "N/A",
            takeProfit: trade.takeProfit || "N/A",
            stopLoss: trade.stopLoss || "N/A",
            duration: trade.duration || "5 Minutes",
            status:
              trade.status === "Completed" && trade.result
                ? trade.result
                : trade.status || "Active",
            date: trade.createdAt || trade.date || trade.startedAt || new Date().toISOString(),
            profitLoss: trade.profitLoss || 0,
          }));
          setRecentTrades(normalized);
        } else {
          setRecentTrades([]);
        }
      } catch (error) {
        console.error("Failed to fetch trades", error);
        setRecentTrades([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, [isAuthenticated, getAuthToken]);

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Win":
        return "text-green-500";
      case "Loss":
        return "text-red-500";
      case "Active":
        return theme === "dark" ? "text-blue-400" : "text-blue-600";
      default:
        return theme === "dark" ? "text-gray-400" : "text-gray-600";
    }
  };

  return (
    <>
      <section
        className={`min-h-screen overflow-x-hidden px-10 py-14 ${
          theme === "dark" ? "bg-slate-950" : "bg-gray-100"
        }`}
      >
        {/* Recent Trades Section */}
        <div
          className={`font-semibold rounded-md mx-10 p-5 border top-20 relative transition-all duration-300 ${
            theme === "dark"
              ? "bg-slate-900 border-gray-800 hover:border-teal-500 hover:shadow-teal-500/50 text-white"
              : "bg-white border-gray-200 hover:border-teal-400 hover:shadow-teal-400/50 text-gray-800"
          } hover:scale-105`}
        >
          <h1
            className={`font-semibold text-xl mb-6 text-center lg:text-left ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Recent Trades
          </h1>

          {/* Horizontal Scroll Wrapper */}
          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              <div
                className={`flex justify-between items-center border-b pb-2 ${
                  theme === "dark"
                    ? "border-gray-700 text-gray-400"
                    : "border-gray-300 text-gray-500"
                }`}
              >
                <h2 className="px-4 w-20">ID</h2>
                <h2 className="px-4 w-20">Type</h2>
                <div className="flex items-center gap-8 lg:gap-16 px-4">
                  <h2 className="w-40">Trade Time</h2>
                  <h2 className="w-20">Amount</h2>
                </div>
                <h2 className="px-4 w-20">Pair</h2>
                <div className="flex items-center gap-8 lg:gap-16 px-4">
                  <h2 className="w-20">Lot Size</h2>
                  <h2 className="w-20">Entry</h2>
                  <h2 className="w-20">SL</h2>
                  <h2 className="w-20">TP</h2>
                  <h2 className="w-32">Duration</h2>
                  <h2 className="w-20">Status</h2>
                  <h2 className="w-20">P/L</h2>
                </div>
              </div>

              {loading ? (
                <h1
                  className={`text-2xl text-center mt-10 font-bold ${
                    theme === "dark" ? "text-slate-500" : "text-gray-400"
                  }`}
                >
                  Loading trades...
                </h1>
              ) : recentTrades.length > 0 ? (
                recentTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className={`flex justify-between items-center border-b py-3 ${
                      theme === "dark"
                        ? "border-gray-700 hover:bg-slate-800"
                        : "border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <div className="px-4 w-20 truncate">
                      {trade.id.slice(-6)}
                    </div>
                    <div
                      className={`px-4 w-20 ${
                        trade.type === "buy" ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {trade.type.toUpperCase()}
                    </div>
                    <div className="flex items-center gap-8 lg:gap-16 px-4">
                      <div className="w-40">{formatDate(trade.date)}</div>
                      <div className="w-20">
                        ${parseFloat(trade.amount).toLocaleString()}
                      </div>
                    </div>
                    <div className="px-4 w-20">{trade.asset}</div>
                    <div className="flex items-center gap-8 lg:gap-16 px-4">
                      <div className="w-20">{trade.lotSize}</div>
                      <div className="w-20">Market</div>
                      <div className="w-20">{trade.stopLoss}</div>
                      <div className="w-20">{trade.takeProfit}</div>
                      <div className="w-32">{trade.duration}</div>
                      <div className={`w-20 ${getStatusColor(trade.status)}`}>
                        {trade.status}
                      </div>
                      <div className="w-20">
                        {trade.profitLoss === "0.00" || !trade.profitLoss
                          ? "-"
                          : `$${trade.profitLoss}`}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <h1
                  className={`text-2xl text-center mt-10 font-bold ${
                    theme === "dark" ? "text-slate-500" : "text-gray-400"
                  }`}
                >
                  You haven't placed any trades.
                </h1>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
