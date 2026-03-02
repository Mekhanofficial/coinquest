import PropTypes from "prop-types";

TradeForm.propTypes = {
  theme: PropTypes.string.isRequired,
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
  tradeType: PropTypes.string,
  handleTradeTypeChange: PropTypes.func.isRequired,
  assets: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedAsset: PropTypes.string,
  handleAssetChange: PropTypes.func.isRequired,
  amount: PropTypes.string.isRequired,
  setAmount: PropTypes.func.isRequired,
  userData: PropTypes.shape({
    balance: PropTypes.number,
  }),
  lotSize: PropTypes.number.isRequired,
  setLotSize: PropTypes.func.isRequired,
  takeProfit: PropTypes.string,
  setTakeProfit: PropTypes.func.isRequired,
  stopLoss: PropTypes.string,
  setStopLoss: PropTypes.func.isRequired,
  duration: PropTypes.string.isRequired,
  setDuration: PropTypes.func.isRequired,
  error: PropTypes.string,
  handlePlaceOrder: PropTypes.func.isRequired,
  formatCurrency: PropTypes.func.isRequired,
};

export default function TradeForm({
  theme,
  activeTab,
  setActiveTab,
  tradeType,
  handleTradeTypeChange,
  assets,
  selectedAsset,
  handleAssetChange,
  amount,
  setAmount,
  userData,
  lotSize,
  setLotSize,
  takeProfit,
  setTakeProfit,
  stopLoss,
  setStopLoss,
  duration,
  setDuration,
  error,
  handlePlaceOrder,
  formatCurrency,
}) {
  return (
    <div
      className={`rounded-xl shadow-sm overflow-hidden ${
        theme === "dark" ? "bg-gray-800" : "bg-white"
      }`}
    >
      {/* Buy/Sell Tabs */}
      <div
        className={`flex border-b ${
          theme === "dark" ? "border-gray-700" : "border-gray-200"
        }`}
      >
        {["buy", "sell"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 font-medium text-center ${
              activeTab === tab
                ? theme === "dark"
                  ? tab === "buy"
                    ? "bg-blue-600 text-white"
                    : "bg-red-600 text-white"
                  : tab === "buy"
                  ? "bg-blue-500 text-white"
                  : "bg-red-500 text-white"
                : theme === "dark"
                ? "text-gray-300 hover:bg-gray-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="p-2">
        <h3
          className={`text-lg font-semibold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          Place Order
        </h3>

        {/* Error Message */}
        {error && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              theme === "dark"
                ? "bg-red-900/30 text-red-300"
                : "bg-red-100 text-red-800"
            }`}
          >
            {error}
            {error.includes("deposit") && (
              <button
                onClick={() => (window.location.href = "/deposit")}
                className={`ml-2 underline ${
                  theme === "dark" ? "text-blue-400" : "text-blue-600"
                }`}
              >
                Deposit Now
              </button>
            )}
          </div>
        )}

        {/* Trade Form */}
        <div className="space-y-2">
          {/* Trade Type */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Trade Type
            </label>
            <select
              className={`w-full p-3 rounded-lg text-sm ${
                theme === "dark"
                  ? "bg-gray-700 text-white border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                  : "bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              } border`}
              value={tradeType}
              onChange={handleTradeTypeChange}
            >
              <option value="">Select trade type</option>
              <option>VIP Trades</option>
              <option>Crypto</option>
              <option>Forex</option>
            </select>
          </div>

          {/* Asset */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Asset
            </label>
            <select
              className={`w-full p-3 rounded-lg text-sm ${
                theme === "dark"
                  ? "bg-gray-700 text-white border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                  : "bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              } border`}
              value={selectedAsset}
              onChange={handleAssetChange}
              disabled={!tradeType}
            >
              <option value="">Select an asset</option>
              {assets.map((asset, index) => (
                <option key={index} value={asset}>
                  {asset}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                className={`block text-sm font-medium ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Amount
              </label>
              <span
                className={`text-xs ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Balance: $
                {userData?.balance?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "0.00"}
              </span>
            </div>
            <div className="relative">
              <span
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                $
              </span>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(formatCurrency(e.target.value))}
                className={`w-full p-3 pl-8 rounded-lg text-sm ${
                  theme === "dark"
                    ? "bg-gray-700 text-white border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                    : "bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                } border`}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Lot Size */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Lot Size
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 5, 10, 15].map((size) => (
                <button
                  key={size}
                  onClick={() => setLotSize(size)}
                  className={`py-2 rounded-lg text-sm ${
                    lotSize === size
                      ? theme === "dark"
                        ? "bg-blue-600 text-white"
                        : "bg-blue-500 text-white"
                      : theme === "dark"
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                  }`}
                >
                  {size} LS
                </button>
              ))}
            </div>
          </div>

          {/* Take Profit & Stop Loss */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Take Profit
              </label>
              <input
                type="text"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                className={`w-full p-3 rounded-lg text-sm ${
                  theme === "dark"
                    ? "bg-gray-700 text-white border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                    : "bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                } border`}
                placeholder="0.00"
              />
            </div>
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Stop Loss
              </label>
              <input
                type="text"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className={`w-full p-3 rounded-lg text-sm ${
                  theme === "dark"
                    ? "bg-gray-700 text-white border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                    : "bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                } border`}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Duration
            </label>
            <select
              className={`w-full p-3 rounded-lg text-sm ${
                theme === "dark"
                  ? "bg-gray-700 text-white border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                  : "bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              } border`}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              <option>5 Minutes</option>
              <option>10 Minutes</option>
              <option>15 Minutes</option>
              <option>30 Minutes</option>
            </select>
          </div>

          {/* Summary */}
          <div
            className={`p-3 rounded-lg ${
              theme === "dark" ? "bg-gray-700" : "bg-gray-100"
            }`}
          >
            <div className="flex justify-between py-1">
              <span
                className={`text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Estimated Profit
              </span>
              <span
                className={`font-medium ${
                  theme === "dark" ? "text-green-400" : "text-green-600"
                }`}
              >
                +$125.00
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span
                className={`text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Potential Loss
              </span>
              <span
                className={`font-medium ${
                  theme === "dark" ? "text-red-400" : "text-red-600"
                }`}
              >
                -$75.00
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span
                className={`text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Risk/Reward
              </span>
              <span
                className={`font-medium ${
                  theme === "dark" ? "text-yellow-400" : "text-yellow-600"
                }`}
              >
                1:1.67
              </span>
            </div>
          </div>

          {/* Warning */}
          <div
            className={`p-3 rounded-lg text-sm ${
              theme === "dark"
                ? "bg-red-900/30 text-red-300"
                : "bg-red-100 text-red-800"
            }`}
          >
            Your trade will auto close if SL or TP does not hit.
          </div>

          {/* Submit Button */}
          <button
            onClick={handlePlaceOrder}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "buy"
                ? theme === "dark"
                  ? "bg-gradient-to-r from-green-600 to-green-800 hover:from-green-500 hover:to-green-700"
                  : "bg-gradient-to-r from-green-500 to-green-700 hover:from-green-400 hover:to-green-600"
                : theme === "dark"
                ? "bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700"
                : "bg-gradient-to-r from-red-500 to-red-700 hover:from-red-400 hover:to-red-600"
            } text-white`}
          >
            {activeTab === "buy" ? "Place Buy Order" : "Place Sell Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
