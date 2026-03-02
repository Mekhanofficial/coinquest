"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faChevronDown,
  faQrcode,
  faRefresh,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { faCopy } from "@fortawesome/free-regular-svg-icons";
import { useTransactions } from "../../../context/TransactionContext";
import { useUser } from "../../../context/UserContext";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../config/api";

const cryptoOptions = [
  { name: "Bitcoin", symbol: "BTC", color: "bg-orange-500/10", icon: "🟠", code: "BTC", paymentMethod: "btc" },
  { name: "Ethereum", symbol: "ETH", color: "bg-purple-500/10", icon: "🔷", code: "ETH", paymentMethod: "eth" },
  { name: "Solana", symbol: "SOL", color: "bg-purple-500/10", icon: "🟣", code: "SOL", paymentMethod: "sol" },
  { name: "Base", symbol: "BASE", color: "bg-blue-500/10", icon: "🔵", code: "BASE", paymentMethod: "base" },
  { name: "Sui", symbol: "SUI", color: "bg-cyan-500/10", icon: "💠", code: "SUI", paymentMethod: "sui" },
  { name: "Polygon", symbol: "POL", color: "bg-purple-500/10", icon: "🟪", code: "POL", paymentMethod: "pol" },
];

export default function DepositPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [amount, setAmount] = useState(10);
  const [selectedCrypto, setSelectedCrypto] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showMethods, setShowMethods] = useState(false);
  const [generatedAddress, setGeneratedAddress] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [processingDeposit, setProcessingDeposit] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [addressError, setAddressError] = useState(null);
  const [currentDepositAmount, setCurrentDepositAmount] = useState(10);
  const [depositMethods, setDepositMethods] = useState([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { 
    userData, 
    getAuthToken, 
    refreshUser, 
    isAuthenticated, 
    logoutUser,
    hasValidToken
  } = useUser();
  
  const { refreshTransactions } = useTransactions();

  // Use refs to prevent ANY duplicate requests
  const isGeneratingAddressRef = useRef(false);
  const lastRequestKeyRef = useRef("");
  const requestQueueRef = useRef([]);
  const isMountedRef = useRef(true);

  const parsedAmount = parseFloat(amount) || 0;
  const fee = (parsedAmount * 0.01).toFixed(2);
  const total = (parsedAmount + parseFloat(fee)).toFixed(2);
  const selectedMethod = cryptoOptions.find((m) => m.symbol === selectedCrypto);
  const selectedMethodConfig = depositMethods.find(
    (method) => method.currencyCode === selectedCrypto
  );

  // Setup and cleanup
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      // Clear any pending requests
      requestQueueRef.current = [];
      isGeneratingAddressRef.current = false;
    };
  }, []);

  // Check authentication on mount - RUNS ONLY ONCE
  useEffect(() => {
    console.log("🔄 Initializing deposit page...");

    if (!isAuthenticated || !hasValidToken()) {
      console.log("❌ Not authenticated, redirecting to login");
      setAuthError(true);
      toast.error("Please log in to access deposit features");
      navigate("/login");
    } else {
      fetchDepositMethods();
      setIsInitialized(true);
    }
  }, []); // Empty dependency array - runs only once

  const fetchDepositMethods = async () => {
    const token = getCleanToken();
    if (!token) return;

    setLoadingMethods(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Deposit/Methods`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok) {
        if (result.success && result.data) {
          setDepositMethods(result.data);
        }
      } else {
        console.error("❌ Failed to load deposit methods");
        toast.error("Failed to load deposit methods");
      }
    } catch (error) {
      console.error("❌ Error loading deposit methods:", error);
      toast.error("Network error loading deposit methods");
    } finally {
      setLoadingMethods(false);
    }
  };

  // Generate address for deposit - ONLY called when user confirms
  const generateDepositAddress = useCallback(async (requestId) => {
    if (!isMountedRef.current) return;
    
    if (!selectedCrypto || parsedAmount < 10) {
      toast.error("Please select a cryptocurrency and enter amount ≥ $10");
      return;
    }

    const token = getCleanToken();
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    const selectedCryptoOption = cryptoOptions.find(opt => opt.code === selectedCrypto);
    if (!selectedCryptoOption) {
      toast.error("Invalid cryptocurrency selected");
      return;
    }

    // Check if we're already generating an address
    if (isGeneratingAddressRef.current) {
      console.log("⏸️ Address generation already in progress");
      return;
    }

    // Create a unique key for this request
    const requestKey = `${selectedCrypto}-${parsedAmount}`;
    
    // Check if this exact request was just made (within last 10 seconds)
    const now = Date.now();
    if (lastRequestKeyRef.current === requestKey && (now - requestQueueRef.current[requestKey] || 0) < 10000) {
      console.log("⏸️ Same request was made very recently, skipping");
      return;
    }

    // Mark as in progress and track this request
    isGeneratingAddressRef.current = true;
    lastRequestKeyRef.current = requestKey;
    requestQueueRef.current[requestKey] = now;

    setLoadingAddress(true);
    setAddressError(null);
    
    try {
      const endpoint = `${API_BASE_URL}/Deposit/Create`;
      console.log("📤 Generating deposit address for:", selectedCryptoOption.name);
      console.log("💰 Amount: $", parsedAmount);
      console.log("🎯 Request ID:", requestId);
      
      const requestBody = {
        amount: parsedAmount,
        paymentMethod: selectedCryptoOption.paymentMethod.toLowerCase()
      };
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          "Content-Type": "application/json",
          "X-Request-ID": requestId
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      let result;
      
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error("❌ Failed to parse JSON response");
        throw new Error(`Invalid JSON response`);
      }

      if (response.status === 401) {
        setAuthError(true);
        toast.error("Session expired. Please log in again.");
        logoutUser();
        navigate("/login");
        return;
      }

      if (response.status === 403) {
        const errorMsg = result.message || "KYC verification required";
        setAddressError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      if (!response.ok) {
        const errorMsg = result.message || `HTTP error! status: ${response.status}`;
        setAddressError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      if (result.success && result.data) {
        const address = result.data.walletAddress;
        const depositId = result.data.id;
        
        if (address) {
          console.log("✅ Address generated successfully - Request ID:", requestId);
          setGeneratedAddress({
            address: address,
            depositId: depositId,
            depositData: result.data,
            isPreview: false,
          });
          setCurrentDepositAmount(parsedAmount);
          setShowSuccess(true);
          toast.success(`${selectedCryptoOption.name} address generated`);
        } else {
          setAddressError("No deposit address received from server");
          toast.error("Failed to generate deposit address");
        }
      } else {
        const errorMsg = result.message || "Failed to create deposit";
        setAddressError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("💥 Error generating address:", error);
      
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        setAddressError("Network error. Please check your internet connection.");
        toast.error("Network error. Please check your internet connection.");
      } else {
        setAddressError(`Failed to generate address: ${error.message}`);
        toast.error(`Failed to generate ${selectedCryptoOption.name} address: ${error.message}`);
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingAddress(false);
        // Add a cooldown period before allowing another request
        setTimeout(() => {
          isGeneratingAddressRef.current = false;
        }, 2000);
      }
    }
  }, [selectedCrypto, parsedAmount, navigate, logoutUser]);

  // Handle crypto selection
  const handleCryptoSelect = (cryptoCode) => {
    setSelectedCrypto(cryptoCode);
    setAddressError(null);
    setShowMethods(false);
    const method = depositMethods.find((m) => m.currencyCode === cryptoCode);
    const previewAddress = method?.walletAddress;

    if (previewAddress) {
      setGeneratedAddress({
        address: previewAddress,
        depositId: null,
        depositData: null,
        isPreview: true,
      });
    } else {
      setGeneratedAddress(null);
    }
    console.log(`🔄 Crypto selected: ${cryptoCode}`);
  };

  // Proper token cleaning function
  const getCleanToken = () => {
    const token = getAuthToken();
    if (!token) return null;
    
    const cleanToken = token.replace(/^["']|["']$/g, '').trim();
    return cleanToken;
  };

  const copyToClipboard = () => {
    if (generatedAddress) {
      navigator.clipboard.writeText(generatedAddress.address);
      toast.success("Address copied to clipboard!");
    }
  };

  const handleDeposit = async () => {
    console.log("💰 Processing deposit...");
    
    if (!isAuthenticated || !hasValidToken()) {
      toast.error("Please log in to make a deposit");
      navigate("/login");
      return;
    }

    if (!selectedCrypto || parsedAmount <= 0) {
      toast.error("Please select a cryptocurrency and enter a valid amount.");
      return;
    }

    if (parsedAmount < 10) {
      toast.error("Minimum deposit amount is $10");
      return;
    }

    if (
      generatedAddress &&
      generatedAddress.depositId &&
      generatedAddress.depositData?.amount === parsedAmount
    ) {
      setCurrentDepositAmount(parsedAmount);
      setShowSuccess(true);
      return;
    }

    if (processingDeposit) {
      return;
    }

    setProcessingDeposit(true);

    try {
      const manualRequestId = `deposit-${selectedCrypto}-${parsedAmount}-${Date.now()}`;
      await generateDepositAddress(manualRequestId);
    } catch (error) {
      console.error("💥 Manual deposit trigger error:", error);
    } finally {
      if (isMountedRef.current) {
        setProcessingDeposit(false);
      }
    }
  };

  const refreshAddress = () => {
    if (
      selectedMethod &&
      parsedAmount >= 10 &&
      generatedAddress &&
      !generatedAddress.isPreview
    ) {
      setAddressError(null);
      const refreshId = `refresh-${selectedCrypto}-${parsedAmount}-${Date.now()}`;
      generateDepositAddress(refreshId);
    }
  };

  const generateQRCode = (address) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(address)}`;
  };

  // Display available deposit methods from API
  const renderCryptoOptions = () => {
    if (loadingMethods) {
      return (
        <div className="p-3 text-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-500 inline-block mr-2"></div>
          Loading deposit methods...
        </div>
      );
    }

    if (depositMethods.length === 0) {
      return (
        <div className="p-3 text-center text-gray-500">
          <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 text-yellow-500" />
          No deposit methods available
        </div>
      );
    }

    return depositMethods.map((method, index) => {
      const cryptoOption = cryptoOptions.find(opt => opt.code === method.currencyCode);
      const isAvailable = cryptoOption !== undefined;
      
      return (
        <div
          key={method.id}
          className={`p-3 flex items-center cursor-pointer transition-colors ${
            isAvailable 
              ? "hover:bg-teal-500/20" 
              : "opacity-50 cursor-not-allowed hover:bg-red-500/10"
          } ${cryptoOption?.color || "bg-gray-500/10"} ${
            selectedCrypto === method.currencyCode ? "bg-teal-500/30" : ""
          }`}
          onClick={() => {
            if (isAvailable) {
              handleCryptoSelect(method.currencyCode);
            } else {
              toast.error(`${method.currencyCode} not configured in frontend`);
            }
          }}
          title={!isAvailable ? `${method.currencyCode} not configured` : `Select ${method.currencyName}`}
        >
          <span className="mr-3 text-lg">{cryptoOption?.icon || "🔄"}</span>
          <div className="flex-1">
            <div className="font-medium">{method.currencyName}</div>
            <div className="text-xs text-gray-500">Network: {method.network}</div>
            {!isAvailable && (
              <div className="text-xs text-red-500">Not configured</div>
            )}
          </div>
          <span className={`text-sm font-mono px-2 py-1 rounded ${
            isAvailable ? "bg-gray-800/50" : "bg-red-900/50"
          }`}>
            {method.currencyCode}
          </span>
        </div>
      );
    });
  };

  if (authError) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${
        theme === "dark" ? "bg-slate-900" : "bg-gray-100"
      }`}>
        <div className={`max-w-md w-full p-6 rounded-2xl text-center ${
          theme === "dark" ? "bg-slate-800" : "bg-white"
        }`}>
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-2xl" />
          </div>
          <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
          <p className="text-gray-500 mb-4">Please log in to access the deposit page.</p>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-medium transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen px-4 lg:px-10 py-14 flex flex-col md:flex-row gap-6 ${
        theme === "dark"
          ? "bg-gradient-to-br from-slate-900 to-gray-900 text-gray-200"
          : "bg-gradient-to-br from-slate-100 to-gray-100 text-gray-800"
      }`}
    >
      {/* Left: Deposit Form */}
      <div
        className={`w-full md:w-1/2 p-6 rounded-2xl shadow-xl ${
          theme === "dark"
            ? "bg-slate-800/70 backdrop-blur-sm"
            : "bg-white/90 backdrop-blur-sm"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-600">
            Make Deposit
          </h2>
          <button
            onClick={refreshAddress}
            disabled={loadingAddress || !selectedMethod || parsedAmount < 10 || !generatedAddress || generatedAddress?.isPreview}
            className={`p-2 rounded-full ${
              theme === "dark"
                ? "bg-slate-700 hover:bg-slate-600"
                : "bg-slate-200 hover:bg-slate-300"
            } transition-colors ${loadingAddress || !selectedMethod || parsedAmount < 10 || !generatedAddress || generatedAddress?.isPreview ? "opacity-50 cursor-not-allowed" : ""}`}
            title="Refresh deposit address"
          >
            <FontAwesomeIcon
              icon={faRefresh}
              className={`${loadingAddress ? "animate-spin" : ""} ${
                theme === "dark" ? "text-teal-400" : "text-teal-600"
              }`}
            />
          </button>
        </div>

        {/* Crypto Selection */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-500">
            Deposit Method
          </label>
          <div className="relative">
            <button
              className={`w-full p-3 rounded-xl flex items-center justify-between ${
                theme === "dark"
                  ? "bg-slate-700/80 hover:bg-slate-700"
                  : "bg-slate-100 hover:bg-slate-200"
              } transition-all duration-200`}
              onClick={() => setShowMethods(!showMethods)}
              disabled={loadingMethods}
            >
              <div className="flex items-center">
                {selectedCrypto ? (
                  <>
                    <span className="mr-3 text-lg">
                      {selectedMethod?.icon || "🪙"}
                    </span>
                    <div className="text-left">
                      <div>{selectedMethod?.name || selectedCrypto}</div>
                      <div className="text-xs text-gray-500">
                        Network: {selectedMethodConfig?.network || "Unknown"}
                      </div>
                    </div>
                  </>
                ) : loadingMethods ? (
                  <span className="text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-500 inline-block mr-2"></div>
                    Loading methods...
                  </span>
                ) : (
                  <span className="text-gray-400">-- Select Coin --</span>
                )}
              </div>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`text-sm transform transition-transform ${
                  showMethods ? "rotate-180" : ""
                } ${loadingMethods ? "opacity-50" : ""}`}
              />
            </button>
            {showMethods && (
              <div
                className={`absolute z-20 w-full mt-2 rounded-xl shadow-lg overflow-y-auto max-h-80 ${
                  theme === "dark" ? "bg-slate-700" : "bg-white"
                }`}
              >
                {renderCryptoOptions()}
              </div>
            )}
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-500">
            Amount (USD) - Minimum $10
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              $
            </span>
            <input
              type="number"
              value={amount}
              min="10"
              step="0.01"
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full pl-8 pr-4 py-3 rounded-xl ${
                theme === "dark"
                  ? "bg-slate-700/80 border border-slate-600 focus:ring-teal-500 focus:border-teal-500"
                  : "bg-slate-100 border border-slate-200 focus:ring-teal-500 focus:border-teal-500"
              } focus:ring-2 focus:outline-none transition-all`}
              placeholder="Enter amount (min $10)"
            />
          </div>
          {parsedAmount < 10 && parsedAmount > 0 && (
            <p className="text-red-500 text-xs mt-1">Minimum deposit amount is $10</p>
          )}
        </div>

        {/* Fee & Total */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-500">
              Fee (1%)
            </label>
            <div
              className={`p-3 rounded-xl ${
                theme === "dark"
                  ? "bg-slate-700/50 text-gray-300"
                  : "bg-slate-100 text-gray-700"
              }`}
            >
              ${fee}
            </div>
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-500">
              Total Amount
            </label>
            <div
              className={`p-3 rounded-xl font-medium ${
                theme === "dark"
                  ? "bg-teal-900/30 text-teal-300"
                  : "bg-teal-500/20 text-teal-700"
              }`}
            >
              ${total}
            </div>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-500">
            Quick Amount
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[50, 100, 500, 1000].map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => setAmount(quickAmount)}
                className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                  theme === "dark"
                    ? "bg-slate-700 hover:bg-slate-600"
                    : "bg-slate-200 hover:bg-slate-300"
                } ${amount === quickAmount ? "ring-2 ring-teal-500" : ""}`}
              >
                ${quickAmount}
              </button>
            ))}
          </div>
        </div>

        {/* Confirm Button */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 p-px rounded-xl mt-4 shadow-lg shadow-teal-500/20">
          <button
            onClick={handleDeposit}
            disabled={!selectedMethod || processingDeposit || !isAuthenticated || parsedAmount < 10}
            className={`w-full p-4 rounded-xl text-white text-lg font-bold transition-all ${
              !selectedMethod || processingDeposit || !isAuthenticated || parsedAmount < 10
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
            }`}
          >
            {processingDeposit 
              ? "Processing..." 
              : parsedAmount < 10 
                ? "Minimum $10 Required" 
                : `Confirm $${parsedAmount} Deposit`}
          </button>
        </div>
      </div>

      {/* Right: Payment Info */}
      <div
        className={`w-full md:w-1/2 p-6 rounded-2xl shadow-xl ${
          theme === "dark"
            ? "bg-slate-800/70 backdrop-blur-sm"
            : "bg-white/90 backdrop-blur-sm"
        }`}
      >
        <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-600">
          Payment Details
        </h2>

        {/* Address Error Display */}
        {addressError && (
          <div className={`p-3 rounded-xl mb-4 ${
            theme === "dark" ? "bg-red-900/20 border border-red-800" : "bg-red-50 border border-red-200"
          }`}>
            <div className="flex items-start">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className={`text-sm ${theme === "dark" ? "text-red-200" : "text-red-800"}`}>
                  ⚠️ {addressError}
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setAddressError(null)}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    Dismiss
                  </button>
                  {addressError.includes("KYC") && (
                    <button
                      onClick={() => navigate("/kyc")}
                      className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                    >
                      Go to KYC
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Address Field */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-500">
            Your {selectedMethod?.name || "Crypto"} Deposit Address
          </label>
          <div className="flex gap-2">
            <div
              className={`flex-1 p-3 rounded-xl flex items-center ${
                theme === "dark" ? "bg-slate-700/80" : "bg-slate-100"
              } ${!selectedMethod ? "opacity-50" : ""}`}
            >
              <FontAwesomeIcon
                icon={faQrcode}
                className={`mr-3 ${
                  theme === "dark" ? "text-teal-400" : "text-teal-600"
                }`}
              />
              <span className="truncate font-mono text-sm">
                {selectedMethod
                  ? loadingAddress 
                    ? "Generating address..." 
                    : generatedAddress?.address || "No address available for this method"
                  : "Select a cryptocurrency first"}
              </span>
            </div>
            <button
              onClick={copyToClipboard}
              className={`p-3 rounded-xl flex items-center justify-center ${
                theme === "dark"
                  ? "bg-teal-700 hover:bg-teal-600"
                  : "bg-teal-600 hover:bg-teal-500"
              } transition-colors ${!selectedMethod || !generatedAddress?.address ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={!selectedMethod || !generatedAddress?.address}
              title="Copy address to clipboard"
            >
              <FontAwesomeIcon icon={faCopy} className="text-white" />
            </button>
          </div>
        </div>

        {/* QR Display */}
        {selectedMethod && generatedAddress?.address && !loadingAddress ? (
          <div className="mb-6">
            <div
              className={`p-6 rounded-2xl flex flex-col items-center ${
                theme === "dark" ? "bg-slate-700/50" : "bg-slate-100"
              }`}
            >
              <h3
                className={`text-lg font-semibold mb-4 flex items-center ${
                  theme === "dark" ? "text-gray-200" : "text-gray-800"
                }`}
              >
                <span className="mr-2 text-lg">{selectedMethod.icon}</span>
                {selectedMethod.name} Deposit - $
                {generatedAddress?.isPreview ? parsedAmount : currentDepositAmount}
              </h3>
              <div
                className={`p-4 rounded-xl mb-4 ${
                  theme === "dark" ? "bg-white" : "bg-gray-900"
                }`}
              >
                <img
                  src={generateQRCode(generatedAddress.address)}
                  alt={`${selectedMethod.name} QR code`}
                  className="w-40 h-40"
                  onError={(e) => {
                    e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23f3f3f3'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23666'%3EQR Code%3C/text%3E%3C/svg%3E`;
                  }}
                />
              </div>
              <p
                className={`text-sm text-center max-w-md ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Scan the QR code or copy the address above to send {selectedMethod.name} to your account. 
                The funds will be credited after network confirmations.
              </p>
            </div>
          </div>
        ) : (
          <div
            className={`p-10 rounded-2xl flex flex-col items-center justify-center ${
              theme === "dark" ? "bg-slate-700/50" : "bg-slate-100"
            }`}
          >
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 ${
                theme === "dark"
                  ? "bg-slate-600 text-teal-400"
                  : "bg-slate-200 text-teal-600"
              }`}
            >
              {loadingAddress ? (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
              ) : (
                <FontAwesomeIcon icon={faQrcode} className="text-3xl" />
              )}
            </div>
            <p
              className={`text-center ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {loadingAddress 
                ? "Generating deposit address..." 
                : !selectedMethod
                  ? "Select a cryptocurrency to generate address"
                  : parsedAmount < 10
                    ? "Enter amount ≥ $10 to generate address"
                    : generatedAddress?.isPreview
                      ? "Address is ready. Confirm deposit after sending your crypto."
                      : "Address generated and linked to your pending deposit."}
            </p>
          </div>
        )}

        {/* Success Modal */}
        {showSuccess && generatedAddress && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 p-4 z-50 backdrop-blur-sm animate-fadeIn">
            <div
              className={`p-8 rounded-2xl text-center w-full max-w-md ${
                theme === "dark"
                  ? "bg-gradient-to-br from-slate-800 to-gray-900 text-gray-200"
                  : "bg-white text-gray-900"
              }`}
            >
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="text-green-500 text-4xl"
                />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                Deposit Request Submitted!
              </h2>
              <p className="mb-4 text-gray-500">
                Your deposit of <strong>${currentDepositAmount}</strong> is pending. Please send your {selectedMethod?.name} to the provided address.
              </p>
              <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-teal-500/10 to-teal-600/10">
                <p className="font-mono text-xs break-all">
                  {generatedAddress.address}
                </p>
              </div>
              <button
                onClick={() => setShowSuccess(false)}
                className="mt-4 px-6 py-3 rounded-xl text-white font-medium w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
