"use client";

import { useState, useEffect, useRef } from "react";
import {
  FaPaperPlane,
  FaTimes,
  FaCog,
  FaVolumeUp,
  FaVolumeMute,
  FaTrash,
  FaLock,
} from "react-icons/fa";
import { BsLightningChargeFill } from "react-icons/bs";
import { SiBitcoincash } from "react-icons/si";
import { useUser } from "../../context/UserContext";
import { useTransactions } from "../../context/TransactionContext";
import { useCopyTraders } from "../../context/CopyTraderContext";
import { API_BASE_URL } from "../../config/api";
import cryptoQuestions from "./CryptoQuestions";

const CHAT_STORAGE_KEY = "coinquest_chat_messages_v3";
const CHAT_PREFS_KEY = "coinquest_chat_prefs_v3";
const MAX_PERSISTED_MESSAGES = 80;

const baseTokenPrices = {
  BTC: 62850,
  ETH: 3450,
  SOL: 150,
  ADA: 0.48,
  DOGE: 0.15,
};

const defaultPrompts = [
  "What's Bitcoin's price?",
  "How is my portfolio doing?",
  "Give me the latest project pulse",
  "Any crypto market news today?",
];

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const parseStoredMessages = (raw) => {
  try {
    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((msg) => ({
        ...msg,
        id: msg.id || createId(),
        sender: msg.sender === "user" ? "user" : "bot",
        text: `${msg.text || ""}`,
        isTyping: false,
        timestamp: msg.timestamp || new Date().toISOString(),
      }))
      .slice(-MAX_PERSISTED_MESSAGES);
  } catch (error) {
    return [];
  }
};

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState(defaultPrompts);

  const { userData, getAuthToken } = useUser();
  const { transactions = [], pendingRequests = [] } = useTransactions();
  const { copyTraderStats = {} } = useCopyTraders();

  const messagesEndRef = useRef(null);
  const typingTimersRef = useRef(new Set());
  const conversationContext = useRef({ lastTopic: null });

  const scheduleTask = (callback, delay) => {
    const handle = setTimeout(() => {
      typingTimersRef.current.delete(handle);
      callback();
    }, delay);
    typingTimersRef.current.add(handle);
  };

  const clearTypingTimers = () => {
    typingTimersRef.current.forEach((handle) => clearTimeout(handle));
    typingTimersRef.current.clear();
  };

  const getCleanToken = () => {
    const token = getAuthToken?.();
    if (!token) return "";
    return `${token}`.replace(/^["']|["']$/g, "").trim();
  };

  const formatCurrency = (value, currencyCode = userData?.currencyCode || "USD") => {
    const numericValue = Number(value);
    const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode || "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(safeValue);
    } catch (error) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(safeValue);
    }
  };

  const playTone = (frequency = 740, durationMs = 40, volume = 0.02) => {
    if (!soundEnabled || typeof window === "undefined") return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + durationMs / 1000);
      oscillator.onended = () => {
        ctx.close().catch(() => {});
      };
    } catch (error) {
      // Silent fallback for browsers that block autoplay audio contexts.
    }
  };

  const addMessage = (message) => {
    setMessages((prev) => [...prev, message].slice(-MAX_PERSISTED_MESSAGES));
  };

  const getWelcomeMessage = () => {
    const balance = formatCurrency(userData?.balance ?? 0);
    const plan = userData?.subscriptionPlan || "Basic";
    const pendingCount = pendingRequests.length || 0;
    const lastTx = transactions[0];
    const txLine = lastTx
      ? `Last transaction: ${lastTx.type} ${formatCurrency(lastTx.amount)} (${lastTx.status}).`
      : "No transactions recorded yet.";

    return (
      "Welcome to coinquest live chat.\n\n" +
      "I can help with:\n- Real-time prices and market checks\n- Dashboard and account pulse\n- Deposits, withdrawals, and payment proof\n- Trading, subscriptions, signals, bots, mining, staking, and real estate\n- Route and backend guidance\n\n" +
      `Current snapshot: Balance ${balance} | Plan ${plan} | Pending ${pendingCount}\n${txLine}\n\n` +
      "Ask a question or tap one of the quick prompts."
    );
  };

  const buildPriceResponse = (query) => {
    const symbolMatch = query.match(
      /(btc|bitcoin|eth|ethereum|sol|solana|ada|cardano|doge|dogecoin)/i
    );
    const normalized = (symbolMatch?.[0] || "btc").toLowerCase();
    const symbolMap = {
      bitcoin: "BTC",
      btc: "BTC",
      ethereum: "ETH",
      eth: "ETH",
      solana: "SOL",
      sol: "SOL",
      cardano: "ADA",
      ada: "ADA",
      dogecoin: "DOGE",
      doge: "DOGE",
    };
    const symbol = symbolMap[normalized] || "BTC";
    const base = baseTokenPrices[symbol] || 1000;
    const change = Number((Math.random() * 8 - 4).toFixed(2));
    const current = Number((base + base * (change / 100)).toFixed(2));
    const direction = change >= 0 ? "up" : "down";

    conversationContext.current.lastTopic = "price";
    return (
      `${symbol} is ${formatCurrency(current, "USD")} (${Math.abs(change).toFixed(2)}% ${direction} in 24h).\n\n` +
      "Want me to compare it with ETH, BTC dominance, or your portfolio exposure?"
    );
  };

  const buildPortfolioResponse = () => {
    const holdings = Array.isArray(userData?.holdings) ? userData.holdings : [];
    const currencyCode = userData?.currencyCode || "USD";
    const balance = Number(userData?.balance) || 0;
    const portfolioValue = Number(userData?.portfolioValue) || balance;
    const pendingCount = pendingRequests.length || 0;

    const holdingsLine =
      holdings.length > 0
        ? holdings
            .slice(0, 4)
            .map((item) => `${item.amount || 0} ${item.name || "Asset"}`)
            .join(", ")
        : "No holdings breakdown available yet.";

    conversationContext.current.lastTopic = "portfolio";
    return (
      `Portfolio summary:\n` +
      `- Balance: ${formatCurrency(balance, currencyCode)}\n` +
      `- Estimated value: ${formatCurrency(portfolioValue, currencyCode)}\n` +
      `- Pending transactions: ${pendingCount}\n` +
      `- Holdings: ${holdingsLine}\n\n` +
      "If you want, I can walk you through deposit, withdrawal, or risk checks."
    );
  };

  const buildProjectPulseResponse = () => {
    const currencyCode = userData?.currencyCode || "USD";
    const balance = formatCurrency(userData?.balance ?? 0, currencyCode);
    const pending = pendingRequests.length || 0;
    const activeCopyTrades = copyTraderStats?.liveTrades || 0;
    const tx = transactions[0];
    const txLine = tx
      ? `- Last transaction: ${tx.type} ${formatCurrency(tx.amount, tx.currency || currencyCode)} (${tx.status})`
      : "- Last transaction: none yet.";

    conversationContext.current.lastTopic = "project";
    return (
      `Project pulse:\n` +
      `- Balance: ${balance}\n` +
      `- Plan: ${userData?.subscriptionPlan || "Basic"}\n` +
      `- Pending transactions: ${pending}\n` +
      `- Active copy trades: ${activeCopyTrades}\n` +
      `${txLine}\n\n` +
      "Ask me for the next best action: deposit, trade, or referral growth."
    );
  };

  const buildNewsResponse = () => {
    const headlines = [
      "Bitcoin remains range-bound while ETF inflows stay positive.",
      "Ethereum ecosystem activity rises with L2 volume growth.",
      "Stablecoin market cap trends upward as on-chain usage expands.",
    ];
    conversationContext.current.lastTopic = "news";
    return (
      `Market update:\n1. ${headlines[0]}\n2. ${headlines[1]}\n3. ${headlines[2]}\n\n` +
      "Want a short bullish vs bearish scenario for BTC or ETH?"
    );
  };

  const getAIResponse = (rawQuery) => {
    const query = rawQuery.toLowerCase().trim();

    if (!query) {
      return "I did not catch that. Ask about prices, portfolio, project pulse, or news.";
    }

    if (/price|btc|bitcoin|eth|ethereum|sol|solana|ada|cardano|doge|dogecoin/.test(query)) {
      return buildPriceResponse(query);
    }

    if (/portfolio|balance|holdings|wallet/.test(query)) {
      return buildPortfolioResponse();
    }

    if (/project|pulse|account status|overview|snapshot/.test(query)) {
      return buildProjectPulseResponse();
    }

    if (/news|market|trend|headline/.test(query)) {
      return buildNewsResponse();
    }

    if (/deposit|fund account|wallet address|deposit method/.test(query)) {
      return (
        "Deposit module:\n" +
        "- Minimum amount: $10\n" +
        "- UI assets: BTC, ETH, SOL, BASE, SUI, POL\n" +
        "- Backend: /Deposit/Methods and /Deposit/Create\n" +
        "- KYC verification required."
      );
    }

    if (/withdraw|cash app|paypal|skrill|bank transfer/.test(query)) {
      return (
        "Withdrawal module:\n" +
        "- Minimum amount: $10\n" +
        "- Methods: Bank Transfer, Crypto, Cash App, PayPal, Skrill\n" +
        "- Backend: /Withdrawal/Create\n" +
        "- KYC verification required."
      );
    }

    if (/payment proof|proof of payment|receipt/.test(query)) {
      return (
        "Payment proof module:\n" +
        "- Upload image proof (max 5MB)\n" +
        "- Backend: /PaymentProof and /PaymentProof/Submit\n" +
        "- Use this for deposit verification tracking."
      );
    }

    if (/subscription|elite|platinum|premium|standard|basic plan/.test(query)) {
      return (
        "Subscription plans:\n" +
        "- Basic: Free | ROI 2.00%\n" +
        "- Standard: $2,500 | ROI 5.00% | 1 day\n" +
        "- Premium: $4,000 | ROI 30.00% | 5 days\n" +
        "- Platinum: $10,000 | ROI 15.00% | 3 days\n" +
        "- Elite: $25,000 | ROI 55.00% | 7 days"
      );
    }

    if (/signal|learn ii trade|ava trade|roboforex|zero to hero|1000 pips|wetalktrade/.test(query)) {
      return (
        "Daily signal plans include Learn II Trade, AVA TRADE, RoboForex, ZERO TO HERO, 1000 PIPS, and WeTalkTrade with different win rates and price tiers."
      );
    }

    if (/bot|3commas|cryptohopper|zignaly|shrimmpy|coinrule|tradebot|bituniverse/.test(query)) {
      return (
        "AI bot offerings include 3COMMAS, CRYPTOHOPPER, TRADINGVIEW, ZIGNALY, SHRIMMPY, COINRULE, TRADEBOT, and BITUNIVERSE. You can activate/deactivate them in Buy Bots."
      );
    }

    if (/mining|miner|hashrate|hash rate/.test(query)) {
      return (
        "Mining supports BTC, ETH, LTC, DOGE, and SOL with configurable hash rates and cycle-based earnings."
      );
    }

    if (/stake|staking|apy|lock period/.test(query)) {
      return (
        "Staking supports BTC, ETH, ADA, SOL, DOT, AVAX, LINK, LTC, and XRP with asset-specific APY and duration tracking."
      );
    }

    if (/real estate|hilton|fabian|go store|mirage|palmetto|bridge labs/.test(query)) {
      return (
        "Real Estate module includes multiple tokenized property offers with project details, ROI targets, and minimum investment amounts."
      );
    }

    if (/referral|invite|commission/.test(query)) {
      return (
        "Referral page tracks total referrals, active referrals, and earnings, and provides sharing options for social channels."
      );
    }

    if (/copy trade|copy trader|my traders|my copy traders/.test(query)) {
      return (
        "Copy trading flow uses MyTraders for selection and My Copy Traders for active copied positions and settlement."
      );
    }

    if (/place trade|vip trades|forex|take profit|stop loss|lot size|duration/.test(query)) {
      return (
        "Place Trade supports VIP Trades, Crypto, and Forex with buy/sell direction, lot size, take-profit, stop-loss, and duration."
      );
    }

    if (/buy crypto|binance|coinbase|crypto.com|gemini|kraken|bitcoin.com/.test(query)) {
      return (
        "Buy Crypto links to partner exchanges: Binance, Bitcoin.com, Coinbase, Crypto.com, Gemini, and Kraken."
      );
    }

    if (/kyc|verify account|identity verification/.test(query)) {
      return (
        "KYC verification requires a government ID and selfie upload. After successful submission, deposit and withdrawal features are fully unlocked."
      );
    }

    if (/messages|watchlist|help center|support/.test(query)) {
      return (
        "Utility pages include Messages (alerts), Watchlist (market tracking), and Help Center (guides for KYC, deposits, trading, and support)."
      );
    }

    if (/api|backend|endpoint|connect backend|integration/.test(query)) {
      return (
        "Core backend endpoints include /User/Dashboard, /Transaction/History, /Deposit/Create, /Withdrawal/Create, /PlaceTrade/Create, /CopyTrade, /Subscription, /Signal, /BuyBot, /Mining, /Stake, /RealEstate, /Referral/Overview, and /Chat/Reply."
      );
    }

    if (/help|support|what can you do/.test(query)) {
      return (
        "I can help with:\n" +
        "- Live prices and quick market checks\n" +
        "- Portfolio and account pulse\n" +
        "- Transaction status hints\n" +
        "- Navigation tips for deposit, trade, and withdrawals\n\n" +
        "Try: 'How is my portfolio?' or 'Give me market news'."
      );
    }

    const quickMatch = cryptoQuestions.find((item) =>
      query.includes((item.keyword || "").toLowerCase())
    );
    if (quickMatch?.response) {
      return quickMatch.response;
    }

    return (
      "I can answer crypto-related questions best. Try:\n" +
      "- What's BTC price?\n" +
      "- How is my portfolio doing?\n" +
      "- Give me project pulse\n" +
      "- Any market news?"
    );
  };

  const requestBackendReply = async (query, history = []) => {
    const cleanToken = getCleanToken();
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (cleanToken) {
      headers.Authorization = `Bearer ${cleanToken}`;
    }

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${API_BASE_URL}/Chat/Reply`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: query,
          history,
        }),
        signal: controller.signal,
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success || !result?.data?.reply) {
        throw new Error("chat_unavailable");
      }

      return {
        reply: result.data.reply,
        suggestions: Array.isArray(result.data.suggestions)
          ? result.data.suggestions.slice(0, 4)
          : [],
      };
    } finally {
      clearTimeout(timeoutHandle);
    }
  };

  const resolveAssistantReply = async (query, history) => {
    try {
      const backendReply = await requestBackendReply(query, history);
      return backendReply;
    } catch (error) {
      return {
        reply: getAIResponse(query),
        suggestions: defaultPrompts,
      };
    }
  };

  const createTypingMessage = () => {
    const typingId = createId();
    setIsTyping(true);
    addMessage({
      id: typingId,
      sender: "bot",
      text: "",
      isTyping: true,
      timestamp: new Date().toISOString(),
    });
    return typingId;
  };

  const typeResponseIntoMessage = (typingId, responseText) => {
    const safeResponse =
      typeof responseText === "string" && responseText.trim()
        ? responseText.trim()
        : "I could not generate a response right now. Try again in a moment.";

    const words = safeResponse.split(" ").filter(Boolean);
    let index = 0;
    let builtText = "";

    const typeChunk = () => {
      if (index >= words.length) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === typingId ? { ...msg, isTyping: false } : msg))
        );
        setIsTyping(false);
        playTone(640, 55, 0.015);
        return;
      }

      const chunkSize = Math.min(words.length - index, 2 + Math.floor(Math.random() * 3));
      const chunk = words.slice(index, index + chunkSize).join(" ");
      builtText = builtText ? `${builtText} ${chunk}` : chunk;
      index += chunkSize;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === typingId ? { ...msg, text: builtText, isTyping: true } : msg
        )
      );

      scheduleTask(typeChunk, 70 * chunkSize + Math.floor(Math.random() * 120));
    };

    scheduleTask(typeChunk, 420);
  };

  const submitQuery = async (query) => {
    const trimmed = `${query || ""}`.trim();
    if (!trimmed || isTyping) return;

    const nextUserMessage = {
      id: createId(),
      sender: "user",
      text: trimmed,
      isTyping: false,
      timestamp: new Date().toISOString(),
    };

    const historySnapshot = [...messages, nextUserMessage]
      .slice(-12)
      .map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        text: msg.text,
      }));

    addMessage({
      ...nextUserMessage,
    });
    setInputValue("");
    playTone(880, 35, 0.012);

    const typingId = createTypingMessage();
    const { reply, suggestions } = await resolveAssistantReply(
      trimmed,
      historySnapshot
    );
    setSuggestedPrompts(
      Array.isArray(suggestions) && suggestions.length > 0
        ? suggestions
        : defaultPrompts
    );
    typeResponseIntoMessage(typingId, reply);
  };

  const openChat = () => {
    setIsOpen(true);
    setSuggestedPrompts(defaultPrompts);
    if (messages.length === 0) {
      addMessage({
        id: createId(),
        sender: "bot",
        text: getWelcomeMessage(),
        isTyping: false,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const clearChat = () => {
    clearTypingTimers();
    setIsTyping(false);
    setMessages([
      {
        id: createId(),
        sender: "bot",
        text: "Conversation cleared. Ask any crypto or account question to continue.",
        isTyping: false,
        timestamp: new Date().toISOString(),
      },
    ]);
    conversationContext.current = { lastTopic: null };
    setSuggestedPrompts(defaultPrompts);
    setShowOptions(false);
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitQuery(inputValue);
    }
  };

  const formatTime = (dateLike) =>
    new Date(dateLike).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  useEffect(() => {
    const storedMessages = parseStoredMessages(localStorage.getItem(CHAT_STORAGE_KEY));
    const prefs = JSON.parse(localStorage.getItem(CHAT_PREFS_KEY) || "{}");

    setMessages(storedMessages);
    if (typeof prefs.soundEnabled === "boolean") {
      setSoundEnabled(prefs.soundEnabled);
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const cleanMessages = messages.map((msg) => ({
      id: msg.id,
      sender: msg.sender,
      text: msg.text,
      timestamp: msg.timestamp,
    }));
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(cleanMessages));
  }, [messages, isReady]);

  useEffect(() => {
    if (!isReady) return;
    localStorage.setItem(CHAT_PREFS_KEY, JSON.stringify({ soundEnabled }));
  }, [soundEnabled, isReady]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => () => clearTypingTimers(), []);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-[calc(100vw-2rem)] max-w-md h-[34rem] bg-slate-900 border border-teal-500/40 rounded-xl shadow-2xl overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 flex justify-between items-center border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-teal-500 to-emerald-500 p-2 rounded-lg">
                <SiBitcoincash className="text-white text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-white flex items-center">
                  coinquest Assistant
                  <span className="ml-2 bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full flex items-center">
                    <BsLightningChargeFill className="mr-1" /> live
                  </span>
                </h3>
                <p className="text-xs text-teal-300">Project support assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowOptions((prev) => !prev)}
                className="text-slate-300 hover:text-teal-300 transition-colors p-1 rounded-full hover:bg-slate-700"
                aria-label="Open chat settings"
              >
                <FaCog />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-300 hover:text-teal-300 transition-colors p-1 rounded-full hover:bg-slate-700"
                aria-label="Close chat"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {showOptions && (
            <div className="absolute right-3 top-14 bg-slate-800 shadow-xl rounded-lg border border-teal-500/30 z-10 w-56 overflow-hidden">
              <button
                onClick={() => setSoundEnabled((prev) => !prev)}
                className="w-full text-left px-4 py-3 hover:bg-slate-700/80 text-sm text-white flex items-center border-b border-slate-700"
              >
                <div className="mr-3">
                  {soundEnabled ? (
                    <FaVolumeUp className="text-teal-400" />
                  ) : (
                    <FaVolumeMute className="text-slate-400" />
                  )}
                </div>
                Sound {soundEnabled ? "On" : "Off"}
              </button>
              <button
                onClick={clearChat}
                className="w-full text-left px-4 py-3 hover:bg-slate-700/80 text-sm text-white flex items-center"
              >
                <div className="mr-3">
                  <FaTrash className="text-rose-400" />
                </div>
                Clear conversation
              </button>
              <div className="px-4 py-3 bg-slate-900/80 border-t border-slate-700 flex items-center text-xs text-slate-400">
                <FaLock className="mr-2 text-xs" />
                <span>Session stored on this browser</span>
              </div>
            </div>
          )}

          <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-slate-900/70 to-slate-900">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-slate-500">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center max-w-xs">
                  <div className="bg-gradient-to-br from-teal-600 to-emerald-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <SiBitcoincash className="text-white text-xl" />
                  </div>
                  <h3 className="font-medium text-white mb-2">Live crypto chat</h3>
                  <p className="text-sm mb-4">Ask about prices, portfolio, and account activity.</p>
                  <button
                    onClick={() => submitQuery("Give me the latest project pulse")}
                    className="w-full text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-teal-300 border border-slate-700 transition-colors"
                  >
                    Start with project pulse
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[88%] px-4 py-3 rounded-2xl relative ${
                        msg.sender === "user"
                          ? "bg-gradient-to-br from-teal-700/80 to-teal-800 text-white rounded-br-none"
                          : "bg-slate-800/70 text-slate-100 rounded-bl-none border border-slate-700"
                      }`}
                    >
                      {msg.sender === "bot" && !msg.isTyping && (
                        <div className="absolute -left-2 -top-2 bg-gradient-to-br from-cyan-500 to-blue-500 w-8 h-8 rounded-full flex items-center justify-center border-2 border-slate-900">
                          <SiBitcoincash className="text-white text-xs" />
                        </div>
                      )}
                      <div className="whitespace-pre-line break-words">
                        {msg.text ||
                          (msg.isTyping && (
                            <div className="flex space-x-1 py-1">
                              <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                              <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:120ms]" />
                              <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:240ms]" />
                            </div>
                          ))}
                      </div>
                      {!msg.isTyping && (
                        <div className={`text-xs mt-2 ${msg.sender === "user" ? "text-teal-300/70" : "text-slate-500"}`}>
                          {formatTime(msg.timestamp)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="px-4 pt-2 pb-1 bg-slate-800 border-t border-slate-700">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => submitQuery(prompt)}
                  disabled={isTyping}
                  className="text-xs whitespace-nowrap bg-slate-700 hover:bg-slate-600 text-teal-200 px-3 py-1.5 rounded-full border border-slate-600 disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-800">
            <div className="flex items-end space-x-2">
              <textarea
                rows={1}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1 resize-none bg-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm min-h-[42px] max-h-28"
                placeholder="Ask me something about crypto..."
              />
              <button
                onClick={() => submitQuery(inputValue)}
                disabled={isTyping || !inputValue.trim()}
                className={`p-3 rounded-lg transition-colors ${
                  isTyping || !inputValue.trim()
                    ? "bg-slate-600 cursor-not-allowed text-slate-400"
                    : "bg-teal-600 hover:bg-teal-700 text-white"
                }`}
                aria-label="Send message"
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={openChat}
          className="relative bg-gradient-to-br from-teal-500 to-slate-500 text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform"
          aria-label="Open live chat"
        >
          <SiBitcoincash className="text-2xl" />
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-500 to-slate-500 opacity-75 animate-ping"></span>
        </button>
      )}
    </div>
  );
};

export default ChatBot;
