import { useState, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy,
  faUserFriends,
  faShareAlt,
  faChartLine,
  faGift,
  faCoins,
  faQrcode,
  faEnvelope,
  faMessage,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import {
  faTwitter,
  faFacebook,
  faWhatsapp,
  faTelegram,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";
import { API_BASE_URL } from "../../config/api";
import { useUser } from "../../context/UserContext";
import { formatCurrencyAmount } from "../../utils/currency";
import PaginationControls from "../../components/ui/PaginationControls";

export default function ReferralsPage() {
  const { theme } = useTheme();
  const { getAuthToken, userData } = useUser();
  const referralCurrency = userData?.currencyCode || "USD";
  const [copied, setCopied] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [activeTab, setActiveTab] = useState("referrals");
  const [referralLink, setReferralLink] = useState("");
  const [referrals, setReferrals] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, earnings: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [referralsPage, setReferralsPage] = useState(1);
  const [rewardsPage, setRewardsPage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);

  const totalReferrals = stats.total || referrals.length;
  const activeReferrals =
    stats.active || referrals.filter((ref) => ref.status === "Active").length;
  const totalEarnings =
    stats.earnings ||
    referrals.reduce((sum, ref) => sum + (Number(ref.earnings) || 0), 0);

  const fetchReferralOverview = async () => {
    const token = getAuthToken?.();
    if (!token) {
      setErrorMessage("Please log in to view referrals.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Referral/Overview`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Failed to load referrals");
      }

      const data = result.data || {};
      setReferralLink(data.referralLink || "");
      setStats(data.stats || { total: 0, active: 0, earnings: 0 });
      setReferrals(data.referrals || []);
      setRewards(data.rewards || []);
      setErrorMessage("");
    } catch (error) {
      console.error("Failed to load referrals:", error);
      setErrorMessage(error.message || "Unable to load referrals.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralOverview();
  }, []);

  useEffect(() => {
    setReferralsPage(1);
  }, [tablePageSize, referrals.length]);

  useEffect(() => {
    setRewardsPage(1);
  }, [tablePageSize, rewards.length]);

  const referralsTotalPages = Math.max(
    1,
    Math.ceil(referrals.length / tablePageSize)
  );
  const rewardsTotalPages = Math.max(1, Math.ceil(rewards.length / tablePageSize));

  useEffect(() => {
    if (referralsPage > referralsTotalPages) {
      setReferralsPage(referralsTotalPages);
    }
  }, [referralsPage, referralsTotalPages]);

  useEffect(() => {
    if (rewardsPage > rewardsTotalPages) {
      setRewardsPage(rewardsTotalPages);
    }
  }, [rewardsPage, rewardsTotalPages]);

  const paginatedReferrals = useMemo(() => {
    const start = (referralsPage - 1) * tablePageSize;
    return referrals.slice(start, start + tablePageSize);
  }, [referrals, referralsPage, tablePageSize]);

  const paginatedRewards = useMemo(() => {
    const start = (rewardsPage - 1) * tablePageSize;
    return rewards.slice(start, start + tablePageSize);
  }, [rewards, rewardsPage, tablePageSize]);

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleShareOptions = () => {
    setShowShareOptions(!showShareOptions);
  };

  const shareVia = (platform) => {
    let shareUrl = "";

    if (!referralLink) {
      return;
    }

    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=Join%20coinquest%20with%20my%20referral%20link&url=${encodeURIComponent(
          referralLink
        )}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          referralLink
        )}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=Join%20coinquest%20with%20my%20referral%20link:%20${encodeURIComponent(
          referralLink
        )}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
          referralLink
        )}&text=Join%20coinquest%20with%20my%20referral%20link`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          referralLink
        )}`;
        break;
      case "email":
      case "sms":
      default:
        // Just copy to clipboard for these
        handleCopy();
        return;
    }

    window.open(shareUrl, "_blank");
  };

  // Format currency
  const formatCurrency = (amount) => {
    return formatCurrencyAmount(amount, referralCurrency);
  };

  return (
    <div
      className={`min-h-screen ${
        theme === "dark" ? "bg-zinc-950" : "bg-gray-50"
      }`}
    >
      <div className="w-full px-4 py-10 sm:px-6 lg:px-8">

        {(errorMessage || isLoading) && (
          <div className="w-full mb-8 space-y-3">
            {errorMessage && (
              <div className="rounded-2xl bg-red-900/20 border border-red-500/50 text-red-300 px-4 py-3 text-sm">
                {errorMessage}
              </div>
            )}
            {isLoading && (
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  theme === "dark"
                    ? "bg-slate-800 border border-slate-700 text-slate-300"
                    : "bg-white border border-slate-200 text-slate-600"
                }`}
              >
                Loading referral data...
              </div>
            )}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div
            className={`rounded-2xl shadow-lg p-6 ${
              theme === "dark" ? "bg-slate-800" : "bg-white"
            }`}
          >
            <div className="flex items-center">
              <div
                className={`p-3 rounded-full mr-4 ${
                  theme === "dark" ? "bg-teal-900/50" : "bg-teal-100"
                }`}
              >
                <FontAwesomeIcon
                  icon={faUserFriends}
                  className={`h-6 ${
                    theme === "dark" ? "text-teal-400" : "text-teal-600"
                  }`}
                />
              </div>
              <div>
                <h3
                  className={`text-sm ${
                    theme === "dark" ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  Total Referrals
                </h3>
                <p className="text-2xl font-bold">{totalReferrals}</p>
              </div>
            </div>
          </div>

          <div
            className={`rounded-2xl shadow-lg p-6 ${
              theme === "dark" ? "bg-slate-800" : "bg-white"
            }`}
          >
            <div className="flex items-center">
              <div
                className={`p-3 rounded-full mr-4 ${
                  theme === "dark" ? "bg-blue-900/50" : "bg-blue-100"
                }`}
              >
                <FontAwesomeIcon
                  icon={faChartLine}
                  className={`h-6 ${
                    theme === "dark" ? "text-blue-400" : "text-blue-600"
                  }`}
                />
              </div>
              <div>
                <h3
                  className={`text-sm ${
                    theme === "dark" ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  Active Referrals
                </h3>
                <p className="text-2xl font-bold">{activeReferrals}</p>
              </div>
            </div>
          </div>

          <div
            className={`rounded-2xl shadow-lg p-6 ${
              theme === "dark" ? "bg-slate-800" : "bg-white"
            }`}
          >
            <div className="flex items-center">
              <div
                className={`p-3 rounded-full mr-4 ${
                  theme === "dark" ? "bg-teal-900/50" : "bg-teal-100"
                }`}
              >
                <FontAwesomeIcon
                  icon={faCoins}
                  className={`h-6 ${
                    theme === "dark" ? "text-teal-400" : "text-teal-600"
                  }`}
                />
              </div>
              <div>
                <h3
                  className={`text-sm ${
                    theme === "dark" ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  Total Earnings
                </h3>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalEarnings)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Program Card */}
        <div
          className={`rounded-2xl shadow-xl overflow-hidden mb-12 ${
            theme === "dark"
              ? "bg-gradient-to-r from-slate-800 to-slate-900"
              : "bg-gradient-to-r from-white to-slate-50"
          }`}
        >
          <div className="p-8 flex flex-col lg:flex-row gap-8 items-stretch">
            {/* Program Details */}
            <div className="flex-1">
              <div
                className={`p-6 rounded-xl h-full ${
                  theme === "dark" ? "bg-slate-700/30" : "bg-slate-100"
                } border ${
                  theme === "dark" ? "border-slate-700" : "border-slate-200"
                }`}
              >
                <div className="flex items-center mb-6">
                  <div
                    className={`p-3 rounded-lg ${
                      theme === "dark" ? "bg-purple-900/50" : "bg-purple-100"
                    } mr-4`}
                  >
                    <FontAwesomeIcon
                      icon={faGift}
                      className={`h-6 ${
                        theme === "dark" ? "text-purple-400" : "text-purple-600"
                      }`}
                    />
                  </div>
                  <h2
                    className={`text-2xl font-bold ${
                      theme === "dark" ? "text-white" : "text-slate-800"
                    }`}
                  >
                    Your Referral Rewards
                  </h2>
                </div>

                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-xl ${
                      theme === "dark" ? "bg-slate-800/50" : "bg-slate-200"
                    }`}
                  >
                    <h3 className="font-bold mb-2">How it works</h3>
                    <ul className="space-y-2 pl-5 list-disc">
                      <li>Share your unique referral link with friends</li>
                      <li>Your friend signs up using your link</li>
                      <li>
                        You earn{" "}
                        <span className="font-bold text-teal-500">$25</span>{" "}
                        when they deposit their first $100
                      </li>
                      <li>
                        Your friend gets{" "}
                        <span className="font-bold text-teal-500">$10</span>{" "}
                        bonus
                      </li>
                      <li>
                        Earn{" "}
                        <span className="font-bold text-teal-500">10%</span> of
                        their trading fees for 3 months
                      </li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={`p-4 rounded-xl text-center ${
                        theme === "dark" ? "bg-slate-800/50" : "bg-slate-200"
                      }`}
                    >
                      <div className="text-3xl font-bold text-teal-500">
                        $25
                      </div>
                      <p className="text-sm">Per referral</p>
                    </div>
                    <div
                      className={`p-4 rounded-xl text-center ${
                        theme === "dark" ? "bg-slate-800/50" : "bg-slate-200"
                      }`}
                    >
                      <div className="text-3xl font-bold text-blue-500">
                        10%
                      </div>
                      <p className="text-sm">Commission on fees</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Referral Link Section */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center mb-6">
                <div
                  className={`p-3 rounded-lg ${
                    theme === "dark" ? "bg-teal-900/50" : "bg-teal-100"
                  } mr-4`}
                >
                  <FontAwesomeIcon
                    icon={faShareAlt}
                    className={`h-6 ${
                      theme === "dark" ? "text-teal-400" : "text-teal-600"
                    }`}
                  />
                </div>
                <h2
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-slate-800"
                  }`}
                >
                  Your Referral Link
                </h2>
              </div>

              <div className="flex-1">
                <div
                  className={`p-6 rounded-xl ${
                    theme === "dark" ? "bg-slate-700/30" : "bg-slate-100"
                  } border ${
                    theme === "dark" ? "border-slate-700" : "border-slate-200"
                  }`}
                >
                  <div className="mb-6">
                    <label
                      className={`block text-sm font-semibold mb-2 ${
                        theme === "dark" ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      Share this link
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={referralLink || "Generating referral link..."}
                        readOnly
                        className={`flex-1 rounded-l-xl px-4 py-3 focus:outline-none ${
                          theme === "dark"
                            ? "bg-slate-700 text-white"
                            : "bg-slate-200 text-slate-900"
                        }`}
                      />
                      <button
                        onClick={handleCopy}
                        disabled={!referralLink}
                        className={`px-6 py-3 rounded-r-xl font-medium flex items-center ${
                          copied
                            ? "bg-green-500 text-white"
                            : theme === "dark"
                            ? "bg-teal-600 hover:bg-teal-500 text-white"
                            : "bg-teal-500 hover:bg-teal-400 text-white"
                        } ${!referralLink ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <FontAwesomeIcon icon={faCopy} className="mr-2" />
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label
                      className={`block text-sm font-semibold mb-2 ${
                        theme === "dark" ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      Referral QR Code
                    </label>
                    <div
                      className={`p-4 rounded-xl flex justify-center ${
                        theme === "dark" ? "bg-slate-700" : "bg-white"
                      }`}
                    >
                      <div
                        className={`p-4 ${
                          theme === "dark" ? "bg-white" : "bg-slate-200"
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={faQrcode}
                          className="h-24 text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={toggleShareOptions}
                    className={`w-full py-3 rounded-xl font-medium flex items-center justify-center ${
                      theme === "dark"
                        ? "bg-slate-700 hover:bg-slate-600 text-white"
                        : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                    }`}
                  >
                    <FontAwesomeIcon icon={faShareAlt} className="mr-2" />
                    Share via Social Media
                  </button>

                  {showShareOptions && (
                    <div
                      className={`mt-4 p-4 rounded-xl ${
                        theme === "dark" ? "bg-slate-800" : "bg-slate-200"
                      }`}
                    >
                      <h3
                        className={`font-semibold mb-3 ${
                          theme === "dark" ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        Share on:
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => shareVia("twitter")}
                          className={`py-2 rounded-lg flex flex-col items-center ${
                            theme === "dark"
                              ? "bg-slate-700 hover:bg-slate-600"
                              : "bg-white hover:bg-slate-100"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={faTwitter}
                            className="h-5 text-blue-400 mb-1"
                          />
                          <span className="text-xs">Twitter</span>
                        </button>
                        <button
                          onClick={() => shareVia("facebook")}
                          className={`py-2 rounded-lg flex flex-col items-center ${
                            theme === "dark"
                              ? "bg-slate-700 hover:bg-slate-600"
                              : "bg-white hover:bg-slate-100"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={faFacebook}
                            className="h-5 text-blue-600 mb-1"
                          />
                          <span className="text-xs">Facebook</span>
                        </button>
                        <button
                          onClick={() => shareVia("whatsapp")}
                          className={`py-2 rounded-lg flex flex-col items-center ${
                            theme === "dark"
                              ? "bg-slate-700 hover:bg-slate-600"
                              : "bg-white hover:bg-slate-100"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={faWhatsapp}
                            className="h-5 text-green-500 mb-1"
                          />
                          <span className="text-xs">WhatsApp</span>
                        </button>
                        <button
                          onClick={() => shareVia("telegram")}
                          className={`py-2 rounded-lg flex flex-col items-center ${
                            theme === "dark"
                              ? "bg-slate-700 hover:bg-slate-600"
                              : "bg-white hover:bg-slate-100"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={faTelegram}
                            className="h-5 text-blue-400 mb-1"
                          />
                          <span className="text-xs">Telegram</span>
                        </button>
                        <button
                          onClick={() => shareVia("linkedin")}
                          className={`py-2 rounded-lg flex flex-col items-center ${
                            theme === "dark"
                              ? "bg-slate-700 hover:bg-slate-600"
                              : "bg-white hover:bg-slate-100"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={faLinkedin}
                            className="h-5 text-blue-700 mb-1"
                          />
                          <span className="text-xs">LinkedIn</span>
                        </button>
                        <button
                          onClick={() => shareVia("email")}
                          className={`py-2 rounded-lg flex flex-col items-center ${
                            theme === "dark"
                              ? "bg-slate-700 hover:bg-slate-600"
                              : "bg-white hover:bg-slate-100"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={faEnvelope}
                            className="h-5 text-red-500 mb-1"
                          />
                          <span className="text-xs">Email</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Tabs */}
        <div className="mb-6">
          <div className="flex border-b">
            <button
              className={`px-6 py-3 font-medium ${
                activeTab === "referrals"
                  ? theme === "dark"
                    ? "border-b-2 border-teal-500 text-teal-500"
                    : "border-b-2 border-teal-500 text-teal-600"
                  : theme === "dark"
                  ? "text-slate-400 hover:text-slate-300"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              onClick={() => setActiveTab("referrals")}
            >
              Your Referrals
            </button>
            <button
              className={`px-6 py-3 font-medium ${
                activeTab === "rewards"
                  ? theme === "dark"
                    ? "border-b-2 border-teal-500 text-teal-500"
                    : "border-b-2 border-teal-500 text-teal-600"
                  : theme === "dark"
                  ? "text-slate-400 hover:text-slate-300"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              onClick={() => setActiveTab("rewards")}
            >
              Reward History
            </button>
          </div>
        </div>

        {/* Referrals Table */}
        <div
          className={`rounded-2xl shadow-xl overflow-hidden ${
            theme === "dark" ? "bg-slate-800" : "bg-white"
          }`}
        >
          <div className="p-6">
            {activeTab === "referrals" ? (
              <>
                <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr
                      className={`border-b ${
                        theme === "dark"
                          ? "border-slate-700"
                          : "border-slate-200"
                      }`}
                    >
                      <th
                        className={`py-3 px-4 text-left text-sm font-semibold ${
                          theme === "dark" ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        ID
                      </th>
                      <th
                        className={`py-3 px-4 text-left text-sm font-semibold ${
                          theme === "dark" ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        Email
                      </th>
                      <th
                        className={`py-3 px-4 text-left text-sm font-semibold ${
                          theme === "dark" ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        Full Name
                      </th>
                      <th
                        className={`py-3 px-4 text-left text-sm font-semibold ${
                          theme === "dark" ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        Date
                      </th>
                      <th
                        className={`py-3 px-4 text-left text-sm font-semibold ${
                          theme === "dark" ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        Status
                      </th>
                      <th
                        className={`py-3 px-4 text-left text-sm font-semibold ${
                          theme === "dark" ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        Earnings
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.length > 0 ? (
                      paginatedReferrals.map((referral) => (
                        <tr
                          key={referral.id}
                          className={`border-b ${
                            theme === "dark"
                              ? "border-slate-700 hover:bg-slate-700/50"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <td
                            className={`py-3 px-4 ${
                              theme === "dark"
                                ? "text-slate-300"
                                : "text-slate-700"
                            }`}
                          >
                            {referral.id}
                          </td>
                          <td
                            className={`py-3 px-4 ${
                              theme === "dark"
                                ? "text-slate-300"
                                : "text-slate-700"
                            }`}
                          >
                            {referral.email}
                          </td>
                          <td
                            className={`py-3 px-4 ${
                              theme === "dark"
                                ? "text-slate-300"
                                : "text-slate-700"
                            }`}
                          >
                            {referral.name || "—"}
                          </td>
                          <td
                            className={`py-3 px-4 ${
                              theme === "dark"
                                ? "text-slate-300"
                                : "text-slate-700"
                            }`}
                          >
                            {referral.date
                              ? new Date(referral.date).toLocaleDateString()
                              : "--"}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                referral.status === "Active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {referral.status}
                            </span>
                          </td>
                          <td
                            className={`py-3 px-4 font-medium ${
                              Number(referral.earnings || 0) > 0
                                ? "text-green-500"
                                : theme === "dark"
                                ? "text-slate-400"
                                : "text-slate-500"
                            }`}
                          >
                            {formatCurrency(referral.earnings)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-8 text-center">
                          <p
                            className={`text-sm ${
                              theme === "dark"
                                ? "text-slate-400"
                                : "text-slate-500"
                            }`}
                          >
                            No referrals yet. Share your link to get started.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
                {referrals.length > 0 && (
                  <PaginationControls
                    currentPage={referralsPage}
                    totalPages={referralsTotalPages}
                    totalItems={referrals.length}
                    pageSize={tablePageSize}
                    onPageChange={setReferralsPage}
                    onPageSizeChange={setTablePageSize}
                    pageSizeOptions={[10, 20, 50]}
                    itemLabel="referrals"
                  />
                )}
              </>
            ) : (
              <>
                <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr
                      className={`border-b ${
                        theme === "dark"
                          ? "border-slate-700"
                          : "border-slate-200"
                      }`}
                    >
                      <th
                        className={`py-3 px-4 text-left text-sm font-semibold ${
                          theme === "dark" ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        ID
                      </th>
                      <th
                        className={`py-3 px-4 text-left text-sm font-semibold ${
                          theme === "dark" ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        Description
                      </th>
                      <th
                        className={`py-3 px-4 text-left text-sm font-semibold ${
                          theme === "dark" ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        Date
                      </th>
                      <th
                        className={`py-3 px-4 text-left text-sm font-semibold ${
                          theme === "dark" ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        Status
                      </th>
                      <th
                        className={`py-3 px-4 text-left text-sm font-semibold ${
                          theme === "dark" ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rewards.length > 0 ? (
                      paginatedRewards.map((reward) => (
                        <tr
                          key={reward.id}
                          className={`border-b ${
                            theme === "dark"
                              ? "border-slate-700 hover:bg-slate-700/50"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <td
                            className={`py-3 px-4 ${
                              theme === "dark"
                                ? "text-slate-300"
                                : "text-slate-700"
                            }`}
                          >
                            {reward.id}
                          </td>
                          <td
                            className={`py-3 px-4 ${
                              theme === "dark"
                                ? "text-slate-300"
                                : "text-slate-700"
                            }`}
                          >
                            {reward.description}
                          </td>
                          <td
                            className={`py-3 px-4 ${
                              theme === "dark"
                                ? "text-slate-300"
                                : "text-slate-700"
                            }`}
                          >
                            {reward.date
                              ? new Date(reward.date).toLocaleDateString()
                              : "--"}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                reward.status === "Paid"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {reward.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-green-500">
                            {formatCurrency(reward.amount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-8 text-center">
                          <p
                            className={`text-sm ${
                              theme === "dark"
                                ? "text-slate-400"
                                : "text-slate-500"
                            }`}
                          >
                            No rewards yet. Earn bonuses as friends sign up.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
                {rewards.length > 0 && (
                  <PaginationControls
                    currentPage={rewardsPage}
                    totalPages={rewardsTotalPages}
                    totalItems={rewards.length}
                    pageSize={tablePageSize}
                    onPageChange={setRewardsPage}
                    onPageSizeChange={setTablePageSize}
                    pageSizeOptions={[10, 20, 50]}
                    itemLabel="rewards"
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Invite Friends Section */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Invite More Friends</h2>
          <p
            className={`max-w-2xl mx-auto mb-6 ${
              theme === "dark" ? "text-slate-400" : "text-slate-600"
            }`}
          >
            Share your referral link and earn rewards for every friend who joins
          </p>
          <div className="flex justify-center gap-4">
            <button
              className={`px-6 py-3 rounded-xl font-medium flex items-center ${
                theme === "dark"
                  ? "bg-slate-700 hover:bg-slate-600 text-white"
                  : "bg-slate-200 hover:bg-slate-300 text-slate-800"
              }`}
            >
              <FontAwesomeIcon icon={faMessage} className="mr-2" />
              Send Message
            </button>
            <button
              className={`px-6 py-3 rounded-xl font-medium flex items-center ${
                theme === "dark"
                  ? "bg-slate-700 hover:bg-slate-600 text-white"
                  : "bg-slate-200 hover:bg-slate-300 text-slate-800"
              }`}
            >
              <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
              Send Email
            </button>
            <button
              className={`px-6 py-3 rounded-xl font-medium flex items-center ${
                theme === "dark"
                  ? "bg-slate-700 hover:bg-slate-600 text-white"
                  : "bg-slate-200 hover:bg-slate-300 text-slate-800"
              }`}
            >
              <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
              Invite Contacts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
