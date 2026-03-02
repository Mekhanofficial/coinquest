const CryptoQuestions = [
  {
    keyword: "price",
    response:
      "I can check real-time crypto prices! Try asking:\n• 'What's the price of BTC?'\n• 'ETH price?'\n• 'How much is SOL?'\n\nYou can also check the Assets page for complete market data.",
    examples: ["price of BTC", "ETH value", "SOL cost"],
    component: "AssetPage",
  },
  {
    keyword: "portfolio",
    response:
      "Your portfolio balance: 0.5 BTC ($31,425), 3.2 ETH ($11,040), 50 SOL ($7,500). Total: $49,965 📊\n\nFor detailed breakdown, visit your Portfolio Dashboard.",
    examples: ["my balance", "portfolio value", "current holdings"],
    component: "AssetPage",
  },
  {
    keyword: "buy",
    response:
      "To buy crypto:\n1. Go to Buy Crypto section\n2. Choose from trusted exchanges\n3. Follow their purchase process\n\nAvailable exchanges: Binance, Coinbase, Crypto.com, Gemini, Kraken",
    examples: ["how to buy ETH", "purchase BTC", "get SOL"],
    component: "BuyCrypto",
  },
  {
    keyword: "account",
    response:
      "Account management options:\n• Update email/password\n• Change profile photo\n• Manage payment methods\n• Security settings\n\nVisit Account Settings to make changes.",
    examples: ["change password", "update email", "account settings"],
    component: "AccountSetPage",
  },
  {
    keyword: "bot",
    response:
      "AI Trading Bots available:\n• 3COMMAS (25% ROI)\n• CRYPTOHOPPER (30% ROI)\n• TRADINGVIEW (22% ROI)\n\nFeatures:\n- 24/7 automated trading\n- Risk management\n- Backtesting\n\nVisit AI Trading Bots section to activate.",
    examples: ["trading bots", "auto trading", "best bot"],
    component: "BuyBotPage",
  },
  {
    keyword: "signal",
    response:
      "Premium Trading Signals:\n• Learn II Trade (85% win rate)\n• AVA TRADE (78% win rate)\n• RoboForex (72% win rate)\n\nBenefits:\n- Daily trade alerts\n- Market analysis\n- Risk management tips\n\nCheck Signals section for details.",
    examples: ["trading signals", "daily alerts", "best signals"],
    component: "DailySignalPage",
  },
  {
    keyword: "mine",
    response:
      "Crypto Mining options:\n• Bitcoin Mining (30000 GH/s)\n• Ethereum Mining (2000 MH/s)\n• Litecoin Mining (500 MH/s)\n\nBoost mining with Trading Bots (+25% efficiency)\n\nVisit Mining section to start.",
    examples: ["how to mine", "mining profits", "crypto mining"],
    component: "MiningPage",
  },
  {
    keyword: "real estate",
    response:
      "Tokenized Real Estate Investments:\n• Hilton Philadelphia (68.7% ROI)\n• Fabian Labs Palo Alto (57% ROI)\n• Texas Student Housing (84.35% ROI)\n\nMinimum investment: $12,000\n\nSee Real Estate section for opportunities.",
    examples: ["property investment", "real estate", "tokenized assets"],
    component: "RealestPage",
  },
  {
    keyword: "deposit",
    response:
      "Deposit methods:\n1. Crypto deposits (BTC, ETH, USDT)\n2. Bank transfer\n3. Credit card\n\nSupported coins: Bitcoin, Ethereum, Litecoin, Ripple, Bitcoin Cash, Dogecoin\n\nVisit Deposit page for addresses.",
    examples: ["add funds", "deposit money", "fund account"],
    component: "DepositPage",
  },
  {
    keyword: "referral",
    response:
      "Referral Program Benefits:\n• Earn $25 per active referral\n• 10% commission on their trading fees\n• Bonus for both you and your friend\n\nCurrent rewards: $2,450 earned from 98 referrals\n\nCheck Referrals section to share your link.",
    examples: ["invite friends", "referral bonus", "earn from referrals"],
    component: "ReferralsPage",
  },
  {
    keyword: "security",
    response:
      "Security features:\n• Two-factor authentication\n• Withdrawal whitelist\n• Device management\n• Activity monitoring\n\nRecommendations:\n1. Enable 2FA\n2. Use hardware wallet\n3. Regular password updates\n\nConfigure in Account Settings.",
    examples: ["account safety", "protect assets", "security tips"],
    component: "AccountSetPage",
  },
  {
    keyword: "help",
    response:
      "I can help with:\n• Crypto trading\n• Account settings\n• Trading bots\n• Mining\n• Real estate\n• Deposits/withdrawals\n\nTry specific questions like:\n- 'How to buy BTC?'\n- 'Best trading bot?'\n- 'Real estate ROI?'",
    examples: ["support", "assistance", "help me"],
    component: null,
  },
  {
    keyword: "trend",
    response:
      "Current market trends:\n• BTC dominance: 42.3%\n• DeFi TVL: $78B\n• NFT volume: $1.2B\n\nTop performers (24h):\n1. SOL +8.2%\n2. DOT +5.4%\n3. AVAX +4.7%\n\nSee Assets page for live charts.",
    examples: ["market trends", "top coins", "trending"],
    component: "AssetPage",
  },
  {
    keyword: "withdraw",
    response:
      "Withdrawal process:\n1. Go to Wallet → Withdraw\n2. Select currency\n3. Enter amount\n4. Confirm with 2FA\n\nMinimum amounts:\n- BTC: 0.001\n- ETH: 0.01\n- USDT: 10\n\nProcessing time: 5-30 minutes",
    examples: ["send crypto", "withdraw funds", "transfer out"],
    component: "DepositPage",
  },
  {
    keyword: "fees",
    response:
      "Current fees:\n• Trading: 0.1% maker / 0.2% taker\n• Withdrawal:\n  - BTC: 0.0005\n  - ETH: 0.003\n  - USDT: 1 (ERC20)\n\nVIP tiers reduce fees based on volume.",
    examples: ["trading fees", "withdrawal costs", "transaction fees"],
    component: null,
  },
  {
    keyword: "stake",
    response:
      "Staking options:\n• ETH 2.0: 4.2% APY\n• Solana: 6.8% APY\n• Cardano: 3.5% APY\n• Polkadot: 12% APY\n\nMinimum amounts vary by coin. Visit Staking section.",
    examples: ["staking rewards", "earn interest", "passive income"],
    component: "MiningPage",
  },
  {
    keyword: "news",
    response:
      "Latest crypto news:\n1. Bitcoin ETF decision expected Jan 10\n2. Ethereum next upgrade scheduled Q2 2024\n3. CBDC developments in 130 countries\n4. Institutional adoption at all-time high\n\nCheck News section for updates.",
    examples: ["crypto updates", "latest news", "market news"],
    component: "AssetPage",
  },
];


CryptoQuestions.forEach(q => {
  if (!q.response.includes('?')) {
    q.response += "\n\nNeed more details or want to explore related topics?";
  }
});

CryptoQuestions.push(
  {
    keyword: "hello",
    response: "👋 Hey there! Ready to dive into crypto? What's on your mind - prices, news, or your portfolio?",
    examples: ["hi", "hey", "howdy"],
  },
  {
    keyword: "thank",
    response: "You're welcome! 😊 Always happy to help with crypto insights.\n\nWhat else can I assist you with today?",
    examples: ["thanks", "appreciate", "thank you"],
  },
  {
    keyword: "how are you",
    response: "I'm running at 100% crypto-processing power! 💻⚡\n\nReady to analyze markets or check your portfolio?",
    examples: ["how are you", "how's it going"],
  }
);

export default CryptoQuestions;