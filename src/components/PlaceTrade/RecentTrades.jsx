export default function RecentTrades({
  theme,
  recentTrades,
  calculateProgress,
  formatTimeRemaining,
}) {
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

  return (
    <div
      className={`mt-6 rounded-xl shadow-sm p-4 ${
        theme === "dark" ? "bg-gray-800" : "bg-white"
      }`}
    >
      <h3
        className={`text-lg font-semibold mb-4 ${
          theme === "dark" ? "text-white" : "text-gray-900"
        }`}
      >
        Recent Trades
      </h3>

      {recentTrades.length > 0 ? (
        <div className="space-y-3">
          {recentTrades.map((trade) => (
            <div
              key={trade.id}
              className={`p-3 rounded-lg ${
                theme === "dark" ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <span
                    className={`font-medium ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {trade.asset} ({trade.type.toUpperCase()})
                  </span>
                  <span
                    className={`block text-xs ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {formatDate(trade.date)}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`font-medium ${
                      trade.type === "buy"
                        ? theme === "dark"
                          ? "text-green-400"
                          : "text-green-600"
                        : theme === "dark"
                        ? "text-red-400"
                        : "text-red-600"
                    }`}
                  >
                    ${trade.amount.toLocaleString()}
                  </span>
                  <span
                    className={`block text-xs ${
                      trade.status === "Win"
                        ? theme === "dark"
                          ? "text-green-400"
                          : "text-green-600"
                        : trade.status === "Loss"
                        ? theme === "dark"
                          ? "text-red-400"
                          : "text-red-600"
                        : theme === "dark"
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}
                  >
                    {trade.status}
                  </span>
                </div>
              </div>

              {trade.status === "Active" && (
                <div className="mt-2">
                  <div
                    className={`w-full h-2 rounded-full ${
                      theme === "dark" ? "bg-gray-600" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{
                        width: `${calculateProgress(trade)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span
                      className={
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }
                    >
                      {Math.floor(calculateProgress(trade))}%
                    </span>
                    <span
                      className={
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }
                    >
                      {formatTimeRemaining(trade)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-2 text-xs">
                <span
                  className={
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }
                >
                  TP: {trade.takeProfit}
                </span>
                <span
                  className={
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }
                >
                  SL: {trade.stopLoss}
                </span>
                <span
                  className={
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }
                >
                  {trade.duration}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className={`p-6 text-center rounded-lg ${
            theme === "dark" ? "bg-gray-700/50" : "bg-gray-100"
          }`}
        >
          <svg
            className={`mx-auto h-12 w-12 ${
              theme === "dark" ? "text-gray-600" : "text-gray-400"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3
            className={`mt-2 text-sm font-medium ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            No recent trades
          </h3>
          <p
            className={`mt-1 text-sm ${
              theme === "dark" ? "text-gray-500" : "text-gray-400"
            }`}
          >
            Get started by placing your first trade.
          </p>
        </div>
      )}
    </div>
  );
}
