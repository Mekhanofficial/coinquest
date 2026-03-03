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
  faEnvelope,
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
    { to: "/Messages", icon: faEnvelope, text: "Messages" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-full flex-col overflow-x-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        <div className="space-y-1 px-2">
          {mainLinks.map(({ to, icon, text }) => (
            <Link
              key={to}
              to={to}
              className={`flex w-full min-w-0 items-center rounded-lg p-3 transition-colors ${
                isCollapsed ? "justify-center" : "justify-start"
              } ${
                isActive(to)
                  ? "bg-slate-800 text-teal-500"
                  : "text-gray-400 hover:bg-slate-800 hover:text-teal-500"
              }`}
            >
              <FontAwesomeIcon
                icon={icon}
                className={`${isCollapsed ? "text-lg" : "mr-3 text-lg"}`}
              />
              {!isCollapsed && (
                <span className="truncate whitespace-nowrap text-sm">{text}</span>
              )}
            </Link>
          ))}
        </div>

        {!isCollapsed && (
          <div className="mt-4 px-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Trading
            </h3>
          </div>
        )}

        <div className="space-y-1 px-2">
          {tradingLinks.map(({ to, icon, text }, index) => (
            <Link
              key={to}
              to={to}
              className={`flex w-full min-w-0 items-center rounded-lg p-3 transition-colors ${
                isCollapsed && index >= 4
                  ? "hidden"
                  : isCollapsed
                    ? "justify-center"
                    : "justify-start"
              } ${
                isActive(to)
                  ? "bg-slate-800 text-teal-500"
                  : "text-gray-400 hover:bg-slate-800 hover:text-teal-500"
              }`}
            >
              <FontAwesomeIcon
                icon={icon}
                className={`${isCollapsed ? "text-lg" : "mr-3 text-lg"}`}
              />
              {!isCollapsed && (
                <span className="truncate whitespace-nowrap text-sm">{text}</span>
              )}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-auto space-y-2 pb-1">
        {!isCollapsed && (
          <div className="px-3 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Account
            </h3>
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={`flex w-full min-w-0 items-center rounded-lg p-3 transition-colors hover:bg-slate-800 hover:text-teal-600 ${
              isCollapsed ? "justify-center" : "justify-between"
            }`}
            aria-label="User Menu"
          >
            <span className="flex min-w-0 items-center">
              <div className="flex h-8 w-8 items-center justify-center">
                <FontAwesomeIcon icon={faUser} className="text-xl" />
              </div>
              {!isCollapsed && <span className="ml-3 truncate text-base">User</span>}
            </span>
            {!isCollapsed && (
              <span className="text-xs">{isUserMenuOpen ? "^" : "v"}</span>
            )}
          </button>

          {isUserMenuOpen && !isCollapsed && (
            <div className="mt-1 ml-2 space-y-2 border-l border-slate-700 pl-6">
              {userLinks.map(({ to, icon, text }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex min-w-0 items-center rounded p-2 transition-colors hover:text-teal-600 ${
                    isActive(to) ? "text-teal-600" : ""
                  }`}
                >
                  <FontAwesomeIcon icon={icon} className="mr-3 text-lg" />
                  <span className="truncate text-sm">{text}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link
          to="/"
          className={`flex items-center rounded-lg p-3 transition-colors hover:bg-slate-800 hover:text-teal-600 ${
            isActive("/") ? "bg-slate-800 text-teal-600" : ""
          } ${isCollapsed ? "justify-center" : "justify-start"}`}
          aria-label="Logout"
          title={isCollapsed ? "Logout" : undefined}
        >
          <div className="flex h-8 w-8 items-center justify-center">
            <FontAwesomeIcon icon={faSignOutAlt} className="text-xl" />
          </div>
          {!isCollapsed && <span className="ml-3 text-base">Logout</span>}
        </Link>
      </div>
    </div>
  );
}
