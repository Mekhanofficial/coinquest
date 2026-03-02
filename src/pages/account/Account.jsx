import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserFriends,
  faStar,
  faMoneyBill,
  faEnvelope,
  faUser,
  faLock,
  faSignOutAlt,
  faShield,
  faChartLine,
  faWallet,
  faBell,
  faQuestionCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useTransactions } from "../../context/TransactionContext";
import { useUser } from "../../context/UserContext";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const formatCurrency = (value) =>
  currencyFormatter.format(Number.isFinite(value) ? value : 0);

const formatCount = (value) =>
  Number.isFinite(value) ? value.toLocaleString() : "0";

export default function AccountPage() {
  const { theme } = useTheme();
  const { userData, isAuthenticated, logoutUser, isLoading } = useUser();
  const { transactions = [] } = useTransactions();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("account");
  const [dots, setDots] = useState(0);
  const completedWithdrawalsTotal = useMemo(() => {
    if (!transactions || transactions.length === 0) return 0;
    return transactions.reduce((sum, tx) => {
      const type = (tx.type || "").toLowerCase();
      if (type !== "withdrawal") return sum;
      if (tx.status !== "Completed") return sum;
      return sum + (parseFloat(tx.amount) || 0);
    }, 0);
  }, [transactions]);

  const referralCount = useMemo(() => {
    if (!userData) return 0;
    if (typeof userData.referralCount === "number") return userData.referralCount;
    if (Array.isArray(userData.referrals)) return userData.referrals.length;
    if (typeof userData.referralsCount === "number") return userData.referralsCount;
    if (userData.referralStats?.count) return userData.referralStats.count;
    return 0;
  }, [userData]);

  const accountStats = useMemo(() => {
    const balanceValue = Number.isFinite(userData?.balance) ? userData.balance : 0;
    const portfolioValue = Number.isFinite(userData?.portfolioValue)
      ? userData.portfolioValue
      : balanceValue;

    return [
      {
        icon: faWallet,
        title: "Balance",
        value: formatCurrency(balanceValue),
        color: "text-teal-400",
      },
      {
        icon: faChartLine,
        title: "Portfolio",
        value: formatCurrency(portfolioValue),
        color: "text-emerald-400",
      },
      {
        icon: faMoneyBill,
        title: "Withdrawn",
        value: formatCurrency(completedWithdrawalsTotal),
        color: "text-teal-400",
      },
      {
        icon: faUserFriends,
        title: "Referrals",
        value: formatCount(referralCount),
        color: "text-purple-400",
      },
    ];
  }, [userData, completedWithdrawalsTotal, referralCount]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const timer = setTimeout(() => navigate("/LoginPage"), 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (!isAuthenticated || !userData) {
      const interval = setInterval(() => {
        setDots((prev) => (prev < 3 ? prev + 1 : 0));
      }, 500);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, userData]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
      navigate("/LoginPage");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const profile = userData || {
    uid: "",
    name: "User",
    email: "user@example.com",
    photoURL: null,
  };

  const profileName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    profile.name ||
    "User";

  const getStoredSubscriptionPlan = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("currentPlan");
  };

  const subscriptionPlanLabel =
    userData?.subscriptionPlan || getStoredSubscriptionPlan() || "Basic";

  const isProfileLoading = isLoading || !isAuthenticated || !userData;

  if (isProfileLoading) {
    return (
      <div
        className={` pt-10 min-h-screen flex items-center justify-center ${
          theme === "dark"
            ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white"
            : "bg-gradient-to-b from-gray-100 to-gray-200 text-gray-800"
        }`}
      >
        <div className="relative w-full max-w-md px-4">
          {/* Animated background elements */}
          <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-teal-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-emerald-500/15 rounded-full blur-3xl animate-ping-slow"></div>

          {/* Main loading card */}
          <div className="relative bg-slate-800/30 backdrop-blur-lg rounded-2xl border border-slate-700/50 p-8 shadow-2xl overflow-hidden">
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-500/10 to-transparent animate-shimmer"></div>

            {/* Animated logo */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg animate-pulse-slow">
                  <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-300 to-emerald-300 rounded-full animate-bounce"></div>
                  </div>
                </div>
                <div className="absolute -inset-2 border-2 border-teal-500/30 rounded-full animate-ping-slow"></div>
              </div>
            </div>

            {/* Loading text */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2 flex justify-center items-center">
                Loading your account
                <span className="w-8 ml-1">
                  {Array(dots + 1)
                    .fill(".")
                    .join("")}
                </span>
              </h2>
              <p className="text-slate-400 mb-8">Securely fetching your data</p>

              {/* Animated progress */}
              <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden mx-auto w-3/4">
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full w-3/4 animate-loading-bar"></div>
              </div>
            </div>

            {/* Decorative particles */}
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-teal-400 rounded-full opacity-30 animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-10 h-10 bg-emerald-400 rounded-full opacity-20 animate-ping-slow"></div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-slate-500 text-sm">
            <p>Secured with end-to-end encryption</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen pt-10 ${
        theme === "dark"
          ? "bg-gradient-to-br from-slate-950 to-slate-900 text-white"
          : "bg-gradient-to-b from-gray-100 to-gray-200 text-gray-800"
      }`}
    >
      {/* Profile Card */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
          <div className="relative h-40 bg-gradient-to-r from-teal-700 to-emerald-700">
            <div className="absolute -bottom-16 left-8">
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-slate-800 shadow-xl"
                />
              ) : (
                <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center shadow-xl border-4 border-slate-800">
                  <FontAwesomeIcon
                    icon={faUser}
                    className="text-5xl text-teal-400"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="pt-20 px-8 pb-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <div>
              <h2 className="text-3xl font-bold">{profileName}</h2>
              <p className="text-slate-400 mt-1">{profile.email}</p>

                <div className="flex mt-4 space-x-3">
                  <div className="bg-slate-700 px-3 py-1 rounded-full text-sm flex items-center">
                    <FontAwesomeIcon
                      icon={faShield}
                      className="text-teal-400 mr-2"
                    />
                    <span>Verified Account</span>
                  </div>
                  <div className="bg-slate-700 px-3 py-1 rounded-full text-sm flex items-center">
                    <FontAwesomeIcon
                      icon={faChartLine}
                      className="text-emerald-400 mr-2"
                    />
                    <span>{subscriptionPlanLabel} Member</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate("/updatephotopage")}
                className="mt-4 md:mt-0 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 px-6 py-3 rounded-lg font-medium shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                Edit Profile
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {accountStats.map((stat) => (
                <StatCard
                  key={stat.title}
                  icon={stat.icon}
                  title={stat.title}
                  value={stat.value}
                  color={stat.color}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="max-w-4xl mx-auto mt-8 mb-20">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <ActionButton
              icon={faUserFriends}
              text="Referrals"
              iconColor="text-purple-400"
              onClick={() => navigate("/referrals")}
            />
            <ActionButton
              icon={faStar}
              text="Watch List"
              iconColor="text-teal-400"
              onClick={() => navigate("/Watchlist")}
            />
            <ActionButton
              icon={faEnvelope}
              text="Update Email"
              iconColor="text-blue-400"
              onClick={() => navigate("/EmailUpdate")}
            />
            <ActionButton
              icon={faMoneyBill}
              text="Withdrawals"
              iconColor="text-emerald-400"
              onClick={() => navigate("/Withdrawal")}
            />
            <ActionButton
              icon={faUser}
              text="Update Photo"
              iconColor="text-pink-400"
              onClick={() => navigate("/UpdatePhotoPage")}
            />
            <ActionButton
              icon={faLock}
              text="Update Password"
              iconColor="text-cyan-400"
              onClick={() => navigate("/PasswordUpdate")}
            />
            <ActionButton
              icon={faBell}
              text="Notifications"
              iconColor="text-teal-400"
              onClick={() => navigate("/Notification")}
            />
            <ActionButton
              icon={faQuestionCircle}
              text="Help Center"
              iconColor="text-teal-400"
              onClick={() => navigate("/Help")}
            />
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-500/20 w-12 h-12 rounded-full flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faSignOutAlt}
                  className="text-red-500 text-xl"
                />
              </div>
              <h3 className="text-xl font-bold text-white">Confirm Logout</h3>
            </div>
            <p className="text-slate-300 mb-6">
              You'll need to sign in again to access your account. Are you sure
              you want to logout?
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-5 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Logging Out...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSignOutAlt} />
                    Log Out
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({ icon, text, iconColor, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center p-5 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl text-center shadow-md transition-all hover:border-teal-500 hover:bg-slate-800 hover:shadow-xl transform hover:-translate-y-1 duration-300 group"
    >
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-slate-700 group-hover:bg-gradient-to-r from-teal-700 to-emerald-700 ${iconColor}`}
      >
        <FontAwesomeIcon icon={icon} className="text-2xl" />
      </div>
      <span className="font-medium text-sm">{text}</span>
    </button>
  );
}

function StatCard({ icon, title, value, color }) {
  return (
    <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-xl p-4 hover:border-teal-500 transition-colors">
      <div className="flex items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center bg-slate-700 ${color}`}
        >
          <FontAwesomeIcon icon={icon} />
        </div>
        <div className="ml-3">
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}
