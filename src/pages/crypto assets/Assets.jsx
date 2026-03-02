import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useParams } from "react-router-dom";
import axios from "axios";

const COIN_STATS_NEWS_URL =
  "https://api.coinstats.app/public/v1/news?skip=0&limit=6";
const REDDIT_NEWS_URL =
  "https://www.reddit.com/r/CryptoCurrency/hot.json?limit=6";
const NEWS_PLACEHOLDER =
  "https://via.placeholder.com/160x90.png?text=Crypto+News";

const normalizeCoinStatsNews = (payload) => {
  const articles = Array.isArray(payload?.news) ? payload.news : [];
  return articles
    .filter((article) => article?.title && (article.link || article.url))
    .slice(0, 4)
    .map((article) => ({
      title: article.title,
      description:
        article.description ||
        article.content?.slice(0, 120) ||
        "Stay informed with the latest crypto headlines.",
      url: article.link || article.url,
      urlToImage: article.imageUrl || article.thumbnail || NEWS_PLACEHOLDER,
      publishedAt: article.date
        ? new Date(article.date).toLocaleString()
        : new Date().toLocaleString(),
    }));
};

const normalizeRedditNews = (payload) => {
  const posts = Array.isArray(payload?.data?.children)
    ? payload.data.children
    : [];
  return posts
    .map((child) => child?.data)
    .filter((post) => post?.title && post?.permalink)
    .slice(0, 4)
    .map((post) => ({
      title: post.title,
      description: post.selftext
        ? `${post.selftext.trim().slice(0, 140)}...`
        : `r/${post.subreddit} • ${post.author}`,
      url: `https://www.reddit.com${post.permalink}`,
      urlToImage:
        post.thumbnail && post.thumbnail.startsWith("http")
          ? post.thumbnail
          : NEWS_PLACEHOLDER,
      publishedAt: post.created_utc
        ? new Date(post.created_utc * 1000).toLocaleString()
        : new Date().toLocaleString(),
    }));
};

// Helper: Volume formatting
const abbreviateVolume = (volume) => {
  if (volume >= 1_000_000_000)
    return `$${(volume / 1_000_000_000).toFixed(1)}B`;
  if (volume >= 1_000_000) return `$${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `$${(volume / 1_000).toFixed(1)}K`;
  return `$${volume.toLocaleString()}`;
};

// Individual Crypto Card
const CryptoCard = ({ crypto }) => {
  const { theme } = useTheme();

  return (
    <div
      className={`bg-gradient-to-r rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-300 border hover:border-teal-500 hover:shadow-teal-500/50 hover:scale-[1.02] flex items-center ${
        theme === "dark"
          ? "from-slate-900 to-slate-800 border-slate-600"
          : "from-slate-100 to-slate-200 border-gray-300"
      }`}
    >
      <img src={crypto.image} alt={crypto.name} className="w-10 h-10 mr-4" />
      <div className="flex-1">
        <div className="flex justify-between items-center">
          <span
            className={`text-sm font-medium ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            {crypto.name}
          </span>
          <span
            className={`text-sm font-semibold ${
              crypto.change.startsWith("-") ? "text-red-400" : "text-green-400"
            }`}
          >
            {crypto.change}
          </span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <h2
            className={`text-lg font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {crypto.price}
          </h2>
          <span
            className={`text-sm ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Vol: {crypto.volume}
          </span>
        </div>
      </div>
    </div>
  );
};

// News Card
const NewsCard = ({ article }) => {
  const { theme } = useTheme();

  const imageUrl =
    article.urlToImage && article.urlToImage.startsWith("http")
      ? article.urlToImage
      : NEWS_PLACEHOLDER;

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block hover:opacity-80 transition-opacity"
    >
      <div className="flex items-start space-x-4">
        <img
          src={imageUrl}
          alt={article.title}
          onError={(event) => {
            event.currentTarget.src = NEWS_PLACEHOLDER;
          }}
          className="w-32 h-32 object-cover rounded-md"
        />
        <div>
          <h3
            className={`font-semibold text-sm mb-2 line-clamp-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {article.title}
          </h3>
          <p
            className={`text-xs line-clamp-3 ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {article.description}
          </p>
          <p
            className={`text-[10px] font-semibold mt-1 uppercase tracking-wide ${
              theme === "dark" ? "text-teal-300" : "text-teal-600"
            }`}
          >
            {article.publishedAt}
          </p>
        </div>
      </div>
    </a>
  );
};

// Main Component
export default function AssetPage() {
  const [cryptoData, setCryptoData] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState({ crypto: true, news: true });
  const [error, setError] = useState({ crypto: null, news: null });
  const { theme } = useTheme();
  const { symbol } = useParams();

  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        const response = await axios.get(
          "https://api.coingecko.com/api/v3/coins/markets",
          {
            params: {
              vs_currency: "usd",
              ids: "bitcoin,ethereum,tether,ripple,binancecoin,solana,usd-coin,cardano,dogecoin,polkadot,uniswap,litecoin,chainlink,bitcoin-cash,stellar,filecoin,vechain,monero,avalanche-2,polygon,cosmos,tron",
              order: "market_cap_desc",
              per_page: 22,
              page: 1,
              sparkline: false,
            },
          }
        );

        const formattedData = response.data.map((crypto) => ({
          name: crypto.name,
          symbol: crypto.symbol.toUpperCase(),
          price: `$${crypto.current_price.toLocaleString()}`,
          change: `${crypto.price_change_percentage_24h.toFixed(2)}%`,
          volume: abbreviateVolume(crypto.total_volume),
          image: crypto.image,
        }));

        setCryptoData(formattedData);
      } catch (err) {
        console.error("Error fetching crypto data:", err);
        setError((prev) => ({ ...prev, crypto: err.message }));
      } finally {
        setLoading((prev) => ({ ...prev, crypto: false }));
      }
    };

    fetchCryptoData();
  }, []);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading((prev) => ({ ...prev, news: true }));
      setError((prev) => ({ ...prev, news: null }));

      try {
        const { data } = await axios.get(COIN_STATS_NEWS_URL);
        const coinStatsNews = normalizeCoinStatsNews(data);

        if (coinStatsNews.length) {
          setNews(coinStatsNews);
          return;
        }

        throw new Error("CoinStats returned no news");
      } catch (primaryError) {
        console.warn("Primary news source failed:", primaryError);

        try {
          const fallbackResponse = await axios.get(REDDIT_NEWS_URL);
          const redditNews = normalizeRedditNews(fallbackResponse.data);

          if (redditNews.length) {
            setNews(redditNews);
            return;
          }

          throw new Error("Reddit returned no news");
        } catch (fallbackError) {
          console.error("Fallback news source failed:", fallbackError);
          setError((prev) => ({
            ...prev,
            news:
              fallbackError?.message ||
              "Unable to load live news right now, please try again later.",
          }));
          setNews([]);
        }
      } finally {
        setLoading((prev) => ({ ...prev, news: false }));
      }
    };

    fetchNews();
  }, [symbol]);

  return (
    <section
      className={`min-h-screen w-full px-4 py-14 lg:px-10  ${
        theme === "dark" ? "bg-gray-900" : "bg-slate-50"
      }`}
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Crypto Section */}
        <div className="w-full lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {loading.crypto ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className={`rounded-lg p-4 h-24 animate-pulse ${
                  theme === "dark" ? "bg-slate-700" : "bg-slate-200"
                }`}
              />
            ))
          ) : error.crypto ? (
            <div className="col-span-full text-center py-8">
              <p className="text-red-400">Error loading crypto data</p>
            </div>
          ) : (
            cryptoData.map((crypto, index) => (
              <CryptoCard key={`${crypto.symbol}-${index}`} crypto={crypto} />
            ))
          )}
        </div>

        {/* News Section */}
        <div
          className={`w-full lg:w-1/3 p-6 rounded-lg shadow-md border ${
            theme === "dark"
              ? "bg-slate-800 border-slate-600"
              : "bg-white border-gray-300"
          }`}
        >
          <h2
            className={`text-lg font-bold mb-6 ${
              theme === "dark" ? "text-teal-400" : "text-teal-600"
            }`}
          >
            LIVE NEWS
          </h2>
          <div className="space-y-6">
            {loading.news ? (
              Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 animate-pulse"
                >
                  <div
                    className={`w-32 h-32 rounded-md ${
                      theme === "dark" ? "bg-slate-700" : "bg-slate-200"
                    }`}
                  />
                  <div className="flex-1 space-y-2">
                    <div
                      className={`h-4 w-3/4 rounded ${
                        theme === "dark" ? "bg-slate-700" : "bg-slate-200"
                      }`}
                    />
                    <div
                      className={`h-3 w-full rounded ${
                        theme === "dark" ? "bg-slate-700" : "bg-slate-200"
                      }`}
                    />
                    <div
                      className={`h-3 w-5/6 rounded ${
                        theme === "dark" ? "bg-slate-700" : "bg-slate-200"
                      }`}
                    />
                  </div>
                </div>
              ))
            ) : error.news ? (
              <p className="text-red-400">Error loading news</p>
            ) : news.length > 0 ? (
              news.map((article, index) => (
                <NewsCard key={`${article.url}-${index}`} article={article} />
              ))
            ) : (
              <p
                className={theme === "dark" ? "text-gray-300" : "text-gray-500"}
              >
                No news available
              </p>
            )}

            <a
              href="https://www.example.com/crypto-news"
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-6 block w-full text-center font-semibold py-2 px-4 rounded-lg transition-colors ${
                theme === "dark"
                  ? "bg-teal-600 hover:bg-teal-700 text-white"
                  : "bg-teal-500 hover:bg-teal-600 text-white"
              }`}
            >
              Read More
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
