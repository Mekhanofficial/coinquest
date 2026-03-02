// src/pages/NotificationsPage.js
import { useEffect } from "react";
import { useNotifications } from "../../context/NotificationContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCheckCircle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "next-themes";

const NotificationsPage = () => {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    removeAllNotifications,
  } = useNotifications();
  const { theme } = useTheme();

  useEffect(() => {
    // Mark all as read when page loads
    markAllAsRead();
  }, [markAllAsRead]); // Added dependency

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-6 gap-2">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Notifications
          </h1>
          <div className="flex gap-3">
            <button
              onClick={markAllAsRead}
              className="text-sm text-teal-600 dark:text-teal-400 hover:underline"
            >
              Mark all as read
            </button>
            <button
              onClick={removeAllNotifications}
              className="text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Clear all
            </button>
          </div>
        </div>

      <div
        className={`rounded-xl shadow-md overflow-hidden ${
          theme === "dark" ? "bg-slate-800" : "bg-white"
        }`}
      >
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            No notifications to display
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition ${
                  !notification.read
                    ? theme === "dark"
                      ? "bg-teal-900/30"
                      : "bg-teal-50"
                    : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {notification.text}
                    </p>
                    <div className="flex items-center mt-1">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {notification.time} • {notification.date}
                      </p>
                      {notification.type === "transaction" && (
                        <span className="ml-2 text-xs flex items-center text-teal-600 dark:text-teal-400">
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            className="mr-1 h-3 w-3"
                          />
                          Transaction
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="ml-2 text-slate-400 hover:text-red-500"
                  >
                    <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
