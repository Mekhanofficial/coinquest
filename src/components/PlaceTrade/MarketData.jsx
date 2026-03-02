import { useEffect, useState } from "react";

const DEFAULT_MARKET_PAIRS = [
  { pair: "BTC/USD", change: "+0.00%", price: "$0.00", isPositive: true },
  { pair: "ETH/USD", change: "+0.00%", price: "$0.00", isPositive: true },
  { pair: "SOL/USD", change: "+0.00%", price: "$0.00", isPositive: true },
  { pair: "EUR/USD", change: "+0.00%", price: "0.00", isPositive: true },
  { pair: "XAU/USD", change: "+0.00%", price: "$0.00", isPositive: true },
];

const formatterUSD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const formatPercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

const formatRate = (value) =>
  value || value === 0 ? value.toFixed(4) : "—";

export default function MarketData({ theme }) {
  const [marketPairs, setMarketPairs] = useState(DEFAULT_MARKET_PAIRS);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const fetchMarketSnapshot = async () => {
    const cryptoUrl =
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true";
      const todayFxUrl =
        "https://api.exchangerate.host/latest?base=USD&symbols=EUR";
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];
      const yesterdayFxUrl = `https://api.exchangerate.host/${yesterday}?base=USD&symbols=EUR`;
      const goldUrl = "https://data-asg.goldprice.org/dbXRates/USD";

      try {
        const [cryptoRes, fxRes, fxPrevRes, goldRes] = await Promise.all([
          fetch(cryptoUrl, { signal: controller.signal }),
          fetch(todayFxUrl, { signal: controller.signal }),
          fetch(yesterdayFxUrl, { signal: controller.signal }),
          fetch(goldUrl, { signal: controller.signal }),
        ]);

        if (!isActive) return;

        const cryptoData = cryptoRes.ok ? await cryptoRes.json() : {};
        const fxData = fxRes.ok ? await fxRes.json() : null;
        const fxPrevData = fxPrevRes.ok ? await fxPrevRes.json() : null;
        const goldData = goldRes.ok ? await goldRes.json() : null;

        const nextPairs = [];

        if (cryptoData.bitcoin) {
          const change = cryptoData.bitcoin.usd_24h_change;
          nextPairs.push({
            pair: "BTC/USD",
            change: formatPercent(change),
            price: formatterUSD.format(cryptoData.bitcoin.usd),
            isPositive: change >= 0,
          });
        }

        if (cryptoData.ethereum) {
          const change = cryptoData.ethereum.usd_24h_change;
          nextPairs.push({
            pair: "ETH/USD",
            change: formatPercent(change),
            price: formatterUSD.format(cryptoData.ethereum.usd),
            isPositive: change >= 0,
          });
        }

        if (cryptoData.solana) {
          const change = cryptoData.solana.usd_24h_change;
          nextPairs.push({
            pair: "SOL/USD",
            change: formatPercent(change),
            price: formatterUSD.format(cryptoData.solana.usd),
            isPositive: change >= 0,
          });
        }

        if (fxData?.rates?.EUR) {
          const latestRate = fxData.rates.EUR;
          let change = null;
          const prevRate = fxPrevData?.rates?.EUR;
          if (prevRate) {
            change = ((latestRate - prevRate) / prevRate) * 100;
          }

          nextPairs.push({
            pair: "EUR/USD",
            change: change === null ? "—" : formatPercent(change),
            price: formatRate(latestRate),
            isPositive: change ? change >= 0 : true,
          });
        }

        const goldItem = goldData?.items?.[0];
        if (goldItem) {
          const goldPrice = parseFloat(goldItem.xauPrice) || 0;
          let changeValue = null;
          if (goldItem.chgXau !== undefined) {
            changeValue = parseFloat(goldItem.chgXau);
          } else if (goldItem.change !== undefined) {
            changeValue = parseFloat(goldItem.change);
          }
          let goldChangePercent = null;
          if (goldPrice && changeValue !== null && !Number.isNaN(changeValue)) {
            if (Math.abs(changeValue) <= 5) {
              goldChangePercent = changeValue;
            } else {
              goldChangePercent = (changeValue / goldPrice) * 100;
            }
          }

          nextPairs.push({
            pair: "XAU/USD",
            change:
              goldChangePercent === null
                ? "—"
                : formatPercent(goldChangePercent),
            price: formatterUSD.format(goldPrice || 0),
            isPositive: goldChangePercent === null ? true : goldChangePercent >= 0,
          });
        }

        if (nextPairs.length > 0) {
          setMarketPairs(nextPairs);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Market overview fetch failed", error);
        }
      }
    };

    fetchMarketSnapshot();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  return (
    <div
      className={`mt-6 rounded-xl shadow-sm p-6 ${
        theme === "dark" ? "bg-gray-800" : "bg-white"
      }`}
    >
      <h3
        className={`text-lg font-semibold mb-4 ${
          theme === "dark" ? "text-white" : "text-gray-900"
        }`}
      >
        Market Overview
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {marketPairs.map(({ pair, change, price, isPositive }) => (
          <div
            key={pair}
            className={`p-6 rounded-lg ${
              theme === "dark" ? "bg-gray-700" : "bg-gray-50"
            }`}
          >
            <div className="flex justify-between items-center">
              <span
                className={`font-medium ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {pair}
              </span>
              <span
                className={`text-sm ${
                  isPositive
                    ? theme === "dark"
                      ? "text-green-400"
                      : "text-green-600"
                    : theme === "dark"
                    ? "text-red-400"
                    : "text-red-600"
                }`}
              >
                {change}
              </span>
            </div>
            <div
              className={`text-xl font-bold mt-1 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {price}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
