import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import TradingViewChart from "../coinapi/Tradingview";

const TIMEFRAME_OPTIONS = [
  { label: "1H", interval: "60" },
  { label: "4H", interval: "240" },
  { label: "1D", interval: "D" },
  { label: "1W", interval: "W" },
];

export default function ChartSection({ theme, selectedAsset }) {
  const [activeTimeframe, setActiveTimeframe] = useState(TIMEFRAME_OPTIONS[0]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateSize = () => setIsMobile(window.innerWidth < 768);
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const chartHeight = isMobile ? 320 : 500;

  return (
    <div className="w-full lg:w-[100%]">
      <div
        className={`rounded-xl shadow-sm p-4 ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <div className="flex items-center space-x-2">
            <span
              className={`text-lg font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {selectedAsset || "BTC/USD"}
            </span>
            <span
              className={`px-2 py-1 text-xs rounded ${
                theme === "dark"
                  ? "bg-green-900 text-green-300"
                  : "bg-green-100 text-green-800"
              }`}
            >
              +2.4%
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TIMEFRAME_OPTIONS.map((option) => (
              <button
                key={option.label}
                onClick={() => setActiveTimeframe(option)}
                className={`px-3 py-1 text-sm rounded-lg transition ${
                  activeTimeframe.label === option.label
                    ? theme === "dark"
                      ? "bg-blue-600 text-white"
                      : "bg-blue-500 text-white"
                    : theme === "dark"
                    ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <TradingViewChart
          symbol={selectedAsset || "BTC/USD"}
          interval={activeTimeframe.interval}
          width="100%"
          height={chartHeight}
        />
      </div>
    </div>
  );
}

ChartSection.propTypes = {
  theme: PropTypes.string.isRequired,
  selectedAsset: PropTypes.string,
};
