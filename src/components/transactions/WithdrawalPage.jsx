import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faCoins,
  faDollarSign,
  faCreditCard,
  faEnvelope,
  faCheckCircle,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { useTransactions } from "../../context/TransactionContext";
import { useUser } from "../../context/UserContext";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../../config/api";

const CustomAlert = ({ message, onClose }) => {
  const { theme } = useTheme();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 animate-fadeIn">
      <div
        className={`p-8 rounded-2xl w-full max-w-md ${
          theme === "dark"
            ? "bg-gradient-to-br from-slate-800 to-gray-900 border border-slate-700 text-gray-200"
            : "bg-white border border-gray-200 text-gray-800"
        }`}
      >
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <FontAwesomeIcon
            icon={faCheckCircle}
            className="text-green-500 text-3xl"
          />
        </div>
        <p className="text-lg mb-6">{message}</p>
        <button
          onClick={onClose}
          className={`w-full p-3 rounded-xl font-medium transition-all ${
            theme === "dark"
              ? "bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white"
              : "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default function WithdrawalPage({ onSuccess }) {
  const { theme } = useTheme();
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [formData, setFormData] = useState({
    cryptoAsset: "BTC",
    amount: "",
    btcAddress: "",
    bankAccountNumber: "",
    bankName: "",
    bankAccountName: "",
    cashAppId: "",
    paypalEmail: "",
    skrillEmail: "",
  });
  const [alertMessage, setAlertMessage] = useState(null);
  const { refreshTransactions } = useTransactions();
  const { userData, getAuthToken, logoutUser, refreshUser } = useUser();
  const [processingWithdrawal, setProcessingWithdrawal] = useState(false);

  const getCleanToken = () => {
    const token = getAuthToken?.();
    if (!token) return null;
    return token.replace(/^["']|["']$/g, "").trim();
  };

  const paymentMethods = [
    {
      id: "Bank Transfer",
      name: "Bank Transfer",
      icon: faBuilding,
      color: "bg-blue-500/10",
    },
    {
      id: "Crypto",
      name: "Crypto",
      icon: faCoins,
      color: "bg-orange-500/10",
    },
    {
      id: "Cash App",
      name: "Cash App",
      icon: faDollarSign,
      color: "bg-green-500/10",
    },
    {
      id: "PayPal",
      name: "PayPal",
      icon: faCreditCard,
      color: "bg-blue-400/10",
    },
    {
      id: "Skrill",
      name: "Skrill",
      icon: faEnvelope,
      color: "bg-red-500/10",
    },
  ];

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
    setShowPaymentOptions(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleWithdrawal = async () => {
    if (!selectedPaymentMethod) {
      setAlertMessage("Please select a payment method.");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setAlertMessage("Please enter a valid amount.");
      return;
    }

    if (amount < 10) {
      setAlertMessage("Minimum withdrawal amount is $10.");
      return;
    }

    const availableBalance = userData?.balance ?? 0;
    if (amount > availableBalance) {
      setAlertMessage("Insufficient balance for this withdrawal.");
      return;
    }

    let details = "";
    switch (selectedPaymentMethod) {
      case "Crypto":
        if (!formData.btcAddress) {
          setAlertMessage("Please provide a crypto address.");
          return;
        }
        details = `To: ${formData.btcAddress.substring(0, 12)}... (${
          formData.cryptoAsset
        })`;
        break;
      case "Bank Transfer":
        if (!formData.bankAccountNumber || !formData.bankName) {
          setAlertMessage("Please fill in all required bank details.");
          return;
        }
        details = `To: ${formData.bankAccountNumber.substring(0, 8)}... (${
          formData.bankName
        })`;
        break;
      case "Cash App":
        if (!formData.cashAppId) {
          setAlertMessage("Please enter your Cash App ID.");
          return;
        }
        details = `Cash App: ${formData.cashAppId.substring(0, 8)}...`;
        break;
      case "PayPal":
        if (!formData.paypalEmail) {
          setAlertMessage("Please enter your PayPal email.");
          return;
        }
        details = `PayPal: ${formData.paypalEmail.substring(0, 8)}...`;
        break;
      case "Skrill":
        if (!formData.skrillEmail) {
          setAlertMessage("Please enter your Skrill email.");
          return;
        }
        details = `Skrill: ${formData.skrillEmail.substring(0, 8)}...`;
        break;
      default:
        break;
    }

    const token = getCleanToken();
    if (!token) {
      setAlertMessage("Please log in to continue with withdrawals.");
      toast.error("Authentication required to withdraw");
      return;
    }

    setProcessingWithdrawal(true);

    try {
      const payload = {
        amount: amount.toFixed(2),
        currency: "USD",
        paymentMethod: selectedPaymentMethod,
        details,
        destination: {
          cryptoAsset: formData.cryptoAsset,
          cryptoAddress: formData.btcAddress,
          bankAccountNumber: formData.bankAccountNumber,
          bankName: formData.bankName,
          bankAccountName: formData.bankAccountName,
          cashAppId: formData.cashAppId,
          paypalEmail: formData.paypalEmail,
          skrillEmail: formData.skrillEmail,
        },
      };

      const response = await fetch(`${API_BASE_URL}/Withdrawal/Create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        setAlertMessage("Session expired. Please log in again.");
        toast.error("Session expired. Please log in again.");
        await logoutUser();
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        const message =
          result?.message ||
          `Failed to request withdrawal (error ${response.status})`;
        setAlertMessage(message);
        toast.error(message);
        return;
      }

      if (result?.success) {
        const txStatus = result.data?.status || "Pending";
        setAlertMessage(
          `Withdrawal request of $${amount.toFixed(
            2
          )} via ${selectedPaymentMethod} is ${txStatus.toLowerCase()}.`
        );
        await refreshTransactions();
        await refreshUser();
        setFormData({
          cryptoAsset: "BTC",
          amount: "",
          btcAddress: "",
          bankAccountNumber: "",
          bankName: "",
          bankAccountName: "",
          cashAppId: "",
          paypalEmail: "",
          skrillEmail: "",
        });
        setSelectedPaymentMethod(null);
        if (onSuccess) onSuccess();
      } else {
        const message = result?.message || "Withdrawal request failed";
        setAlertMessage(message);
        toast.error(message);
      }
    } catch (error) {
      console.error("Withdrawal failed:", error);
      setAlertMessage(
        "Failed to submit withdrawal request. Please try again."
      );
    } finally {
      setProcessingWithdrawal(false);
    }

  };

  const renderFormFields = () => {
    const inputClasses = `w-full p-3 rounded-xl border focus:ring-2 focus:outline-none ${
      theme === "dark"
        ? "bg-slate-700/50 border-slate-600 focus:ring-teal-500 focus:border-teal-500 text-gray-200"
        : "bg-slate-100 border-gray-300 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
    }`;

    const labelClasses = `block mb-2 text-sm font-medium ${
      theme === "dark" ? "text-gray-400" : "text-gray-600"
    }`;

    switch (selectedPaymentMethod) {
      case "Crypto":
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Coin Assets</label>
              <select
                name="cryptoAsset"
                value={formData.cryptoAsset}
                onChange={handleInputChange}
                className={inputClasses}
              >
                {["BTC", "ETH", "LTC", "XRP", "BCH"].map((coin) => (
                  <option key={coin} value={coin}>
                    {coin}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClasses}>Amount</label>
              <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={formData.amount}
                onChange={handleInputChange}
                className={inputClasses}
                min="10"
                step="0.01"
              />
              <p
                className={`text-sm mt-2 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}
              >
                Available Balance: ${userData?.balance?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div>
              <label className={labelClasses}>
                {formData.cryptoAsset} Address
              </label>
              <input
                type="text"
                name="btcAddress"
                placeholder={`${formData.cryptoAsset} Address`}
                value={formData.btcAddress}
                onChange={handleInputChange}
                className={inputClasses}
              />
            </div>
          </div>
        );
      case "Bank Transfer":
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Bank Name</label>
              <input
                type="text"
                name="bankName"
                placeholder="Bank Name"
                value={formData.bankName}
                onChange={handleInputChange}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Account Number</label>
              <input
                type="text"
                name="bankAccountNumber"
                placeholder="Account Number"
                value={formData.bankAccountNumber}
                onChange={handleInputChange}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Account Name</label>
              <input
                type="text"
                name="bankAccountName"
                placeholder="Account Name"
                value={formData.bankAccountName}
                onChange={handleInputChange}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Amount</label>
              <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={formData.amount}
                onChange={handleInputChange}
                className={inputClasses}
                min="10"
                step="0.01"
              />
              <p
                className={`text-sm mt-2 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}
              >
                Available Balance: ${userData?.balance?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        );
      case "Cash App":
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Cash App ID</label>
              <input
                type="text"
                name="cashAppId"
                placeholder="Cash App ID"
                value={formData.cashAppId}
                onChange={handleInputChange}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Amount</label>
              <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={formData.amount}
                onChange={handleInputChange}
                className={inputClasses}
                min="10"
                step="0.01"
              />
              <p
                className={`text-sm mt-2 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}
              >
                Available Balance: ${userData?.balance?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        );
      case "PayPal":
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>PayPal Email</label>
              <input
                type="email"
                name="paypalEmail"
                placeholder="PayPal Email"
                value={formData.paypalEmail}
                onChange={handleInputChange}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Amount</label>
              <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={formData.amount}
                onChange={handleInputChange}
                className={inputClasses}
                min="10"
                step="0.01"
              />
              <p
                className={`text-sm mt-2 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}
              >
                Available Balance: ${userData?.balance?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        );
      case "Skrill":
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Skrill Email</label>
              <input
                type="email"
                name="skrillEmail"
                placeholder="Skrill Email"
                value={formData.skrillEmail}
                onChange={handleInputChange}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Amount</label>
              <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={formData.amount}
                onChange={handleInputChange}
                className={inputClasses}
                min="10"
                step="0.01"
              />
              <p
                className={`text-sm mt-2 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}
              >
                Available Balance: ${userData?.balance?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div
            className={`p-8 rounded-xl text-center ${
              theme === "dark" ? "bg-slate-800/50" : "bg-slate-100"
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                theme === "dark"
                  ? "bg-slate-700 text-teal-400"
                  : "bg-slate-200 text-teal-600"
              }`}
            >
              <FontAwesomeIcon icon={faCoins} className="text-2xl" />
            </div>
            <p className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>
              Select a payment method to start your withdrawal
            </p>
          </div>
        );
    }
  };

  return (
    <div
      className={`min-h-screen ${
        theme === "dark" ? "bg-zinc-950" : "bg-gray-50"
      }`}
    >
      <div className="w-full px-4 py-8 sm:px-6 lg:px-8">

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Payment Method Section */}
          <div
            className={`w-full lg:w-2/3 rounded-2xl p-6 shadow-xl ${
              theme === "dark"
                ? "bg-slate-800/50 backdrop-blur-sm"
                : "bg-white/90 backdrop-blur-sm"
            }`}
          >
            <div className="mb-6">
              <h2
                className={`text-xl font-bold mb-4 ${
                  theme === "dark" ? "text-gray-200" : "text-gray-800"
                }`}
              >
                Select Payment Method
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    onClick={() => handlePaymentMethodSelect(method.id)}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                      selectedPaymentMethod === method.id
                        ? theme === "dark"
                          ? "border-teal-500 bg-teal-900/20"
                          : "border-teal-500 bg-teal-500/10"
                        : theme === "dark"
                        ? "border-slate-700 hover:border-teal-500/50 hover:bg-slate-700/50"
                        : "border-gray-200 hover:border-teal-500/50 hover:bg-gray-100"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${method.color}`}
                    >
                      <FontAwesomeIcon
                        icon={method.icon}
                        className={`text-xl ${
                          theme === "dark"
                            ? selectedPaymentMethod === method.id
                              ? "text-teal-400"
                              : "text-gray-400"
                            : selectedPaymentMethod === method.id
                            ? "text-teal-600"
                            : "text-gray-600"
                        }`}
                      />
                    </div>
                    <span className="font-medium">{method.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <h2
                className={`text-xl font-bold mb-4 ${
                  theme === "dark" ? "text-gray-200" : "text-gray-800"
                }`}
              >
                {selectedPaymentMethod
                  ? `${selectedPaymentMethod} Details`
                  : "Payment Details"}
              </h2>

              {renderFormFields()}
            </div>
          </div>

          {/* Summary Section */}
          <div
            className={`w-full lg:w-1/3 rounded-2xl p-6 shadow-xl ${
              theme === "dark"
                ? "bg-slate-800/50 backdrop-blur-sm"
                : "bg-white/90 backdrop-blur-sm"
            }`}
          >
            <h2
              className={`text-xl font-bold mb-6 ${
                theme === "dark"
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-600"
                  : "text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-700"
              }`}
            >
              Withdrawal Summary
            </h2>

            <div
              className={`p-5 rounded-xl mb-6 ${
                theme === "dark" ? "bg-slate-700/50" : "bg-slate-100"
              }`}
            >
              <div className="flex justify-between mb-3">
                <span
                  className={
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }
                >
                  Payment Method:
                </span>
                <span className="font-medium">
                  {selectedPaymentMethod || "Not selected"}
                </span>
              </div>

              {selectedPaymentMethod && (
                <>
                  <div className="flex justify-between mb-3">
                    <span
                      className={
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }
                    >
                      Amount:
                    </span>
                    <span className="font-medium">
                      ${formData.amount || "0.00"}
                    </span>
                  </div>

                  {selectedPaymentMethod === "Crypto" && (
                    <>
                      <div className="flex justify-between mb-3">
                        <span
                          className={
                            theme === "dark" ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          Coin:
                        </span>
                        <span className="font-medium">
                          {formData.cryptoAsset}
                        </span>
                      </div>
                      <div>
                        <span
                          className={
                            theme === "dark" ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          Address:
                        </span>
                        <p className="font-medium truncate">
                          {formData.btcAddress || "Not provided"}
                        </p>
                      </div>
                    </>
                  )}

                  {selectedPaymentMethod === "Bank Transfer" && (
                    <>
                      <div className="flex justify-between mb-3">
                        <span
                          className={
                            theme === "dark" ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          Bank:
                        </span>
                        <span className="font-medium">
                          {formData.bankName || "Not provided"}
                        </span>
                      </div>
                      <div className="flex justify-between mb-3">
                        <span
                          className={
                            theme === "dark" ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          Account Number:
                        </span>
                        <span className="font-medium">
                          {formData.bankAccountNumber || "Not provided"}
                        </span>
                      </div>
                      <div>
                        <span
                          className={
                            theme === "dark" ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          Account Name:
                        </span>
                        <p className="font-medium">
                          {formData.bankAccountName || "Not provided"}
                        </p>
                      </div>
                    </>
                  )}

                  {selectedPaymentMethod === "Cash App" && (
                    <div>
                      <span
                        className={
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }
                      >
                        Cash App ID:
                      </span>
                      <p className="font-medium">
                        {formData.cashAppId || "Not provided"}
                      </p>
                    </div>
                  )}

                  {selectedPaymentMethod === "PayPal" && (
                    <div>
                      <span
                        className={
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }
                      >
                        PayPal Email:
                      </span>
                      <p className="font-medium">
                        {formData.paypalEmail || "Not provided"}
                      </p>
                    </div>
                  )}

                  {selectedPaymentMethod === "Skrill" && (
                    <div>
                      <span
                        className={
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }
                      >
                        Skrill Email:
                      </span>
                      <p className="font-medium">
                        {formData.skrillEmail || "Not provided"}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 p-px rounded-xl shadow-lg shadow-teal-500/20">
              <button
                onClick={handleWithdrawal}
                className={`w-full p-4 rounded-xl text-white text-lg font-bold transition-all ${
                  !selectedPaymentMethod || !formData.amount
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-teal-600 to-teal-700"
                }`}
                disabled={!selectedPaymentMethod || !formData.amount}
              >
                Confirm Withdrawal
              </button>
            </div>

            <div
              className={`mt-6 p-4 rounded-xl ${
                theme === "dark"
                  ? "bg-slate-700/50 border border-slate-600"
                  : "bg-slate-100 border border-gray-200"
              }`}
            >
              <h3
                className={`font-bold mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Withdrawal Notes
              </h3>
              <ul
                className={`text-sm space-y-1 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                <li>• Minimum withdrawal: $10</li>
                <li>• Processing time: 1-3 business days</li>
                <li>• No transaction fees</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Alert Popup */}
      {alertMessage && (
        <CustomAlert
          message={alertMessage}
          onClose={() => setAlertMessage(null)}
        />
      )}
    </div>
  );
}
