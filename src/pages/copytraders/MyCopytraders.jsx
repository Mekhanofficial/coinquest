import { useTheme } from "next-themes";
import { TraderCard } from "../../components/traders/TraderCard";
import { useCopyTraders } from "../../context/CopyTraderContext";
import { toast } from "react-toastify";

export function MyCopyTradersPage() {
  const { theme } = useTheme();
  const { copiedTraders, removeCopiedTrader } = useCopyTraders();

  const handleRemove = async (id) => {
    const result = await removeCopiedTrader(id);
    if (!result?.success) {
      toast.error(result?.error || "Failed to settle copied trader.");
      return;
    }

    if (result.profitLoss > 0) {
      toast.success(
        `Trade settled. +$${result.profitLoss.toFixed(2)} profit credited to balance.`
      );
      return;
    }

    if (result.profitLoss < 0) {
      toast.info(
        `Trade settled. -$${Math.abs(result.profitLoss).toFixed(2)} loss applied.`
      );
      return;
    }

    toast.success("Trade settled. Principal returned to your balance.");
  };

  return (
    <section
      className={`px-4 py-14 min-h-screen ${
        theme === "dark" ? "bg-slate-950" : "bg-gray-100"
      }`}
    >
      <h1
        className={`text-3xl font-bold ${
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        }`}
      >
        My Copy Traders
      </h1>

      {copiedTraders.length === 0 ? (
        <p
          className={`text-lg mt-7 rounded-3xl p-10 transition-all duration-300 border ${
            theme === "dark"
              ? "bg-slate-900 border-gray-800 hover:border-teal-500 hover:shadow-teal-500/50 text-gray-500"
              : "bg-white border-gray-200 hover:border-teal-400 hover:shadow-teal-400/50 text-gray-400"
          } hover:scale-105 hover:shadow-lg`}
        >
          No copy traders yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-7">
          {copiedTraders.map((trader) => (
            <div key={trader.id} className="relative group">
              <TraderCard trader={trader} theme={theme} isCopied={true} />
              <button
                onClick={() => handleRemove(trader.id)}
                className={`absolute top-2 right-2 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                  theme === "dark"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-red-500 hover:bg-red-600"
                } text-white`}
                title="Remove trader"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
