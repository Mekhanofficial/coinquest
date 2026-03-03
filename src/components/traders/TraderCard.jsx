import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useCopyTraders } from "../../context/CopyTraderContext";

const parseCurrency = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const numeric = parseFloat(value.replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
  }
  return 0;
};

const getDefaultFallback = (name = "Trader") => {
  const seed = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${seed}&background=0f766e&color=fff&size=256&bold=true`;
};

export const TraderCard = ({
  trader,
  theme = "light",
  onCopy,
  isCopying = false,
  isCopied = false,
  userBalance,
  investmentAmount = undefined,
}) => {
  const { addCopiedTrader } = useCopyTraders();
  const isDarkMode = theme === "dark";

  const [imageSrc, setImageSrc] = useState(
    trader?.image || trader?.fallbackImage || getDefaultFallback(trader?.name)
  );

  useEffect(() => {
    setImageSrc(trader?.image || trader?.fallbackImage || getDefaultFallback(trader?.name));
  }, [trader?.image, trader?.fallbackImage, trader?.name]);

  const fallbackInvestment =
    parseCurrency(trader?.copyPrice) ||
    parseCurrency(trader?.investmentAmount) ||
    parseCurrency(trader?.amount) ||
    parseCurrency(trader?.balance) ||
    100;

  const resolvedInvestment = investmentAmount ?? fallbackInvestment;
  const displayInvestment = resolvedInvestment.toLocaleString("en-US");
  const displayInvestmentLabel = `$${displayInvestment}`;
  const hasSufficientFunds = userBalance >= resolvedInvestment;
  const strategyLabel = trader?.strategy || "Managed Strategy";

  const handleCopyTrader = async () => {
    if (isCopied || !hasSufficientFunds) return;

    try {
      if (onCopy) {
        await onCopy(trader.id);
        return;
      }
      await addCopiedTrader(trader, resolvedInvestment);
    } catch (error) {
      console.error("Failed to copy trader:", error);
    }
  };

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border shadow-lg transition duration-300 hover:-translate-y-0.5 hover:shadow-xl ${
        isDarkMode
          ? "border-slate-700 bg-slate-900 text-slate-100"
          : "border-slate-200 bg-white text-slate-900"
      } ${isCopied ? "ring-2 ring-emerald-500/70" : ""}`}
    >
      <div className="absolute right-3 top-3 z-10">
        <span
          className={`inline-flex h-3 w-3 rounded-full ${
            isCopied
              ? "bg-emerald-500"
              : isCopying
              ? "animate-pulse bg-sky-500"
              : "bg-teal-500"
          }`}
          aria-hidden
        />
      </div>

      <header
        className={`relative border-b px-4 pb-4 pt-4 ${
          isDarkMode
            ? "border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900"
            : "border-slate-200 bg-gradient-to-r from-slate-50 to-white"
        }`}
      >
        <div className="flex items-center gap-3">
          <img
            src={imageSrc}
            alt={trader.name}
            className="h-14 w-14 rounded-full border-2 border-white/70 object-cover shadow"
            onError={() =>
              setImageSrc(
                trader?.fallbackImage || getDefaultFallback(trader?.name)
              )
            }
            loading="lazy"
          />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold">{trader.name}</h2>
            <p
              className={`truncate text-xs font-medium ${
                isDarkMode ? "text-teal-300" : "text-teal-700"
              }`}
            >
              {strategyLabel}
            </p>
            <p
              className={`mt-1 text-sm font-semibold ${
                isDarkMode ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Min: {displayInvestmentLabel}
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div
            className={`rounded-lg p-3 ${
              isDarkMode ? "bg-slate-800" : "bg-slate-50"
            }`}
          >
            <p className="text-xs text-slate-400">Profit Share</p>
            <p className="text-lg font-bold text-teal-500">{trader.profitShare}%</p>
          </div>
          <div
            className={`rounded-lg p-3 ${
              isDarkMode ? "bg-slate-800" : "bg-slate-50"
            }`}
          >
            <p className="text-xs text-slate-400">Win Rate</p>
            <p className="text-lg font-bold text-emerald-500">{trader.winRate}%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-400">Wins</p>
            <p className="font-semibold">{trader.wins}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Losses</p>
            <p className="font-semibold">{trader.losses}</p>
          </div>
        </div>

        <div
          className={`h-2 overflow-hidden rounded-full ${
            isDarkMode ? "bg-slate-700" : "bg-slate-200"
          }`}
        >
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500"
            style={{ width: `${trader.winRate}%` }}
          />
        </div>

        {!isCopied && !hasSufficientFunds && (
          <div
            className={`rounded-lg p-2 text-center text-xs font-medium ${
              isDarkMode
                ? "bg-rose-900/40 text-rose-200"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            Need {displayInvestmentLabel} to copy
          </div>
        )}

        <button
          onClick={handleCopyTrader}
          disabled={isCopying || isCopied || !hasSufficientFunds}
          className={`w-full rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            isCopied
              ? "cursor-default bg-emerald-600 text-white"
              : isCopying
              ? "cursor-wait bg-sky-600 text-white"
              : !hasSufficientFunds
              ? "cursor-not-allowed bg-slate-400 text-white"
              : "bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-500 hover:to-cyan-500"
          }`}
          title={
            isCopied
              ? "Already copying this trader"
              : !hasSufficientFunds
              ? `You need at least ${displayInvestmentLabel} to copy this trader`
              : `Copy ${trader.name} with ${displayInvestmentLabel}`
          }
        >
          {isCopying ? "Copying..." : isCopied ? "Copied!" : `Copy Trader (${displayInvestmentLabel})`}
        </button>
      </div>
    </article>
  );
};

TraderCard.propTypes = {
  trader: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    image: PropTypes.string,
    fallbackImage: PropTypes.string,
    strategy: PropTypes.string,
    profitShare: PropTypes.number.isRequired,
    winRate: PropTypes.number.isRequired,
    wins: PropTypes.number.isRequired,
    losses: PropTypes.number.isRequired,
    balance: PropTypes.number,
    copyPrice: PropTypes.number,
  }).isRequired,
  theme: PropTypes.oneOf(["light", "dark", "system"]),
  onCopy: PropTypes.func,
  isCopying: PropTypes.bool,
  isCopied: PropTypes.bool,
  userBalance: PropTypes.number.isRequired,
  investmentAmount: PropTypes.number,
};
