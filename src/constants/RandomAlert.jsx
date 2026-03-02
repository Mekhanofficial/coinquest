import { useState, useEffect } from "react";
import useSound from "use-sound";
import alert from "../../public/sound/alert.wav";

// Grouped by region/culture for better matching
const USERS = [
  // North America
  { name: "Jane Smith", country: "United States" },
  { name: "Michael Johnson", country: "United States" },
  { name: "Emily Williams", country: "Canada" },
  { name: "David Brown", country: "Canada" },
  { name: "Carlos Hernández", country: "Mexico" },
  { name: "María López", country: "Mexico" },

  // South America
  { name: "Ana Santos", country: "Brazil" },
  { name: "Carlos Silva", country: "Brazil" },
  { name: "Sofía García", country: "Argentina" },
  { name: "Lucas Torres", country: "Argentina" },
  { name: "Valentina Ríos", country: "Chile" },
  { name: "Mateo Fernández", country: "Colombia" },
  { name: "Camila Rodríguez", country: "Peru" },

  // Europe
  { name: "Emma Müller", country: "Germany" },
  { name: "Lucas Dubois", country: "France" },
  { name: "Isabella Rossi", country: "Italy" },
  { name: "Oliver Smith", country: "United Kingdom" },
  { name: "Sofia Novak", country: "Czech Republic" },
  { name: "Anna Kowalska", country: "Poland" },
  { name: "Marko Jovanović", country: "Serbia" },
  { name: "Katarina Horvat", country: "Croatia" },
  { name: "Nina Petrova", country: "Russia" },
  { name: "Johan Andersson", country: "Sweden" },
  { name: "Mikkel Hansen", country: "Denmark" },
  { name: "Elena García", country: "Spain" },
  { name: "Ioannis Papadopoulos", country: "Greece" },
  { name: "Álvaro Ortega", country: "Portugal" },
  { name: "Zoltán Tóth", country: "Hungary" },
  { name: "Radu Ionescu", country: "Romania" },
  { name: "Viktor Novak", country: "Slovakia" },
  { name: "Timo Nieminen", country: "Finland" },
  { name: "Andri Jónsson", country: "Iceland" },
  { name: "Jakub Marek", country: "Slovenia" },
  { name: "Anže Kranjc", country: "Slovenia" },

  // Africa
  { name: "Kwame Appiah", country: "Ghana" },
  { name: "Amina Nwokolo", country: "Nigeria" },
  { name: "Moussa Diop", country: "Senegal" },
  { name: "Fatoumata Keita", country: "Mali" },
  { name: "Lwazi Ndlovu", country: "South Africa" },
  { name: "Blessing Chikondi", country: "Malawi" },
  { name: "David Mugabe", country: "Uganda" },
  { name: "John Mwangi", country: "Kenya" },
  { name: "Zanele Dlamini", country: "Eswatini" },
  { name: "Said Ahmed", country: "Somalia" },
  { name: "Nour Ben Youssef", country: "Tunisia" },
  { name: "Rachid Bouzid", country: "Morocco" },
  { name: "Hassan Mbarek", country: "Algeria" },
  { name: "Mohamed Omar", country: "Egypt" },
  { name: "Samuel Banda", country: "Zambia" },

  // Asia
  { name: "Amit Patel", country: "India" },
  { name: "Mei Lin", country: "China" },
  { name: "Yuki Tanaka", country: "Japan" },
  { name: "Tariq Abubakar", country: "Pakistan" },
  { name: "Nguyen Thi Lan", country: "Vietnam" },
  { name: "Minh Tran", country: "Vietnam" },
  { name: "Nanda Kumar", country: "Sri Lanka" },
  { name: "Nurul Aisyah", country: "Indonesia" },
  { name: "Chan Myae", country: "Myanmar" },
  { name: "Choi Ji-Woo", country: "South Korea" },
  { name: "Ali Rahman", country: "Bangladesh" },
  { name: "Pema Deki", country: "Bhutan" },
  { name: "Sanjay Thapa", country: "Nepal" },
  { name: "Zarina Alimova", country: "Uzbekistan" },
  { name: "Tenzin Norbu", country: "Tibet" },
  { name: "Siti Nurhaliza", country: "Malaysia" },
  { name: "Phan Quang", country: "Laos" },

  // Middle East
  { name: "Omar Al-Fayed", country: "Saudi Arabia" },
  { name: "Layla Khoury", country: "Lebanon" },
  { name: "Yusuf Hassan", country: "UAE" },
  { name: "Ali Abbas", country: "Iraq" },
  { name: "Rania Khaled", country: "Jordan" },
  { name: "Fatima Al-Mansoori", country: "Qatar" },
  { name: "Mahmoud Nasser", country: "Palestine" },
  { name: "Sara Youssef", country: "Egypt" },

  // Oceania
  { name: "Liam Wilson", country: "Australia" },
  { name: "Olivia Brown", country: "New Zealand" },
  { name: "Eleni Vakalahi", country: "Fiji" },
  { name: "Tui Moana", country: "Samoa" },
  { name: "Malia Tupou", country: "Tonga" },
  { name: "Sione Katoa", country: "Papua New Guinea" },

  // Caribbean
  { name: "Dwayne Clarke", country: "Jamaica" },
  { name: "Keshia Grant", country: "Trinidad and Tobago" },
  { name: "Marvin Baptiste", country: "Barbados" },
  { name: "Althea Joseph", country: "Saint Lucia" },
  { name: "Rico Charles", country: "Grenada" },

  // Eastern Europe/Central Asia
  { name: "Illya Shevchenko", country: "Ukraine" },
  { name: "Tamara Ivanova", country: "Belarus" },
  { name: "Giorgi Lomidze", country: "Georgia" },
  { name: "Nargiza Ismailova", country: "Kyrgyzstan" },
  { name: "Ayan Bek", country: "Kazakhstan" },

  // Others
  { name: "Ali Mohamed", country: "Sudan" },
  { name: "Helen Tesfaye", country: "Ethiopia" },
  { name: "Jean Bosco", country: "Rwanda" },
  { name: "Claude Ndayishimiye", country: "Burundi" },
  { name: "Saida Mahamoud", country: "Djibouti" },
];

const ACTIONS = [
  // Trading signals
  {
    text: "purchased the [signal] trading signal",
    hasAmount: true,
    min: 1000,
    max: 15900,
  },
  { text: "subscribed to [plan] plan", hasAmount: true, min: 1000, max: 25000 },

  // Real estate investments
  {
    text: "invested in [property] real estate project",
    hasAmount: true,
    min: 12000,
    max: 33000,
  },

  // Staking
  {
    text: "staked [amount] in [crypto] pool",
    hasAmount: true,
    min: 1,
    max: 200,
  },
  {
    text: "earned [amount] from staking rewards",
    hasAmount: true,
    min: 0.1,
    max: 10,
  },

  // Account actions
  { text: "completed KYC verification", hasAmount: false },
  { text: "updated their profile photo", hasAmount: false },
  { text: "changed their password", hasAmount: false },

  // Financial actions
  { text: "deposited [amount]", hasAmount: true, min: 100, max: 50000 },
  { text: "withdrew [amount]", hasAmount: true, min: 50, max: 20000 },
  {
    text: "transferred [amount] to another user",
    hasAmount: true,
    min: 10,
    max: 5000,
  },

  // Referrals
  {
    text: "earned [amount] from referrals",
    hasAmount: true,
    min: 10,
    max: 500,
  },
  { text: "invited a friend to join", hasAmount: false },
];

const SIGNALS = [
  "Learn II Trade",
  "AVA TRADE",
  "RoboForex",
  "ZERO TO HERO",
  "1000 PIPS",
  "WeTalkTrade",
];
const PLANS = ["Elite", "Premium", "Platinum", "Standard"];
const PROPERTIES = [
  "Hilton Philadelphia City Avenue",
  "Fabian Labs, Palo Alto",
  "Go Store It Nashville",
  "The Mirage - Texas State Student Housing",
  "Palmetto Industrial Park",
  "Bridge Labs at Pegasus Park",
];
const CRYPTOS = [
  "BTC",
  "ETH",
  "ADA",
  "SOL",
  "DOT",
  "AVAX",
  "LINK",
  "LTC",
  "XRP",
];

const INITIAL_DELAY = 3000; // Wait 3s before starting (reduced from 12s)
const DISPLAY_DURATION = 7000; // Show each user for 7s (reduced from 10s)
const TRANSITION_DURATION = 1000; // Fade-in/out takes 1s (reduced from 2s)

const formatAmount = (min, max, isCrypto = false) => {
  const amount = Math.random() * (max - min) + min;

  if (isCrypto) {
    // For crypto amounts, show 2-8 decimal places
    const decimals = Math.floor(Math.random() * 7) + 2;
    return amount.toFixed(decimals);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: amount < 1 ? 2 : 0,
  }).format(amount);
};

const RandomAlert = () => {
  const [currentAlert, setCurrentAlert] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [playSound] = useSound(alert, {
    volume: 0.2, // Increased volume slightly
    interrupt: true,
  });

  // Handle user interaction to enable sound
  useEffect(() => {
    const handleInteraction = () => {
      setHasUserInteracted(true);
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };

    window.addEventListener("click", handleInteraction);
    window.addEventListener("keydown", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, []);

  const generateRandomAlert = () => {
    const randomUser = USERS[Math.floor(Math.random() * USERS.length)];
    const randomAction = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    let actionText = randomAction.text;
    if (randomAction.hasAmount) {
      const isCrypto =
        actionText.includes("pool") || actionText.includes("staking");
      const amount = formatAmount(randomAction.min, randomAction.max, isCrypto);
      actionText = actionText.replace("[amount]", amount);
    }

    // Replace other placeholders
    if (actionText.includes("[signal]")) {
      actionText = actionText.replace(
        "[signal]",
        SIGNALS[Math.floor(Math.random() * SIGNALS.length)]
      );
    }
    if (actionText.includes("[plan]")) {
      actionText = actionText.replace(
        "[plan]",
        PLANS[Math.floor(Math.random() * PLANS.length)]
      );
    }
    if (actionText.includes("[property]")) {
      actionText = actionText.replace(
        "[property]",
        PROPERTIES[Math.floor(Math.random() * PROPERTIES.length)]
      );
    }
    if (actionText.includes("[crypto]")) {
      actionText = actionText.replace(
        "[crypto]",
        CRYPTOS[Math.floor(Math.random() * CRYPTOS.length)]
      );
    }

    return {
      id: Math.random().toString(36).substring(2, 9),
      name: randomUser.name,
      country: randomUser.country,
      action: actionText,
      time,
    };
  };

  useEffect(() => {
    let initialDelayTimer;
    let hideTimeout;
    let transitionTimer;

    const showNewAlert = () => {
      const newAlert = generateRandomAlert();
      setCurrentAlert(newAlert);
      setIsVisible(true);

      if (hasUserInteracted) {
        try {
          playSound();
        } catch (error) {
          console.error("Error playing sound:", error);
        }
      }

      hideTimeout = setTimeout(() => {
        setIsVisible(false);

        transitionTimer = setTimeout(() => {
          showNewAlert();
        }, TRANSITION_DURATION);
      }, DISPLAY_DURATION);
    };

    initialDelayTimer = setTimeout(showNewAlert, INITIAL_DELAY);

    return () => {
      clearTimeout(initialDelayTimer);
      clearTimeout(hideTimeout);
      clearTimeout(transitionTimer);
    };
  }, [hasUserInteracted, playSound]); // Added playSound to dependencies

  return (
    <div className="fixed left-4 bottom-4 z-50 w-72">
      <div
        className={`transition-all duration-300 ease-in-out ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        {currentAlert && (
          <div className="bg-slate-800 rounded-lg shadow-xl border-l-4 border-teal-500 overflow-hidden">
            <div className="p-3">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-teal-900 flex items-center justify-center text-teal-300 font-bold">
                  {currentAlert.name.charAt(0)}
                </div>
                <div className="ml-2">
                  <p className="text-xs font-medium text-slate-100">
                    {currentAlert.name}{" "}
                    <span className="text-xs text-slate-400">
                      ({currentAlert.country})
                    </span>
                  </p>
                  <p className="text-xs text-teal-300">{currentAlert.action}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {currentAlert.time}
                  </p>
                </div>
              </div>
            </div>
            <div
              className="h-0.5 w-full bg-teal-500 animate-progress"
              style={{ animationDuration: `${DISPLAY_DURATION}ms` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RandomAlert;
