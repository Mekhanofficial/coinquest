"use client";

import { useTheme } from "next-themes";
import { useTransactions } from "../../context/TransactionContext";
import { useEffect, useMemo, useState } from "react";
import PaginationControls from "../ui/PaginationControls";

const FILTER_STORAGE_KEY = "coinquest:transaction-history-filter";
const SEARCH_STORAGE_KEY = "coinquest:transaction-history-search";

const FILTER_OPTIONS = [
  { value: "all", label: "All Transactions" },
  { value: "deposits", label: "Deposits" },
  { value: "withdrawals", label: "Withdrawals" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "rejected", label: "Rejected" },
];

const safeReadStorage = (key, fallback = "") => {
  try {
    if (typeof window === "undefined") return fallback;
    return sessionStorage.getItem(key) || fallback;
  } catch (error) {
    console.warn("Unable to read from sessionStorage:", error);
    return fallback;
  }
};

export default function TransactionPage() {
  const { theme } = useTheme();
  const {
    transactions,
    loading,
    refreshTransactions,
    lastRefreshTime,
  } = useTransactions();
  const [filter, setFilter] = useState(() =>
    safeReadStorage(FILTER_STORAGE_KEY, "all")
  );
  const [searchTerm, setSearchTerm] = useState(() =>
    safeReadStorage(SEARCH_STORAGE_KEY, "")
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Refresh transactions when component mounts
  useEffect(() => {
    refreshTransactions?.();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(FILTER_STORAGE_KEY, filter);
  }, [filter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(SEARCH_STORAGE_KEY, searchTerm);
  }, [searchTerm]);

  const filteredTransactions = useMemo(() => {
    const normalizedFilter = filter.toLowerCase();
    const normalizedSearch = searchTerm.trim().toLowerCase();

    let list = [...transactions];

    if (normalizedFilter === "deposits") {
      list = list.filter(
        (tx) => (tx.type || "").toLowerCase() === "deposit"
      );
    } else if (normalizedFilter === "withdrawals") {
      list = list.filter(
        (tx) => (tx.type || "").toLowerCase() === "withdrawal"
      );
    } else if (["pending", "completed", "failed", "rejected"].includes(normalizedFilter)) {
      list = list.filter(
        (tx) => (tx.status || "").toLowerCase() === normalizedFilter
      );
    }

    if (normalizedSearch) {
      list = list.filter((tx) => {
        const searchable = `${tx.id} ${tx.method} ${tx.currency} ${tx.type} ${tx.status}`
          .toLowerCase();
        return searchable.includes(normalizedSearch);
      });
    }

    return list;
  }, [transactions, filter, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm, transactions.length, pageSize]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / pageSize)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  const statusCounts = useMemo(() => {
    const counts = {
      total: transactions.length,
      completed: 0,
      pending: 0,
      failed: 0,
      rejected: 0,
    };

    transactions.forEach((tx) => {
      const status = (tx.status || "").toLowerCase();
      if (status === "completed") counts.completed += 1;
      if (status === "pending") counts.pending += 1;
      if (status === "failed") counts.failed += 1;
      if (status === "rejected") counts.rejected += 1;
    });

    return counts;
  }, [transactions]);

  const lastUpdatedLabel = lastRefreshTime
    ? new Date(lastRefreshTime).toLocaleString()
    : "Not synchronized yet";

  const activeFilterLabel =
    FILTER_OPTIONS.find((option) => option.value === filter)?.label ||
    "Filtered";
  const normalizedSearch = searchTerm.trim();
  const emptyMessage = normalizedSearch
    ? `No transactions matched "${normalizedSearch}" while filtering by ${activeFilterLabel.toLowerCase()}.`
    : filter === "all"
      ? "Your transaction history will appear here once you make your first deposit or withdrawal."
      : `No ${activeFilterLabel.toLowerCase()} transactions found. Try expanding the filter.`;

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "text-green-500";
      case "Pending":
        return "text-yellow-500";
      case "Failed":
      case "Rejected":
        return "text-red-500";
      default:
        return theme === "dark" ? "text-gray-300" : "text-gray-700";
    }
  };

  const getAmountColor = (type) => {
    return type === "Deposit" ? "text-green-500" : "text-red-500";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      
      const options = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  const formatAmount = (amount) => {
    if (typeof amount === 'number') {
      return `$${amount.toFixed(2)}`;
    }
    if (typeof amount === 'string') {
      return `$${parseFloat(amount).toFixed(2)}`;
    }
    return "$0.00";
  };

  return (
    <div
      className={`min-h-screen px-4 py-8 sm:px-6 lg:px-8 ${
        theme === "dark" ? "bg-zinc-950" : "bg-gray-50"
      }`}
    >
      <div
        className={`w-full rounded-xl p-6 ${
          theme === "dark" ? "bg-slate-900" : "bg-white"
        }`}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <p
              className={`text-sm mt-1 ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Last refreshed: {lastUpdatedLabel}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`text-sm font-medium ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Total records: {transactions.length}
            </span>
            <button
              onClick={() => refreshTransactions?.()}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                theme === "dark"
                  ? "bg-slate-700 hover:bg-slate-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              }`}
            >
              Refresh
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "All", value: statusCounts.total },
            { label: "Completed", value: statusCounts.completed },
            { label: "Pending", value: statusCounts.pending },
            {
              label: "Failed / Rejected",
              value: statusCounts.failed + statusCounts.rejected,
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`border rounded-lg p-3 text-sm ${
                theme === "dark"
                  ? "bg-slate-900 border-slate-700 text-gray-200"
                  : "bg-white border-gray-200 text-gray-700"
              }`}
            >
              <p className="uppercase tracking-wide text-[10px] text-gray-400 mb-1">
                {card.label}
              </p>
              <p className="text-lg font-semibold">{card.value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-1">
              Filter by type / status
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                theme === "dark"
                  ? "bg-slate-800 text-white border-slate-700"
                  : "bg-white text-gray-800 border-gray-300"
              }`}
            >
              {FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-1">
              Search by keyword, method, ID, or currency
            </label>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g., BTC, 0xabc, Completed"
              className={`w-full px-4 py-2 rounded-lg border ${
                theme === "dark"
                  ? "bg-slate-800 text-white border-slate-700"
                  : "bg-white text-gray-800 border-gray-300"
              }`}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex flex-wrap justify-between items-center text-xs mb-3 uppercase tracking-wide text-gray-500">
              <span>
                Showing {paginatedTransactions.length} of {filteredTransactions.length} filtered ({transactions.length} total)
              </span>
              <span>Filter: {activeFilterLabel}</span>
            </div>
            {filteredTransactions.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr
                    className={`border-b ${
                      theme === "dark" ? "border-slate-700" : "border-gray-200"
                    }`}
                  >
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Amount</th>
                    <th className="text-left p-3 font-medium">Currency</th>
                    <th className="text-left p-3 font-medium hidden lg:table-cell">
                      Payment Method
                    </th>
                    <th className="text-left p-3 font-medium hidden md:table-cell">Date</th>
                    <th className="text-left p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className={`border-b ${
                        theme === "dark"
                          ? "border-slate-800 hover:bg-slate-800"
                          : "border-gray-100 hover:bg-gray-50"
                      } transition-colors`}
                    >
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          tx.type === "Deposit" 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td
                        className={`p-3 font-medium ${getAmountColor(tx.type)}`}
                      >
                        {formatAmount(tx.amount)}
                      </td>
                      <td className="p-3">
                        {tx.currency || "N/A"}
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        {tx.method || tx.paymentMethod || "N/A"}
                      </td>
                      <td className="p-3 hidden md:table-cell text-sm">
                        {formatDate(tx.date || tx.createdAt)}
                      </td>
                      <td className={`p-3 font-medium ${getStatusColor(tx.status)}`}>
                        <span className={`px-2 py-1 rounded text-xs ${
                          tx.status === "Completed" ? "bg-green-100 dark:bg-green-900" :
                          tx.status === "Pending" ? "bg-yellow-100 dark:bg-yellow-900" :
                          "bg-red-100 dark:bg-red-900"
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-10 text-center">
                <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  theme === "dark" ? "bg-slate-800" : "bg-gray-200"
                }`}>
                  <span className="text-2xl">📝</span>
                </div>
                <p
                  className={`text-lg mb-2 ${
                    theme === "dark" ? "text-slate-500" : "text-gray-500"
                  }`}
                >
                  No transactions found
                </p>
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-slate-600" : "text-gray-600"
                  }`}
                >
                  {emptyMessage}
                </p>
              </div>
            )}

            {filteredTransactions.length > 0 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredTransactions.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 20, 50]}
                itemLabel="transactions"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
