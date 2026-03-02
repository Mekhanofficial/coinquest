import PropTypes from 'prop-types';
import { useCopyTraders } from '../../context/CopyTraderContext';

const parseCurrency = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const numeric = parseFloat(value.replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
  }
  return 0;
};

export const TraderCard = ({
  trader,
  theme,
  onCopy,
  isCopying,
  isCopied,
  userBalance,
  investmentAmount,
}) => {
  const { addCopiedTrader } = useCopyTraders();
  
  const isDarkMode = theme === 'dark' || 
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

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

  const handleCopyTrader = async () => {
    if (isCopied || !hasSufficientFunds) return;
    
    try {
      // Parent-managed copy flow handles balance + context updates.
      if (onCopy) {
        await onCopy(trader.id);
        return;
      }
      
      // Add to copy traders context with balance deduction
      await addCopiedTrader(trader, resolvedInvestment);
      
      // Show success message or handle UI update
      console.log(`Successfully copied ${trader.name} with $${resolvedInvestment} investment`);
      
    } catch (error) {
      console.error('Failed to copy trader:', error);
      // You can show a toast notification here
      alert(error.message); // Replace with your preferred notification system
    }
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl ${
        isDarkMode
          ? 'bg-gradient-to-br from-teal-800 to-slate-900 border border-slate-700'
          : 'bg-gradient-to-br from-teal-50 to-slate-100 border border-slate-200'
      } ${isCopied ? 'ring-2 ring-green-500' : ''}`}
    >
      {/* Status indicator */}
      <div className="absolute top-4 right-4 z-10">
        <div className="relative">
          <div
            className={`absolute inset-0 rounded-full ${
              isCopied
                ? 'bg-green-500 animate-ping'
                : isCopying
                ? 'bg-blue-500 animate-ping'
                : 'bg-green-500'
            } opacity-75`}
          ></div>
          <div
            className={`w-3 h-3 rounded-full relative ${
              isCopied
                ? 'bg-green-500'
                : isCopying
                ? 'bg-blue-500'
                : 'bg-green-500'
            }`}
          ></div>
        </div>
      </div>

      {/* Header with tinted gradient */}
      <div
        className={`h-28 relative overflow-hidden ${
          isDarkMode
            ? 'bg-gradient-to-r from-teal-700/30 to-slate-800/30'
            : 'bg-gradient-to-r from-teal-200/50 to-slate-200/50'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/5"></div>
        <div className="absolute bottom-4 left-4 flex items-end gap-4">
          <div className="relative">
            <img
              src={trader.image}
              alt={trader.name}
              className="w-16 h-16 rounded-full border-4 border-white/80 shadow-lg"
            />
            <div
              className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 ${
                isDarkMode ? 'border-slate-800' : 'border-white'
              } flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-500`}
            >
              <span className="text-xs font-bold text-white">✓</span>
            </div>
          </div>
          <div className="text-left mb-2">
            <h2
              className={`text-xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              {trader.name}
            </h2>
            <p
              className={`font-semibold ${
                isDarkMode ? 'text-teal-300' : 'text-teal-600'
              }`}
            >
              Min: {displayInvestmentLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5">
        <div className="flex justify-between mb-4">
          <div>
            <p
              className={`text-sm ${
                isDarkMode ? 'text-slate-400' : 'text-gray-500'
              }`}
            >
              Profit Share
            </p>
            <p
              className={`text-lg font-bold ${
                isDarkMode ? 'text-teal-300' : 'text-teal-700'
              }`}
            >
              {trader.profitShare}%
            </p>
          </div>

          <div className="text-right">
            <p
              className={`text-sm ${
                isDarkMode ? 'text-slate-400' : 'text-gray-500'
              }`}
            >
              Win Rate
            </p>
            <p
              className={`text-lg font-bold ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}
            >
              {trader.winRate}%
            </p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
                Wins
              </span>
              <span className="font-medium">{trader.wins}</span>
            </div>
            <div
              className={`h-2 rounded-full overflow-hidden ${
                isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
              }`}
            >
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-emerald-400"
                style={{ width: `${trader.winRate}%` }}
              />
            </div>
          </div>

          <div className="w-px h-8 bg-gray-300 dark:bg-slate-600"></div>

          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
                Losses
              </span>
              <span className="font-medium">{trader.losses}</span>
            </div>
            <div
              className={`h-2 rounded-full overflow-hidden ${
                isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
              }`}
            >
              <div
                className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                style={{ width: `${100 - trader.winRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Balance Warning */}
            {!hasSufficientFunds && (
              <div className={`mb-4 p-2 rounded-lg text-center ${
                isDarkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-700'
              }`}>
                <p className="text-sm font-medium">
                  Need {displayInvestmentLabel} to copy
                </p>
              </div>
            )}

        <button
          className={`w-full py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
            isCopied
              ? 'bg-teal-600 text-white cursor-default'
              : isCopying
              ? 'bg-blue-600 text-white cursor-wait'
              : !hasSufficientFunds
              ? 'bg-gray-400 cursor-not-allowed'
              : isDarkMode
              ? 'bg-gradient-to-r from-teal-700 to-teal-500 text-white hover:from-teal-600 hover:to-teal-400'
              : 'bg-gradient-to-r from-teal-500 to-teal-400 text-white hover:from-teal-600 hover:to-teal-500'
          }`}
          onClick={handleCopyTrader}
          disabled={isCopying || isCopied || !hasSufficientFunds}
            title={
              !hasSufficientFunds
                ? `You need at least ${displayInvestmentLabel} to copy this trader`
                : isCopied
                ? 'Already copying this trader'
                : `Copy ${trader.name} with ${displayInvestmentLabel} investment`
            }
        >
          {isCopying ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Copying...</span>
            </>
          ) : isCopied ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
              <span>Copy Trader ({displayInvestmentLabel})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

TraderCard.propTypes = {
  trader: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
    profitShare: PropTypes.number.isRequired,
    winRate: PropTypes.number.isRequired,
    wins: PropTypes.number.isRequired,
    losses: PropTypes.number.isRequired,
    balance: PropTypes.number,
    copyPrice: PropTypes.number,
  }).isRequired,
  theme: PropTypes.oneOf(['light', 'dark', 'system']),
  onCopy: PropTypes.func,
  isCopying: PropTypes.bool,
  isCopied: PropTypes.bool,
  userBalance: PropTypes.number.isRequired,
  investmentAmount: PropTypes.number,
};

TraderCard.defaultProps = {
  theme: 'light',
  isCopying: false,
  isCopied: false,
  investmentAmount: undefined,
};
