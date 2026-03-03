import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBell,
  faChartLine,
  faLightbulb,
  faMoon,
  faSignOutAlt,
  faTimes,
  faUser,
  faEnvelope,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useUser } from "../../../context/UserContext";
import { useNotifications } from "../../../context/NotificationContext";
import PropTypes from "prop-types";
import { API_BASE_URL } from "../../../config/api";
import { formatCurrencyAmount } from "../../../utils/currency";
import {
  getDashboardPageMeta,
  normalizeDashboardPath,
} from "../../../constants/dashboardPageMeta";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getPulseStats = (payload = {}) => {
  const revenue = payload?.revenue || {};
  return {
    grossRevenue: toNumber(revenue.grossRevenue, 0),
    activeTrades: toNumber(revenue.activeTrades, 0),
    winRate: toNumber(revenue.winRate, 0),
    roiPercent: toNumber(revenue.roiPercent, 0),
  };
};

const NotificationPanel = () => {
  const {
    notifications,
    unreadCount,
    showPanel,
    setShowPanel,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications();
  const { theme } = useTheme();
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (!showPanel) return;
      if (
        panelRef.current?.contains(event.target) ||
        buttonRef.current?.contains(event.target)
      ) {
        return;
      }
      setShowPanel(false);
    };
    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [showPanel, setShowPanel]);

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setShowPanel(!showPanel)}
        className="p-2 rounded-full transition relative"
        aria-label="Notifications"
      >
        <FontAwesomeIcon
          icon={faBell}
          className="h-5 w-5 text-slate-700 hover:text-teal-400 dark:text-slate-300 dark:hover:text-slate-800"
        />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-md">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {showPanel && (
        <div
          ref={panelRef}
          className={`absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-lg z-50 border ${
            theme === "dark" ? "border-slate-700" : "border-slate-200"
          } overflow-hidden`}
        >
          <div
            className={`px-4 py-2 flex justify-between items-center ${
              theme === "dark" ? "bg-slate-700" : "bg-slate-100"
            }`}
          >
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Notifications
            </h3>
            <button
              onClick={markAllAsRead}
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
            >
              Mark all as read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition ${
                    !notification.read
                      ? theme === "dark"
                        ? "bg-teal-900/30"
                        : "bg-teal-50"
                      : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm">{notification.text}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {notification.time} • {notification.date}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      className="ml-2 text-slate-400 hover:text-red-500"
                    >
                      <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                    </button>
                  </div>
                  {notification.type === "transaction" && (
                    <div className="mt-2 text-xs flex items-center text-teal-600 dark:text-teal-400">
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                      <span>Transaction ID: {notification.data?.id}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-600 text-center">
            <Link
              to="/Notification"
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
              onClick={() => setShowPanel(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

const HeaderPage = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, logoutUser, isLoading, isAuthenticated, getAuthToken } =
    useUser();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [menuPulse, setMenuPulse] = useState(() => getPulseStats(userData));
  const userMenuRef = useRef(null);
  const userMenuLinks = [
    { label: "Account", to: "/Account", icon: faUser },
    { label: "Watchlist", to: "/Watchlist", icon: faChartLine },
    { label: "Messages", to: "/Messages", icon: faEnvelope },
    { label: "Notifications", to: "/Notification", icon: faBell },
    { label: "Help Center", to: "/Help", icon: faLightbulb },
  ];

  const currentPage = getDashboardPageMeta(location.pathname).title;
  const isDashboardHome = normalizeDashboardPath(location.pathname) === "/dashboard";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMenuPulse(getPulseStats(userData));
  }, [userData]);

  const fetchProfilePulse = useCallback(async () => {
    if (!isAuthenticated) return;
    const token = getAuthToken?.();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/User/Dashboard`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) return;
      const result = await response.json();
      if (!result?.success || !result?.data) return;

      setMenuPulse(getPulseStats(result.data));
    } catch (error) {
      console.warn("Profile pulse sync failed:", error);
    }
  }, [getAuthToken, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    fetchProfilePulse();
    const interval = setInterval(fetchProfilePulse, 20000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchProfilePulse]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };


  // Show loading state
  if (isLoading) {
    return (
      <header className="h-16 w-full backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 shadow-sm px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center min-w-0">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-full transition"
            aria-label="Toggle sidebar"
          >
            <FontAwesomeIcon
              icon={faBars}
              className="h-5 w-5 text-slate-600 dark:text-slate-300"
            />
          </button>
          {currentPage && !isDashboardHome && (
            <h1 className="ml-3 max-w-[42vw] truncate text-xl font-semibold text-dark-teal dark:text-teal-400 md:ml-6 md:max-w-none md:text-2xl">
              {currentPage}
            </h1>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <div className="animate-pulse bg-slate-300 dark:bg-slate-600 h-8 w-8 rounded-full"></div>
          <div className="animate-pulse bg-slate-300 dark:bg-slate-600 h-8 w-24 rounded"></div>
        </div>
      </header>
    );
  }

  // Don't show header if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Get user name with fallbacks
  const getUserName = () => {
    return userData?.firstName || 
           userData?.name || 
           userData?.displayName || 
           userData?.email?.split('@')[0] || 
           'User';
  };

  const userName = getUserName();
  const currencyCode = userData?.currencyCode || "USD";
  const revenueLabel = formatCurrencyAmount(menuPulse.grossRevenue, currencyCode, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <header
      className="h-16 w-full backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 shadow-sm px-4 sm:px-6 lg:px-8 flex justify-between items-center text-slate-900 dark:text-white"
    >
      {/* Left Side */}
      <div className="flex items-center min-w-0">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-full transition"
          aria-label="Toggle sidebar"
        >
          <FontAwesomeIcon
            icon={faBars}
            className="h-5 w-5 text-slate-600 dark:text-slate-300"
          />
        </button>
        {currentPage && !isDashboardHome && (
          <h1 className="ml-3 max-w-[42vw] truncate text-xl font-semibold text-dark-teal dark:text-teal-400 md:ml-6 md:max-w-none md:text-2xl">
            {currentPage}
          </h1>
        )}
      </div>

      {/* Right Side */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-full transition"
          aria-label="Toggle theme"
        >
          <FontAwesomeIcon
            icon={theme === "dark" ? faLightbulb : faMoon}
            className="h-5 w-5 text-teal-700 hover:text-teal-400 dark:hover:text-teal-900 dark:text-teal-400"
          />
        </button>

        <NotificationPanel />

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            aria-label="User menu"
          >
            <div className="h-9 w-9 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
              {userData.photoURL ? (
                <img
                  src={userData.photoURL}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FontAwesomeIcon icon={faUser} className="text-xl text-slate-500" />
              )}
            </div>
            <span className="hidden md:inline text-sm font-medium truncate max-w-[120px] text-slate-700 dark:text-slate-300">
              {userName}
            </span>
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl z-50 border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {userName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {userData.email}
                </p>
              </div>
              <div className="px-3 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1.5">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Revenue
                    </p>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                      {revenueLabel}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1.5">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Active Trades
                    </p>
                    <p className="font-semibold text-cyan-600 dark:text-cyan-300">
                      {menuPulse.activeTrades}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1.5">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Win Rate
                    </p>
                    <p className="font-semibold text-violet-600 dark:text-violet-300">
                      {menuPulse.winRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1.5">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      ROI
                    </p>
                    <p className="font-semibold text-amber-600 dark:text-amber-300">
                      {menuPulse.roiPercent.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-2 py-1 space-y-1">
                {userMenuLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all ${
                      location.pathname === item.to
                        ? "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-100"
                        : "text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                    }`}
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <FontAwesomeIcon icon={item.icon} className="w-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2 w-full text-left text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition rounded-lg px-1 py-2"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

HeaderPage.propTypes = {
  isSidebarOpen: PropTypes.bool.isRequired,
  setIsSidebarOpen: PropTypes.func.isRequired,
};

export default HeaderPage;
