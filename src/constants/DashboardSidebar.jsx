import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faCoins,
  faWallet,
  faMoneyBillTransfer,
  faReceipt,
  faExchangeAlt,
  faUsers,
  faChartLine,
  faRobot,
  faBuilding,
  faUser,
  faUserCircle,
  faSignOutAlt,
  faBitcoinSign,
  faClipboardList,
} from "@fortawesome/free-solid-svg-icons";

export default function DashboardSidebar({ isCollapsed }) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();

  const mainLinks = [
    { to: "/Dashboard", icon: faHome, text: "Dashboard" },
    { to: "/Assets", icon: faCoins, text: "Assets" },
    { to: "/deposits", icon: faWallet, text: "Deposit" },
    { to: "/Withdrawal", icon: faMoneyBillTransfer, text: "Withdraw" },
    { to: "/PaymentProof", icon: faReceipt, text: "Payment Proof" },
    { to: "/transactions", icon: faExchangeAlt, text: "Transactions" },
    { to: "/Referrals", icon: faUsers, text: "Referral" },
  ];

  const tradingLinks = [
    { to: "/PlaceTrade", icon: faChartLine, text: "Place Trade" },
    { to: "/Subscription", icon: faClipboardList, text: "Subscription" },
    { to: "/MyTraders", icon: faUsers, text: "Copy Trade" },
    { to: "/DailySignal", icon: faChartLine, text: "Daily Signal" },
    { to: "/BuyBots", icon: faRobot, text: "Buy Bots" },
    { to: "/Mining", icon: faUsers, text: "Mining" },
    { to: "/Stake", icon: faCoins, text: "Stake" },
    { to: "/RealEstate", icon: faBuilding, text: "Real Estate" },
    { to: "/MyCopytraders", icon: faUsers, text: "My Copy Trade" },
    { to: "/TradesRoi", icon: faChartLine, text: "Trades/ROI" },
    { to: "/BuyCrypto", icon: faBitcoinSign, text: "Buy Crypto" },
  ];

  const userLinks = [
    { to: "/Account", icon: faUserCircle, text: "My Profile" },
    { to: "/VerifyAccount", icon: faUser, text: "Verify Account" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-2">
        <div className="space-y-1 px-2">
          {mainLinks.map(({ to, icon, text }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isCollapsed ? "justify-center" : "justify-start"
              } ${
                isActive(to)
                  ? "bg-slate-800 text-teal-500"
                  : "hover:bg-slate-800 hover:text-teal-500 text-gray-400"
              }`}
            >
              <FontAwesomeIcon
                icon={icon}
                className={`${isCollapsed ? "text-lg" : "text-lg mr-3"}`}
              />
              {!isCollapsed && (
                <span className="text-sm whitespace-nowrap">{text}</span>
              )}
            </Link>
          ))}
        </div>

        {!isCollapsed && (
          <div className="mt-4 px-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Trading
            </h3>
          </div>
        )}
        <div className="space-y-1 px-2">
          {tradingLinks.map(({ to, icon, text }, index) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isCollapsed && index >= 4
                  ? "hidden"
                  : isCollapsed
                  ? "justify-center"
                  : "justify-start"
              } ${
                isActive(to)
                  ? "bg-slate-800 text-teal-500"
                  : "hover:bg-slate-800 hover:text-teal-500 text-gray-400"
              }`}
            >
              <FontAwesomeIcon
                icon={icon}
                className={`${isCollapsed ? "text-lg" : "text-lg mr-3"}`}
              />
              {!isCollapsed && (
                <span className="text-sm whitespace-nowrap">{text}</span>
              )}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-auto space-y-2">
        {!isCollapsed && (
          <div className="px-3 pt-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Account
            </h3>
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={`flex items-center w-full p-3 hover:text-teal-600 hover:bg-slate-800 rounded-lg transition-colors ${
              isCollapsed ? "justify-center" : "justify-between"
            }`}
            aria-label="User Menu"
          >
            <span className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8">
                <FontAwesomeIcon icon={faUser} className="text-xl" />
              </div>
              {!isCollapsed && <span className="ml-3 text-base">User</span>}
            </span>
            {!isCollapsed && (
              <span className="text-xs">{isUserMenuOpen ? "▲" : "▼"}</span>
            )}
          </button>

          {isUserMenuOpen && !isCollapsed && (
            <div className="mt-1 ml-2 pl-6 border-l border-slate-700 space-y-2">
              {userLinks.map(({ to, icon, text }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center p-2 hover:text-teal-600 transition-colors rounded ${
                    isActive(to) ? "text-teal-600" : ""
                  }`}
                >
                  <FontAwesomeIcon icon={icon} className="text-lg mr-3" />
                  <span className="text-sm">{text}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link
          to="/"
          className={`flex items-center p-3 hover:text-teal-600 hover:bg-slate-800 rounded-lg transition-colors ${
            isActive("/") ? "text-teal-600 bg-slate-800" : ""
          } ${isCollapsed ? "justify-center" : "justify-start"}`}
          aria-label="Logout"
          title={isCollapsed ? "Logout" : undefined}
        >
          <div className="flex items-center justify-center w-8 h-8">
            <FontAwesomeIcon icon={faSignOutAlt} className="text-xl" />
          </div>
          {!isCollapsed && <span className="ml-3 text-base">Logout</span>}
        </Link>
      </div>
    </div>
  );
}
