import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "react-toastify";
import { TraderCard } from "./TraderCard";
import { useCopyTraders } from "../../context/CopyTraderContext";
import { useUser } from "../../context/UserContext";
import { COPY_TRADERS_SEED } from "../../data/copyTradersSeed";

export default function MyTraderPage() {
  const { theme } = useTheme();
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const { copiedTraders, addCopiedTrader } = useCopyTraders();
  const { userData } = useUser();

  const traders = COPY_TRADERS_SEED;
  const userBalance = Number(userData?.balance) || 0;

  const filteredTraders = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return traders;

    return traders.filter(
      (trader) =>
        trader.name.toLowerCase().includes(term) ||
        trader.strategy.toLowerCase().includes(term)
    );
  }, [search, traders]);

  const handleCopy = async (id) => {
    if (userBalance <= 0) {
      toast.error("Insufficient balance. Deposit funds to copy traders.");
      return;
    }

    if (copiedTraders.some((trader) => trader.id === id)) {
      toast.error("You are already copying this trader.");
      return;
    }

    const traderToCopy = traders.find((trader) => trader.id === id);
    if (!traderToCopy) {
      toast.error("Trader profile not found.");
      return;
    }

    setLoadingId(id);
    const investmentAmount =
      Number(traderToCopy.copyPrice) || Number(traderToCopy.balance) || 100;

    try {
      await addCopiedTrader(traderToCopy, investmentAmount);
      toast.success(`Now copying ${traderToCopy.name}.`);
    } catch (error) {
      toast.error(error?.message || "Failed to copy trader.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <section
      className={`min-h-screen px-4 py-10 sm:px-6 lg:px-8 ${
        theme === "dark" ? "bg-zinc-950 text-white" : "bg-gray-50 text-gray-800"
      }`}
    >
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          placeholder="Search traders..."
          className={`w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 ${
            theme === "dark"
              ? "border-slate-700 bg-slate-900 text-white focus:ring-teal-500/50"
              : "border-slate-300 bg-white text-slate-800 focus:ring-teal-500/40"
          }`}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div
          className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
            theme === "dark"
              ? "border-slate-700 bg-slate-900 text-slate-200"
              : "border-slate-200 bg-white text-slate-700"
          }`}
        >
          {filteredTraders.length} traders
        </div>
      </div>

      {userBalance <= 0 && (
        <div
          className={`mb-6 rounded-xl border p-4 text-sm ${
            theme === "dark"
              ? "border-rose-800 bg-rose-900/30 text-rose-200"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          You need to deposit funds to start copying traders.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTraders.map((trader) => (
          <TraderCard
            key={trader.id}
            trader={trader}
            theme={theme}
            onCopy={handleCopy}
            isCopying={loadingId === trader.id}
            isCopied={copiedTraders.some((entry) => entry.id === trader.id)}
            userBalance={userBalance}
          />
        ))}
      </div>
    </section>
  );
}

