import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const TradeProgress = ({ theme, trade, onComplete }) => {
  const [progress, setProgress] = useState(trade?.progress || 0);
  const [timeRemaining, setTimeRemaining] = useState(trade?.timeRemaining || 0);
  const [isHovered, setIsHovered] = useState(false);
  const [result, setResult] = useState(null);
  const [isExiting, setIsExiting] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const resolveResult = (tradeItem) => {
    if (!tradeItem) return null;
    const raw = tradeItem.result || tradeItem.status;
    if (!raw) return null;
    const normalized = `${raw}`.toLowerCase();
    if (normalized === "win" || normalized === "loss") {
      return normalized;
    }
    return null;
  };

  useEffect(() => {
    if (!trade) return;

    const existingResult = resolveResult(trade);
    setResult(existingResult);

    if (existingResult) {
      return;
    }

    if (trade.status && trade.status !== "Active") {
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const startTime = trade.startTime?.toDate
        ? trade.startTime.toDate()
        : new Date(trade.startTime || trade.date || now);
      const durationMs = getDurationInMs(trade.duration);
      const endTime = new Date(startTime.getTime() + durationMs);

      const newProgress = Math.min(100, ((now - startTime) / durationMs) * 100);
      const newTimeRemaining = Math.max(0, (endTime - now) / 1000);

      setProgress(newProgress);
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [trade]);

  const getDurationInMs = (duration) => {
    if (!duration) return 5 * 60 * 1000;
    if (typeof duration === "number") return duration * 60 * 1000;

    const [value, unit] = duration.split(" ");
    const numValue = parseInt(value);

    switch (unit.toLowerCase()) {
      case "minutes":
        return numValue * 60 * 1000;
      case "hours":
        return numValue * 60 * 60 * 1000;
      case "days":
        return numValue * 24 * 60 * 60 * 1000;
      default:
        return 5 * 60 * 1000;
    }
  };

  const toggleDetails = () => {
    setDetailsOpen((prev) => !prev);
  };

  const handleClearTrade = () => {
    setIsExiting(true);
    setTimeout(() => onComplete(result || "completed", true), 500);
  };

  const trackColor = theme === "dark" ? "bg-slate-800" : "bg-slate-200";
  const textColor = theme === "dark" ? "text-white" : "text-slate-900";
  const secondaryText = theme === "dark" ? "text-slate-300" : "text-slate-600";

  const getStatusText = () => {
    if (!trade) return "No active trade";
    if (progress < 30) return "Initializing trade";
    if (progress < 70) return "Processing transaction";
    if (progress < 100) return "Finalizing details";
    if (result) return result === "win" ? "Trade Won!" : "Trade Lost";
    return "Trade completed!";
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  if (!trade || isExiting) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-2xl p-3 mb-4 shadow-xl ${
        theme === "dark"
          ? "bg-gradient-to-br from-slate-800 to-slate-950"
          : "bg-gradient-to-br from-slate-100 to-slate-300"
      } border ${
        progress < 100
          ? theme === "dark"
            ? "border-cyan-500/30"
            : "border-cyan-400/30"
          : result === "win"
          ? theme === "dark"
            ? "border-emerald-500/30"
            : "border-emerald-400/30"
          : theme === "dark"
          ? "border-red-500/30"
          : "border-red-400/30"
      } transition-all duration-300`}
      whileHover={{
        y: -5,
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && (
        <>
          <motion.div
            className="absolute top-8 -left-8 w-36 h-36 rounded-full bg-teal-400 opacity-10 blur-xl"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8 }}
          />
          <motion.div
            className="absolute bottom-4 -right-4 w-24 h-24 rounded-full bg-indigo-400 opacity-10 blur-xl"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
        </>
      )}

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2
              className={`text-base lg:text-lg font-bold mb-0.5 ${textColor}`}
            >
              {trade.asset} ({trade.type.toUpperCase()})
            </h2>
            <p
              className={`text-xs ${secondaryText} transition-all duration-300 ${
                isHovered ? "opacity-100" : "opacity-80"
              }`}
            >
              {getStatusText()} • ${trade.amount.toFixed(2)}
              {progress >= 100 && result && (
                <span
                  className={`ml-2 font-bold ${
                    result === "win"
                      ? theme === "dark"
                        ? "text-emerald-400"
                        : "text-emerald-600"
                      : theme === "dark"
                      ? "text-red-400"
                      : "text-red-600"
                  }`}
                >
                  ({result === "win" ? "Win" : "Loss"})
                </span>
              )}
            </p>
          </div>
          <motion.div
            className={`text-lg lg:text-xl font-bold ${
              progress < 100
                ? "text-transparent bg-gradient-to-r from-cyan-400 to-teal-500 bg-clip-text"
                : result === "win"
                ? "text-emerald-400"
                : "text-red-400"
            }`}
            key={progress}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {Math.round(progress)}%
          </motion.div>
        </div>

        <div
          className={`${trackColor} rounded-full h-2.5 overflow-hidden mb-2`}
        >
          <motion.div
            className={`h-full ${
              progress < 100
                ? "bg-gradient-to-r from-cyan-500 to-teal-500"
                : result === "win"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                : "bg-gradient-to-r from-red-500 to-orange-500"
            } relative`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {progress > 0 && progress < 100 && (
              <motion.div
                className="absolute right-0 top-0 h-full w-1 bg-white opacity-70"
                animate={{ opacity: [0, 0.7, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "loop",
                }}
              />
            )}
          </motion.div>
        </div>

        <div className="flex justify-between text-[10px] mt-3">
          {[0, 25, 50, 75, 100].map((milestone) => (
            <div key={milestone} className="flex flex-col items-center">
              <div
                className={`w-2 h-2 rounded-full ${
                  progress >= milestone
                    ? "bg-teal-400 ring-2 ring-teal-400/30"
                    : trackColor
                } mb-0.5`}
              />
              <span className={`${secondaryText}`}>{milestone}%</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-4">
          <div className="text-xs text-slate-500">
            {progress < 100
              ? `Time remaining: ${formatTime(timeRemaining)}`
              : "Trade completed"}
          </div>

        {progress >= 100 ? (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs shadow-lg ${
              result === "win"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/20"
                : result === "loss"
                ? "bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-red-500/20"
                : theme === "dark"
                ? "bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-slate-700/30"
                : "bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-slate-500/30"
            }`}
            onClick={handleClearTrade}
            >
              Clear Completed
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={`px-3 py-1.5 rounded-lg font-medium text-xs ${
                theme === "dark"
                  ? "bg-slate-700 hover:bg-slate-600 text-slate-200"
                  : "bg-slate-200 hover:bg-slate-300 text-slate-700"
              } transition-colors`}
              onClick={toggleDetails}
            >
              Trade Details
            </motion.button>
          )}
        </div>
        {detailsOpen && (
          <div
            className={`mt-4 rounded-lg p-3 border ${
              theme === "dark"
                ? "border-slate-700 bg-slate-900 text-slate-200"
                : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <h4 className="text-sm font-semibold mb-2">Trade Snapshot</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="font-semibold">Placed</span>
              <span>{new Date(trade.date || Date.now()).toLocaleString()}</span>
              <span className="font-semibold">Lot Size</span>
              <span>{trade.lotSize || "N/A"} LS</span>
              <span className="font-semibold">TP / SL</span>
              <span>
                {trade.takeProfit || "N/A"} / {trade.stopLoss || "N/A"}
              </span>
              <span className="font-semibold">Duration</span>
              <span>{trade.duration || "5 Minutes"}</span>
              <span className="font-semibold">User</span>
              <span>{trade.userId || "Self"}</span>
            </div>
            <button
              onClick={toggleDetails}
              className="mt-3 text-xs uppercase tracking-wide font-semibold text-teal-500 hover:text-teal-600"
            >
              Close details
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TradeProgress;
