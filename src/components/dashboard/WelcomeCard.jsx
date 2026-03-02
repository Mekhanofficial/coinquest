import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBitcoin } from "@fortawesome/free-brands-svg-icons";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";

export default function WelcomeCard({
  theme,
  borderColor,
  secondaryText,
}) {
  const { userData, isLoading } = useUser();
  
  if (isLoading) {
    return (
      <div className={`bg-gradient-to-r ${
        theme === "dark" ? "from-teal-700 to-teal-950" : "from-teal-500 to-teal-700"
      } border-2 ${borderColor} rounded-lg p-4 lg:p-6 mb-6 shadow-lg hidden lg:block`}>
        <div className="animate-pulse">
          <div className="h-6 bg-teal-400 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-teal-300 rounded w-full mb-4"></div>
          <div className="h-10 bg-teal-400 rounded w-32"></div>
        </div>
      </div>
    );
  }

  // Better username detection
  const getUserName = () => {
    if (!userData) return 'User';
    
    // Try different possible name fields
    const name = userData.firstName || 
                 userData.name || 
                 userData.displayName || 
                 userData.email?.split('@')[0] || 
                 'User';
    
    console.log("User data for welcome card:", userData);
    console.log("Derived username:", name);
    
    return name;
  };

  const userName = getUserName();
  
  return (
    <div
      className={`bg-gradient-to-r ${
        theme === "dark"
          ? "from-teal-700 to-teal-950"
          : "from-teal-500 to-teal-700"
      } border-2 ${borderColor} rounded-lg p-4 lg:p-6 mb-6 shadow-lg hover:shadow-xl transition-shadow duration-300 hidden lg:block`}
    >
      <h1 className="text-xl lg:text-2xl font-bold mb-2 text-white">
        Welcome{" "}
        <span className="truncate max-w-[180px] inline-block align-bottom text-teal-200">
          {userName}
        </span>{" "}
        to coinquest!
      </h1>
      <p className={`text-sm lg:text-base ${secondaryText} mb-4 text-teal-100`}>
        Your gateway to the exciting world of cryptocurrency trading.
      </p>
      <div className="flex items-center justify-between">
        <button
          className={`${
            theme === "dark"
              ? "bg-gray-300 hover:bg-teal-600 hover:text-black text-teal-600"
              : "bg-white hover:bg-teal-600 text-teal-700"
          } px-4 py-2 rounded-full flex items-center gap-2 transition duration-300 text-sm lg:text-base`}
        >
          <Link to="/Assets">
            <FontAwesomeIcon icon={faBitcoin} /> Crypto Update
          </Link>
        </button>
      </div>
    </div>
  );
}