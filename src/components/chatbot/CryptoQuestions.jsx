const CryptoQuestions = [
  {
    keyword: "price",
    response:
      "I can check crypto prices quickly. Try asking:\n- What's the price of BTC?\n- ETH price?\n- How much is SOL?\n\nYou can also open the Assets page for broader market data.",
    examples: ["price of BTC", "ETH value", "SOL cost"],
    component: "AssetPage",
  },
  {
    keyword: "portfolio",
    response:
      "For your exact portfolio values, ask for a portfolio summary while logged in.\n\nYou can also open the Portfolio Dashboard for full allocation details.",
    examples: ["my balance", "portfolio value", "current holdings"],
    component: "AssetPage",
  },
  {
    keyword: "buy",
    response:
      "To buy crypto:\n1. Go to the Buy Crypto section\n2. Choose an exchange\n3. Complete the provider flow\n\nCommon exchanges: Binance, Coinbase, Crypto.com, Gemini, Kraken.",
    examples: ["how to buy ETH", "purchase BTC", "get SOL"],
    component: "BuyCrypto",
  },
  {
    keyword: "account",
    response:
      "Account options include profile updates, password changes, payment method updates, and security settings.\n\nOpen Account Settings to manage these.",
    examples: ["change password", "update email", "account settings"],
    component: "AccountSetPage",
  },
  {
    keyword: "bot",
    response:
      "AI trading bots are available with risk controls and automation features.\n\nOpen the AI Trading Bots section to compare options and activate one.",
    examples: ["trading bots", "auto trading", "best bot"],
    component: "BuyBotPage",
  },
  {
    keyword: "signal",
    response:
      "Signal plans provide market alerts, trade ideas, and risk notes.\n\nOpen the Signals section to compare active plans.",
    examples: ["trading signals", "daily alerts", "best signals"],
    component: "DailySignalPage",
  },
  {
    keyword: "mine",
    response:
      "Mining packages are available with different hash rates and durations.\n\nOpen Mining to view active plans and expected returns.",
    examples: ["how to mine", "mining profits", "crypto mining"],
    component: "MiningPage",
  },
  {
    keyword: "real estate",
    response:
      "Tokenized real estate opportunities are listed in the Real Estate section with ROI estimates and minimums.",
    examples: ["property investment", "real estate", "tokenized assets"],
    component: "RealestPage",
  },
  {
    keyword: "deposit",
    response:
      "Deposit methods include crypto transfer, bank transfer, and card options (availability depends on region).\n\nOpen Deposit for supported networks and instructions.",
    examples: ["add funds", "deposit money", "fund account"],
    component: "DepositPage",
  },
  {
    keyword: "withdraw",
    response:
      "Withdrawal steps:\n1. Wallet -> Withdraw\n2. Select currency\n3. Enter amount\n4. Confirm security checks\n\nOpen Deposit/Withdraw to continue.",
    examples: ["send crypto", "withdraw funds", "transfer out"],
    component: "DepositPage",
  },
  {
    keyword: "referral",
    response:
      "Referral rewards depend on active invites and platform terms.\n\nOpen Referrals to copy your link and track rewards.",
    examples: ["invite friends", "referral bonus", "earn from referrals"],
    component: "ReferralsPage",
  },
  {
    keyword: "security",
    response:
      "Recommended security setup:\n1. Enable 2FA\n2. Use strong unique passwords\n3. Review account activity regularly\n4. Use withdrawal protections where available",
    examples: ["account safety", "protect assets", "security tips"],
    component: "AccountSetPage",
  },
  {
    keyword: "fees",
    response:
      "Fees vary by transaction type, network, and plan tier.\n\nOpen the relevant transaction screen to see the latest exact fee before confirming.",
    examples: ["trading fees", "withdrawal costs", "transaction fees"],
    component: null,
  },
  {
    keyword: "stake",
    response:
      "Staking plans vary by asset and duration.\n\nOpen the staking or earning section to compare APY and lock periods.",
    examples: ["staking rewards", "earn interest", "passive income"],
    component: "MiningPage",
  },
  {
    keyword: "news",
    response:
      "For market updates, ask me for a quick market summary and I will provide the latest directional overview.",
    examples: ["crypto updates", "latest news", "market news"],
    component: "AssetPage",
  },
];

CryptoQuestions.forEach((item) => {
  if (!item.response.includes("?")) {
    item.response += "\n\nNeed more details? Ask a follow-up question.";
  }
});

CryptoQuestions.push(
  {
    keyword: "hello",
    response:
      "Hello. I can help with prices, portfolio summary, market updates, and account pulse. What do you want to check first?",
    examples: ["hi", "hey", "hello"],
    component: null,
  },
  {
    keyword: "thank",
    response: "You are welcome. Ask another question any time.",
    examples: ["thanks", "appreciate", "thank you"],
    component: null,
  },
  {
    keyword: "how are you",
    response: "I am ready to help. Ask about price, portfolio, transactions, or market updates.",
    examples: ["how are you", "how is it going"],
    component: null,
  }
);

export default CryptoQuestions;
