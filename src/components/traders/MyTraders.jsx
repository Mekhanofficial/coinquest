import { useState, useEffect } from "react";
import traderImages from "./MyTradersImg";
import { useTheme } from "next-themes";
import { TraderCard } from "./TraderCard";
import { useCopyTraders } from "../../context/CopyTraderContext";
import { useUser } from "../../context/UserContext";
import { toast } from "react-toastify";

const NAMES = [
  "Lisa Dawson",
  "John Cerasani",
  "Defend Dark",
  "Tori Trades",
  "GirlGone_Crypto",
  "Molly Elmore",
  "Dontrece_HD〽️",
  "Taylor Hamilton",
  "Laurent Jones",
  "Kevin Kruze",
  "Angelo",
  "Crypto Tea",
  "Clarity Crypto",
  "Mrturnupthehustle",
  "TwentyEight",
  "Loudmouth.eth",
  "TJR",
  "Renzo",
  "Randi Hipper",
  "Cryptologicjohn",
  "Micheal Rodriguez",
  "Tradetravelchill",
  "Penny2x",
  "Micheal S Gibson",
  "Jpdandrea",
  "Crypto Rover",
  "Luke Belmar",
  "BAM INVESTOR",
  "Chris Buziness",
  "Coach Vince",
  "Milly",
  "Laurent Boutiller",
  "Dom Lucre",
  "Mason Versluis",
  "Greg",
  "Cole Jafari",
  "Evca Wolf",
  "Jenny",
  "SlumDoge",
  "Layah Woods",
  "Eva Savagiou",
  "CrypNuevo",
  "Zach Humphries",
  "Justin Wallers",
  "Oscar Ramos",
  "Brian Jung",
  "Calvin Williams",
  "Ixnkong",
  "Tiffany",
  "Tarabull808",
  "Tyler",
  "Stephan Borg",
  "Mona",
  "Blonde Broker",
  "Tommy Bryson",
  "JA",
  "Josh Lenny Lewis",
  "Lainylainylainy",
  "Chris Buziness",
  "Layah Heilpern",
  "Arno Wingen",
  "Kadin Thompson",
  "Tiago Andrade",
  "Hamza Hamed",
  "Rico",
  "Roc Zacharias",
  "Rey",
  "STXRBOY999",
  "NinjaScalp",
  "Thomas Kralow",
  "Alex Gonzalez",
  "Bob Smith",
  "Charlie Davis",
  "Diana Evans",
  "Ethan Wilson",
  "Fiona Carter",
  "George Adams",
  "Hannah Scott",
  "Ian Thompson",
  "Julia Baker",
  "Alice Johnson",
  "Bob Smith",
  "Charlie Davis",
  "Diana Evans",
  "Ethan Wilson",
  "Fiona Carter",
  "George Adams",
  "Hannah Scott",
  "Ian Thompson",
  "Julia Baker",
];

// Utility function to generate traders data
const generateTraders = () => {
  return Array.from({ length: 100 }, (_, i) => {
    const copyPrice = Number((Math.random() * 950 + 50).toFixed(2));
    const performance =
      copyPrice >= 1000 ? 20 : copyPrice >= 500 ? 15 : copyPrice >= 250 ? 11 : 8;

    return {
      id: i + 1,
      name: NAMES[i % NAMES.length],
      winRate: Math.floor(Math.random() * 31) + 70,
      profitShare: Math.floor(Math.random() * 21) + 10,
      performance,
      balance: Number((Math.random() * 500 + 200).toFixed(2)),
      copyPrice,
      losses: Math.floor(Math.random() * 10),
      wins: Math.floor(Math.random() * 50) + 1,
      image: traderImages[i % traderImages.length],
    };
  });
};

export default function MyTraderPage() {
  const { theme } = useTheme();
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const { copiedTraders, addCopiedTrader } = useCopyTraders();
  const [traders, setTraders] = useState([]);
  const { userData } = useUser();

  useEffect(() => {
    setTraders(generateTraders());
  }, []);

  const filteredTraders = traders.filter((trader) =>
    trader.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (id) => {
    if (userData?.balance == null || userData.balance <= 0) {
      toast.error(
        "Insufficient balance. Please deposit funds to copy traders."
      );
      return;
    }

    if (copiedTraders.some((t) => t.id === id)) {
      toast.error("You're already copying this trader");
      return;
    }

    setLoadingId(id);
    const traderToCopy = traders.find((t) => t.id === id);
    const investmentAmount =
      parseFloat(traderToCopy.copyPrice) ||
      parseFloat(traderToCopy.balance) ||
      100;

    setTimeout(async () => {
      try {
        await addCopiedTrader(traderToCopy, investmentAmount);
        toast.success(`Successfully started copying ${traderToCopy.name}`);
      } catch (error) {
        toast.error(error?.message || "Failed to copy trader.");
      } finally {
        setLoadingId(null);
      }
    }, 2000);
  };

  return (
    <div
      className={`px-4 py-14 min-h-screen ${
        theme === "dark"
          ? "bg-gradient-to-r from-gray-800 to-black text-white"
          : "bg-gradient-to-r from-gray-100 to-gray-300 text-gray-800"
      }`}
    >
      <input
        type="text"
        placeholder="Search traders..."
        className={`w-full p-3 mb-6 rounded-lg focus:ring-2 focus:outline-none ${
          theme === "dark"
            ? "bg-gray-700 text-white border-gray-600 focus:ring-teal-300"
            : "bg-white text-gray-800 border-gray-300 focus:ring-teal-500"
        } border`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {(userData?.balance == null || userData.balance <= 0) && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            theme === "dark"
              ? "bg-red-900/50 text-red-200"
              : "bg-red-100 text-red-800"
          }`}
        >
          <p>You need to deposit funds to start copying traders.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredTraders.map((trader) => (
          <TraderCard
            key={trader.id}
            trader={trader}
            theme={theme}
            onCopy={handleCopy}
            isCopying={loadingId === trader.id}
            isCopied={copiedTraders.some((t) => t.id === trader.id)}
            hasSufficientFunds={userData?.balance > 0}
            userBalance={userData?.balance || 0}
          />
        ))}
      </div>
    </div>
  );
}
