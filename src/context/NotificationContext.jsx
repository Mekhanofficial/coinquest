import { useState, useEffect, createContext, useContext } from "react";
import { useTransactions } from "./TransactionContext";
import { useCopyTraders } from "./CopyTraderContext";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const { transactions = [] } = useTransactions();
  const [processedTransactionIds, setProcessedTransactionIds] = useState(new Set());
  const [processedCopyTraderIds, setProcessedCopyTraderIds] = useState(new Set());
  const { copiedTraders } = useCopyTraders();

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value || 0);

  // Load notifications from localStorage
  useEffect(() => {
    try {
      const savedNotifications = JSON.parse(
        localStorage.getItem("notifications") || "[]"
      );
      setNotifications(savedNotifications);
      setUnreadCount(savedNotifications.filter((n) => !n.read).length);
      
      // Load processed transaction IDs
      const savedProcessedIds = JSON.parse(
        localStorage.getItem("processedTransactionIds") || "[]"
      );
      setProcessedTransactionIds(new Set(savedProcessedIds));

      const savedCopyIds = JSON.parse(
        localStorage.getItem("processedCopyTraderIds") || "[]"
      );
      setProcessedCopyTraderIds(new Set(savedCopyIds));
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  // Save processed transaction IDs
  useEffect(() => {
    localStorage.setItem("processedTransactionIds", JSON.stringify([...processedTransactionIds]));
  }, [processedTransactionIds]);

  useEffect(() => {
    localStorage.setItem(
      "processedCopyTraderIds",
      JSON.stringify([...processedCopyTraderIds])
    );
  }, [processedCopyTraderIds]);

  // Add new notification - FIXED: Add to end of array for proper display order
  const addNotification = (message, type = "info", data = {}) => {
    const newNotification = {
      id: Date.now() + Math.random(), // More unique ID
      text: message,
      type,
      data,
      time: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(), // Add timestamp for proper sorting
      read: false,
    };

    setNotifications((prev) => [...prev, newNotification]); // Add to END for proper display
    setUnreadCount((prev) => prev + 1);
  };

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  // Remove notification
  const removeNotification = (id) => {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem("notifications", JSON.stringify(next));
      }
      const newUnread = next.filter((n) => !n.read).length;
      setUnreadCount(newUnread);
      return next;
    });
  };

  // Remove all notifications
  const removeAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    if (typeof window !== "undefined") {
      localStorage.setItem("notifications", "[]");
    }
  };

  // Get sorted notifications (newest first) for display
  const getSortedNotifications = () => {
    return [...notifications].sort((a, b) => b.timestamp - a.timestamp);
  };

  // Notify when a copy trader is added
  useEffect(() => {
    if (!copiedTraders || copiedTraders.length === 0) return;

    const newCopies = copiedTraders.filter(
      (trader) => trader?.id && !processedCopyTraderIds.has(trader.id)
    );

    if (newCopies.length === 0) return;

    newCopies.forEach((trader) => {
      addNotification(
        `Copy trading ${trader.name} with ${formatCurrency(trader.investmentAmount)}`,
        "info",
        {
          amount: trader.investmentAmount,
          trader,
        }
      );
    });

    setProcessedCopyTraderIds((prev) => {
      const next = new Set(prev);
      newCopies.forEach((trader) => next.add(trader.id));
      return next;
    });
  }, [copiedTraders, processedCopyTraderIds, addNotification]);

  // Handle transaction notifications - FIXED: Prevent duplicates
  useEffect(() => {
    if (!transactions || transactions.length === 0) return;

    const newTransactions = transactions.filter(
      transaction => 
        transaction?.id && 
        !processedTransactionIds.has(transaction.id) &&
        transaction?.type
    );

    if (newTransactions.length === 0) return;

    newTransactions.forEach((transaction) => {
      let message = "";
      let notificationType = "transaction";

      try {
        switch (transaction.type.toLowerCase()) {
          case "deposit":
            if (transaction.status === "Completed") {
              message = `✅ Deposit completed: $${transaction.amount || 0} ${transaction.currency || ''}`;
              notificationType = "success";
            } else if (transaction.status === "Pending") {
              message = `⏳ Deposit pending: $${transaction.amount || 0} ${transaction.currency || ''}`;
              notificationType = "info";
            } else if (transaction.status === "Failed") {
              message = `❌ Deposit failed: $${transaction.amount || 0} ${transaction.currency || ''}`;
              notificationType = "error";
            }
            break;
          case "withdrawal":
            if (transaction.status === "Completed") {
              message = `✅ Withdrawal completed: $${transaction.amount || 0} ${transaction.currency || ''}`;
              notificationType = "success";
            } else if (transaction.status === "Pending") {
              message = `⏳ Withdrawal pending: $${transaction.amount || 0} ${transaction.currency || ''}`;
              notificationType = "info";
            } else if (transaction.status === "Failed") {
              message = `❌ Withdrawal failed: $${transaction.amount || 0} ${transaction.currency || ''}`;
              notificationType = "error";
            }
            break;
          case "subscription":
            if (transaction.status === "Cancelled") {
              message = `📦 Subscription to ${transaction.method || "plan"} cancelled`;
            } else if (transaction.status === "Pending") {
              message = `⏳ Subscription to ${transaction.method || "plan"} pending`;
            } else {
              message = `📦 Subscription to ${transaction.method || "plan"} activated`;
            }
            break;
          case "signal":
            if (transaction.status === "Cancelled") {
              message = `📡 Signal service ${transaction.signalDetails?.planName || transaction.method || "signal"} cancelled`;
            } else if (transaction.status === "Pending") {
              message = `⏳ Signal service ${transaction.signalDetails?.planName || transaction.method || "signal"} pending`;
            } else {
              message = `📡 Signal service ${transaction.signalDetails?.planName || transaction.method || "signal"} purchased`;
            }
            break;
          case "bot":
            message = `🤖 ${transaction.botDetails?.name || "Trading"} bot activated`;
            break;
          default:
            if (transaction.status === "Completed") {
              message = `✅ Transaction completed: ${transaction.description || "Payment processed"}`;
              notificationType = "success";
            } else {
              message = `ℹ️ Transaction ${transaction.status?.toLowerCase() || "processed"}: ${transaction.description || "Updated"}`;
            }
        }

        if (message) {
          addNotification(message, notificationType, transaction);
        }
      } catch (error) {
        console.error("Error creating transaction notification:", error);
      }
    });

    // Mark all new transactions as processed
    const newIds = newTransactions.map(t => t.id);
    setProcessedTransactionIds(prev => new Set([...prev, ...newIds]));

  }, [transactions, processedTransactionIds]);

  return (
    <NotificationContext.Provider
      value={{
        notifications: getSortedNotifications(), // Return sorted notifications
        unreadCount,
        showPanel,
        setShowPanel,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        removeAllNotifications,
        getSortedNotifications, // Also expose the function if needed
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
