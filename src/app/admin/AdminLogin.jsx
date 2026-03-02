import { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authCode, setAuthCode] = useState(""); // New state for auth code
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const validAuthCode = import.meta.env.VITE_ADMIN_AUTH_CODE;
 const navigate = useNavigate();
  const { loginUser, logoutUser } = useUser();

  const loginAdmin = async () => {
    if (!email || !password || !authCode) {
      toast.error("All fields are required.");
      return;
    }

    if (authCode !== validAuthCode) {
      toast.error("Invalid authorization code.");
      return;
    }

    setIsLoginLoading(true);
    try {
      const user = await loginUser(email, password);
      if (user?.role !== "admin") {
        await logoutUser();
        setIsAdmin(false);
        toast.error("You do not have admin access.");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoginLoading(false);
    }
  };

  if (isAdmin) {
    toast.success("Welcome Admin we have been waiting..!")
    navigate("/AdminDashboard")
  }

  return (
    <div className="fixed top-0 left-0 h-full w-screen grid content-center bg-[#1c1f2d] z-10 p-10">
      <div className="w-full max-w-sm mx-auto text-white">
        <input
          type="text"
          placeholder="Authorization Code"
          value={authCode}
          onChange={(e) => setAuthCode(e.target.value)}
          className="p-2 mb-4 w-full rounded bg-gray-800"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-2 mb-4 w-full rounded bg-gray-800"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 mb-4 w-full rounded bg-gray-800"
        />

        {errorMessage && (
          <p className="text-red-400 mt-2 text-sm">{errorMessage}</p>
        )}

        <button
          onClick={loginAdmin}
          className={`text-white bg-[#f42f54] py-3 px-10 rounded-md w-full mt-6 ${
            isLoginLoading ? "opacity-60 cursor-not-allowed" : ""
          }`}
          disabled={isLoginLoading}
        >
          {isLoginLoading ? (
            <span className="block w-5 h-5 border-2 border-white border-l-transparent border-b-transparent rounded-full animate-spin mx-auto"></span>
          ) : (
            "Login"
          )}
        </button>
         <p>Do not have an Account?<Link to="/AdminSignup">Signup</Link></p>
      </div>
    </div>
  );
};

export default AdminLogin;
