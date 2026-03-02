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
import cryptoQuestions from "./CryptoQuestions";

const tokenPrices = {
  BTC: 60000,
  ETH: 3200,
  SOL: 150,
  ADA: 1.2,
  DOGE: 0.12,
};

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasWelcomed, setHasWelcomed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const conversationContext = useRef({ lastTopic: null });
  const { userData } = useUser();
  const { transactions, pendingRequests } = useTransactions();
  const { copyTraderStats } = useCopyTraders();

  const formatCurrency = (value) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const cryptoApi = {
    getPrice: async (symbol) => {
      const prices = {
        btc: {
          price: 62850 + Math.random() * 500 - 250,
          change: 2.4 + Math.random() * 3 - 1.5,
        },
        eth: {
          price: 3450 + Math.random() * 100 - 50,
          change: -1.2 + Math.random() * 2 - 1,
        },
        sol: {
          price: 150 + Math.random() * 10 - 5,
          change: 5.7 + Math.random() * 2 - 1,
        },
        ada: {
          price: 0.48 + Math.random() * 0.1 - 0.05,
          change: 0.8 + Math.random() * 1 - 0.5,
        },
        doge: {
          price: 0.15 + Math.random() * 0.03 - 0.015,
          change: -3.2 + Math.random() * 2 - 1,
        },
      };

      const coin = symbol.toLowerCase();
      const data = prices[coin] || { price: "N/A", change: "N/A" };

      const emoji = data.change > 0 ? "🚀" : "🔻";
      const sentiment =
        data.change > 2
          ? "Bullish momentum!"
          : data.change < -2
          ? "Caution advised."
          : "Neutral trend.";

      return `${symbol.toUpperCase()} is at $${data.price.toLocaleString()} (${emoji} ${Math.abs(
        data.change
      ).toFixed(2)}%)\n\n${sentiment} ${
        conversationContext.current.lastTopic === "portfolio"
          ? "Would you like to adjust your holdings?"
          : "Need price alerts for this asset?"
      }`;
    },

    getPortfolio: async () => {
      const holdings = userData?.holdings || [
        { name: "BTC", amount: 0.5 },
        { name: "ETH", amount: 3.2 },
      ];
      const normalizedHoldings = holdings.map((item) => {
        const price = tokenPrices[item.name] || 0;
        return {
          ...item,
          price,
          value: item.amount * price,
        };
      });

      const totalValue =
        userData?.portfolioValue ??
        normalizedHoldings.reduce((sum, item) => sum + item.value, 0);

      const lines = normalizedHoldings
        .map(
          (item) =>
            `• ${item.amount.toFixed(2)} ${item.name} (${formatCurrency(
              item.value
            )})`
        )
        .join("\n");

      return `Your portfolio:\n\n${lines}\n\nTotal: ${formatCurrency(
        totalValue
      )} 📊\n\n${
        totalValue > 50000
          ? "Great performance! 💪"
          : "Consider rebalancing for better returns."
      }`;
    },

    getNews: async () => {
      const headlines = [
        "Bitcoin ETF approval expected next month",
        "Ethereum completes major network upgrade",
        "Crypto market cap surpasses $2.5 trillion",
        "Institutional crypto investments hit record high",
        "CBDC developments accelerating globally",
      ];

      return `📰 Hot crypto news:\n${headlines
        .slice(0, 3)
        .map((h, i) => `${i + 1}. ${h}`)
        .join("\n")}\n\n${
        conversationContext.current.lastTopic === "price"
          ? "Want analysis on how this affects prices?"
          : "Interested in deeper analysis?"
      }`;
    },
  };

  const personalityResponses = [
    "Interesting perspective! Crypto moves fast these days...",
    "Ah, good question! Let me think 🤔",
    "Fascinating! I was just analyzing similar trends...",
    "Great timing! The market's been volatile today...",
    "Smart question! Let me check the latest data...",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleOpenChat = () => {
    setIsOpen(true);
    if (!hasWelcomed) {
      const balance = formatCurrency(userData?.balance ?? 0);
      const plan = userData?.subscriptionPlan || "Basic";
      const pending = pendingRequests?.length || 0;
      const lastTransaction = transactions?.[0];
      const snapshot =
        lastTransaction
          ? `Last transaction: ${lastTransaction.type} ${formatCurrency(
              Number(lastTransaction.amount)
            )} (${lastTransaction.status}).`
          : "No transactions recorded yet.";
      addBotMessage(
        "👋 Welcome to coinquest! I'm your crypto assistant.\n\n" +
          "I can help with:\n• Real-time prices\n• Portfolio analysis\n• Market news\n• Trading strategies\n\n" +
          `Here’s where you stand: Balance ${balance} • Plan: ${plan} • Pending: ${pending}.\n${snapshot}\n\n` +
          "What crypto topic interests you today?"
      );
      setHasWelcomed(true);
    }
  };

  const simulateHumanTyping = (response) => {
    const words = response.split(" ");
    let currentIndex = 0;

    const typeNextChunk = () => {
      if (currentIndex >= words.length) {
        setIsTyping(false);
        return;
      }

      const chunkSize = 2 + Math.floor(Math.random() * 3);
      const chunk = words
        .slice(currentIndex, currentIndex + chunkSize)
        .join(" ");

      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg.sender === "bot" && lastMsg.isTyping) {
          return [
            ...prev.slice(0, -1),
            {
              text: lastMsg.text + " " + chunk,
              sender: "bot",
              timestamp: new Date(),
              isTyping: true,
            },
          ];
        }
        return prev;
      });

      currentIndex += chunkSize;
      const delay = 50 + Math.random() * 200;
      setTimeout(typeNextChunk, delay * chunkSize);
    };

    setTimeout(typeNextChunk, 400 + Math.random() * 600);
  };

  const addBotMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      { text, sender: "bot", timestamp: new Date() },
    ]);

    if (soundEnabled) {
      try {
        const audio = new Audio("/public/sound/click.wav");
        audio.volume = 0.3;
        audio.play();
      } catch (e) {
        console.log("Sound error:", e);
      }
    }
  };

  const getAIResponse = async (query) => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    setIsTyping(true);
    setMessages((prev) => [
      ...prev,
      {
        text: "",
        sender: "bot",
        timestamp: new Date(),
        isTyping: true,
      },
    ]);

    try {
      if (Math.random() > 0.7) {
        const personality =
          personalityResponses[
            Math.floor(Math.random() * personalityResponses.length)
          ];
        addBotMessage(personality);
      }

      const contextKeywords = ["price", "portfolio", "news", "buy", "trade"];
      const detectedKeyword = contextKeywords.find((keyword) =>
        query.toLowerCase().includes(keyword)
      );

      if (detectedKeyword) {
        conversationContext.current.lastTopic = detectedKeyword;
      }

      const quickQuestion = cryptoQuestions.find((q) =>
        query.toLowerCase().includes(q.keyword.toLowerCase())
      );

      if (quickQuestion) {
        simulateHumanTyping(quickQuestion.response);
        return;
      }

      const commands = {
        price: async () => {
          const coinMatch = query.match(
            /(btc|bitcoin|eth|ethereum|sol|solana|ada|cardano|doge|dogecoin)/i
          );
          const symbol = coinMatch ? coinMatch[0].slice(0, 3) : "btc";
          return await cryptoApi.getPrice(symbol);
        },
        portfolio: async () => await cryptoApi.getPortfolio(),
        project: async () => {
          const balance = formatCurrency(userData?.balance ?? 0);
          const plan = userData?.subscriptionPlan || "Basic";
          const pending = pendingRequests?.length || 0;
          const activeCopyers = copyTraderStats?.liveTrades || 0;
          const recentTx = transactions?.[0];
          const lastTxLine = recentTx
            ? `• Last transaction: ${recentTx.type} ${formatCurrency(
                Number(recentTx.amount)
              )} (${recentTx.status})`
            : "• No transactions yet.";

          return `Project pulse:\n• Balance: ${balance}\n• Plan: ${plan}\n• Pending transactions: ${pending}\n• Active copy traders: ${activeCopyers}\n${lastTxLine}\nNeed help linking an action? Ask me for deposit, withdraw, or trading signals!`;
        },
        news: async () => await cryptoApi.getNews(),
        help: async () =>
          "I specialize in:\n\n• Real-time prices 📈\n• Portfolio analysis 💼\n" +
          "• Market news 📰\n• Trading strategies 🤖\n\nTry:\n• 'How's ETH doing?'\n" +
          "• 'Show my portfolio'\n• 'Latest crypto news'",
      };

      for (const [keyword, handler] of Object.entries(commands)) {
        if (query.toLowerCase().includes(keyword)) {
          const response = await handler();
          simulateHumanTyping(response);
          return;
        }
      }

      const fallbacks = [
        `I'm focused on crypto insights. Try asking about:\n• "Should I buy BTC now?"\n• "How's my portfolio performing?"\n• "What's new in crypto?"`,
        `As your crypto assistant, I specialize in market analysis. Ask me about prices, news, or your portfolio!`,
        `Hmm, I'm best with crypto topics. Maybe try:\n• "ETH price prediction"\n• "Crypto market trends"\n• "Portfolio rebalancing"`,
      ];

      const response = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      simulateHumanTyping(response);
    } catch (error) {
      console.error("Response error:", error);
      addBotMessage(
        "😅 Whoops! Let me try that again... Technical glitch in the matrix!"
      );
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMsg = {
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    await getAIResponse(inputValue);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleSound = () => setSoundEnabled(!soundEnabled);

  const clearChat = () => {
    setMessages([]);
    setShowOptions(false);
    conversationContext.current = { lastTopic: null };
    addBotMessage("Chat refreshed! ✨ What crypto topic shall we explore now?");
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-full max-w-md h-[32rem] bg-slate-900 border border-teal-500/50 rounded-xl shadow-2xl overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 flex justify-between items-center border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-teal-500 to-emerald-500 p-2 rounded-lg">
                <SiBitcoincash className="text-white text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-white flex items-center">
                  coinquest Assistant
                  <span className="ml-2 bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full flex items-center">
                    <BsLightningChargeFill className="mr-1" /> AI Powered
                  </span>
                </h3>
                <p className="text-xs text-teal-300">Real-time crypto support</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="text-slate-300 hover:text-teal-300 transition-colors p-1 rounded-full hover:bg-slate-700"
              >
                <FaCog />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-300 hover:text-teal-300 transition-colors p-1 rounded-full hover:bg-slate-700"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {showOptions && (
            <div className="absolute right-3 top-14 bg-slate-800 shadow-xl rounded-lg border border-teal-500/30 z-10 w-56 overflow-hidden">
              <button
                onClick={toggleSound}
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
                Clear Conversation
              </button>
              <div className="px-4 py-3 bg-slate-900/80 border-t border-slate-700 flex items-center text-xs text-slate-400">
                <FaLock className="mr-2 text-xs" />
                <span>End-to-end encrypted</span>
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
                  <h3 className="font-medium text-white mb-2">
                    Your Crypto Assistant
                  </h3>
                  <p className="text-sm mb-4">
                    Ask me about prices, portfolios, trading, or market trends
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setInputValue("What's Bitcoin's price?")}
                      className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-teal-300 border border-slate-700 transition-colors"
                    >
                      Bitcoin Price
                    </button>
                    <button
                      onClick={() => setInputValue("How's my portfolio?")}
                      className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-teal-300 border border-slate-700 transition-colors"
                    >
                      My Portfolio
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <button
                      onClick={() => {
                        setInputValue("Give me the latest project pulse");
                      }}
                      className="w-full text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-teal-300 border border-slate-700 transition-colors"
                    >
                      Project Pulse
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl relative ${
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
                      <div className="whitespace-pre-line">
                        {msg.text ||
                          (msg.isTyping && (
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                              <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-150" />
                              <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-300" />
                            </div>
                          ))}
                      </div>
                      {!msg.isTyping && (
                        <div
                          className={`text-xs mt-2 ${
                            msg.sender === "user"
                              ? "text-teal-300/70"
                              : "text-slate-500"
                          }`}
                        >
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

          <div className="p-4 bg-slate-800 border-t border-slate-700">
            <div className="flex items-center space-x-2">
              <textarea
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1 resize-none bg-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                placeholder="Ask me something about crypto..."
              />
              <button
                onClick={handleSendMessage}
                disabled={isTyping}
                className={`p-3 rounded-lg transition-colors ${
                  isTyping
                    ? "bg-slate-600 cursor-not-allowed"
                    : "bg-teal-600 hover:bg-teal-700 text-white"
                }`}
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={handleOpenChat}
          className="relative bg-gradient-to-br from-teal-500 to-slate-500 text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          <SiBitcoincash className="text-2xl" />
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-500 to-slate-500 opacity-75 animate-ping"></span>
        </button>
      )}
    </div>
  );
};

export default ChatBot;
