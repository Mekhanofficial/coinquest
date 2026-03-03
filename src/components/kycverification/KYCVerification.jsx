import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { API_BASE_URL } from "../../config/api";

export default function KycVerification() {
  const navigate = useNavigate();
  const { userData, isAuthenticated, getAuthToken, refreshKYCStatus } = useUser();
  const [idFile, setIdFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const idInputRef = useRef(null);
  const selfieInputRef = useRef(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token || !isAuthenticated) {
      setError("You must be logged in to submit KYC. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    }
  }, [isAuthenticated, navigate, getAuthToken]);

  const handleFileChange = (e, setter) => {
    const file = e.target.files[0];
    setSuccess("");
    setError("");

    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Only JPEG and PNG image files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size should be less than 5MB.");
      return;
    }

    setter(file);
  };

  // Method 1: Convert to base64 with data URL prefix
  const convertToBase64WithPrefix = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result); // Keep the full data URL
      reader.onerror = error => reject(error);
    });
  };

  // Method 2: Convert to base64 without prefix (raw base64)
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Method 3: Try sending as FormData instead of JSON
  const submitAsFormData = async (token, idFile, selfieFile) => {
    const formData = new FormData();
    formData.append("GovernmentIssuedId", idFile);
    formData.append("SelfieWithId", selfieFile);
    formData.append("UserId", userData?.uid || userData?.id);
    formData.append("Email", userData?.email);

    const response = await fetch(`${API_BASE_URL}/Kyc/Submit?t=${Date.now()}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        // Don't set Content-Type - let browser set it with boundary
      },
      body: formData,
      cache: 'no-cache'
    });

    return response;
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    const token = getAuthToken();
    
    if (!token || !isAuthenticated) {
      setError("You must be logged in to submit KYC.");
      return;
    }
    
    if (!idFile || !selfieFile) {
      setError("Please upload both your government ID and a selfie.");
      return;
    }

    setLoading(true);

    try {
      let response;
      
      // Try Method 1: FormData approach first (most common for file uploads)
      console.log("Trying FormData approach...");
      response = await submitAsFormData(token, idFile, selfieFile);

      // If FormData fails with 415 (Unsupported Media Type), try JSON approaches
      if (response.status === 415 || !response.ok) {
        console.log("FormData failed, trying JSON approaches...");
        
        // Try Method 2: Base64 with data URL prefix
        console.log("Trying base64 with data URL prefix...");
        const [idWithPrefix, selfieWithPrefix] = await Promise.all([
          convertToBase64WithPrefix(idFile),
          convertToBase64WithPrefix(selfieFile)
        ]);

        const kycDataWithPrefix = {
          GovernmentIssuedId: idWithPrefix,
          SelfieWithId: selfieWithPrefix,
          UserId: userData?.uid || userData?.id,
          Email: userData?.email
        };

        response = await fetch(`${API_BASE_URL}/Kyc/Submit?t=${Date.now()}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache"
          },
          body: JSON.stringify(kycDataWithPrefix),
          cache: 'no-cache'
        });

        // If that fails, try Method 3: Raw base64 without prefix
        if (!response.ok) {
          console.log("Prefix approach failed, trying raw base64...");
          const [idRaw, selfieRaw] = await Promise.all([
            convertToBase64(idFile),
            convertToBase64(selfieFile)
          ]);

          const kycDataRaw = {
            GovernmentIssuedId: idRaw,
            SelfieWithId: selfieRaw,
            UserId: userData?.uid || userData?.id,
            Email: userData?.email
          };

          response = await fetch(`${API_BASE_URL}/Kyc/Submit?t=${Date.now()}`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Pragma": "no-cache"
            },
            body: JSON.stringify(kycDataRaw),
            cache: 'no-cache'
          });
        }
      }

      console.log("Final response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("All KYC submission methods failed:", errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.errors) {
            const errorMessages = Object.entries(errorJson.errors)
              .map(([field, messages]) => `${field}: ${messages[0]}`)
              .join(', ');
            throw new Error(errorMessages);
          }
          throw new Error(errorJson.title || errorJson.message || "Validation failed");
        // eslint-disable-next-line no-unused-vars
        } catch (parseError) {
          throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }
      }

      const result = await response.json();
      console.log("KYC submission successful:", result);

      localStorage.setItem("kycLastSubmitted", new Date().toISOString());
      
      // 🔥 CRITICAL: Refresh KYC status immediately after successful submission
      console.log("🔄 Refreshing KYC status from server...");
      await refreshKYCStatus();
      
      setSuccess("✅ KYC documents submitted successfully! All features are now unlocked!");
      setIdFile(null);
      setSelfieFile(null);

      setTimeout(() => navigate("/dashboard"), 2000);
      
    } catch (uploadError) {
      console.error("KYC submission error:", uploadError);
      
      if (uploadError.message.includes("401") || uploadError.message.includes("unauthorized")) {
        setError("❌ Session expired. Please log in again.");
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setError("❌ Failed to submit KYC: " + uploadError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Checking authentication...</p>
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                <p className="text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Submit KYC Documents
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Verify your identity to access all features
          </p>
          <div className="mt-2 text-sm text-slate-500 dark:text-slate-500">
            Logged in as: {userData?.email}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
            <p className="text-red-700 dark:text-red-400 text-center">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
            <p className="text-green-700 dark:text-green-400 text-center">
              {success}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Government ID Card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-slate-700 dark:text-slate-300">
                Government-issued ID
              </h3>
              <span className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
                Required
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Upload a clear photo of your government-issued ID
            </p>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => idInputRef.current.click()}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-70"
                disabled={loading}
              >
                Choose File
              </button>
              <div className="flex-1 text-left">
                <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                  {idFile ? idFile.name : "No file chosen"}
                </p>
              </div>
            </div>

            <input
              type="file"
              ref={idInputRef}
              accept="image/jpeg,image/png"
              onChange={(e) => handleFileChange(e, setIdFile)}
              disabled={loading}
              className="hidden"
            />

            {idFile && (
              <div className="mt-4 flex justify-center">
                <img
                  src={URL.createObjectURL(idFile)}
                  alt="Preview ID"
                  className="w-32 h-32 object-cover rounded-lg border-2 border-slate-300"
                />
              </div>
            )}
          </div>

          {/* Selfie with ID */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-slate-700 dark:text-slate-300">
                Selfie with ID
              </h3>
              <span className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
                Required
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Upload a selfie of yourself holding the same ID
            </p>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => selfieInputRef.current.click()}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-70"
                disabled={loading}
              >
                Choose File
              </button>
              <div className="flex-1 text-left">
                <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                  {selfieFile ? selfieFile.name : "No file chosen"}
                </p>
              </div>
            </div>

            <input
              type="file"
              ref={selfieInputRef}
              accept="image/jpeg,image/png"
              onChange={(e) => handleFileChange(e, setSelfieFile)}
              disabled={loading}
              className="hidden"
            />

            {selfieFile && (
              <div className="mt-4 flex justify-center">
                <img
                  src={URL.createObjectURL(selfieFile)}
                  alt="Preview Selfie"
                  className="w-32 h-32 object-cover rounded-lg border-2 border-slate-300"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !idFile || !selfieFile}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-70"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </div>
            ) : (
              "Submit KYC"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
