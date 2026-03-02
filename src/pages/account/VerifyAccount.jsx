import { useTheme } from "next-themes";
import { useState } from "react";
import { FiUpload, FiUserCheck, FiChevronDown } from "react-icons/fi";

export default function VerifyAccountPage() {
  const { theme } = useTheme();
  const [selectedIdType, setSelectedIdType] = useState("passport");
  const [frontIdPreview, setFrontIdPreview] = useState(null);
  const [backIdPreview, setBackIdPreview] = useState(null);

  const handleFileChange = (e, setPreview) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 py-14 ${
        isDark
          ? "bg-gradient-to-br from-slate-900 to-slate-800"
          : "bg-gradient-to-br from-gray-50 to-gray-100"
      }`}
    >
      <section
        className={`w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-xl transition-all duration-300 ${
          isDark
            ? "bg-slate-800 text-slate-100 shadow-teal-900/30"
            : "bg-white text-gray-800 shadow-teal-400/20"
        }`}
      >
        <div
          className={`p-6 text-center ${
            isDark ? "bg-slate-900/50" : "bg-teal-50"
          }`}
        >
          <div className="flex justify-center mb-4">
            <div
              className={`flex items-center justify-center w-16 h-16 rounded-full ${
                isDark ? "bg-teal-900/30" : "bg-teal-100"
              }`}
            >
              <FiUserCheck
                className={`w-8 h-8 ${
                  isDark ? "text-teal-400" : "text-teal-600"
                }`}
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent">
            Account Verification
          </h1>
          <p
            className={`mt-2 text-sm ${
              isDark ? "text-slate-400" : "text-gray-600"
            }`}
          >
            Complete your verification by uploading valid identification
            documents
          </p>
        </div>

        <div className="p-6 pt-4">
          <form className="space-y-6">
            {/* ID Type Selector */}
            <div>
              <label
                className={`block mb-2 font-medium ${
                  isDark ? "text-slate-300" : "text-gray-700"
                }`}
              >
                ID Type
              </label>
              <div className="relative">
                <select
                  value={selectedIdType}
                  onChange={(e) => setSelectedIdType(e.target.value)}
                  className={`appearance-none w-full pl-4 pr-10 py-3 rounded-xl border ${
                    isDark
                      ? "bg-slate-700 border-slate-600 focus:border-teal-500"
                      : "bg-gray-50 border-gray-200 focus:border-teal-400"
                  } focus:ring-2 focus:ring-teal-500/30 transition-all`}
                >
                  <option value="passport">Passport</option>
                  <option value="national-id">National ID</option>
                  <option value="driver-license">Driver's License</option>
                  <option value="social-security">Social Security Card</option>
                  <option value="voters-card">Voter's Card</option>
                </select>
                <FiChevronDown
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                    isDark ? "text-slate-400" : "text-gray-500"
                  }`}
                />
              </div>
            </div>

            {/* Front ID Upload */}
            <div>
              <label
                className={`block mb-2 font-medium ${
                  isDark ? "text-slate-300" : "text-gray-700"
                }`}
              >
                Front ID
              </label>
              <label
                htmlFor="frontId"
                className={`flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  frontIdPreview
                    ? "border-transparent"
                    : isDark
                    ? "border-slate-600 hover:border-teal-500"
                    : "border-gray-300 hover:border-teal-400"
                } overflow-hidden`}
              >
                {frontIdPreview ? (
                  <img
                    src={frontIdPreview}
                    alt="Front ID preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <FiUpload
                      className={`w-8 h-8 mb-2 ${
                        isDark ? "text-slate-400" : "text-gray-400"
                      }`}
                    />
                    <p
                      className={`text-sm ${
                        isDark ? "text-slate-400" : "text-gray-500"
                      }`}
                    >
                      Click to upload front side
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        isDark ? "text-slate-500" : "text-gray-400"
                      }`}
                    >
                      JPG, PNG or PDF (Max 5MB)
                    </p>
                  </div>
                )}
              </label>
              <input
                id="frontId"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, setFrontIdPreview)}
              />
            </div>

            {/* Back ID Upload */}
            <div>
              <label
                className={`block mb-2 font-medium ${
                  isDark ? "text-slate-300" : "text-gray-700"
                }`}
              >
                Back ID
              </label>
              <label
                htmlFor="backId"
                className={`flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  backIdPreview
                    ? "border-transparent"
                    : isDark
                    ? "border-slate-600 hover:border-teal-500"
                    : "border-gray-300 hover:border-teal-400"
                } overflow-hidden`}
              >
                {backIdPreview ? (
                  <img
                    src={backIdPreview}
                    alt="Back ID preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <FiUpload
                      className={`w-8 h-8 mb-2 ${
                        isDark ? "text-slate-400" : "text-gray-400"
                      }`}
                    />
                    <p
                      className={`text-sm ${
                        isDark ? "text-slate-400" : "text-gray-500"
                      }`}
                    >
                      Click to upload back side
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        isDark ? "text-slate-500" : "text-gray-400"
                      }`}
                    >
                      JPG, PNG or PDF (Max 5MB)
                    </p>
                  </div>
                )}
              </label>
              <input
                id="backId"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, setBackIdPreview)}
              />
            </div>

            <button
              type="button"
              className={`w-full py-4 px-6 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] ${
                isDark
                  ? "bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-500 hover:to-cyan-600"
                  : "bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500"
              } text-white shadow-lg hover:shadow-xl`}
            >
              Submit Verification Request
            </button>
          </form>

          <p
            className={`text-center mt-6 text-xs ${
              isDark ? "text-slate-500" : "text-gray-500"
            }`}
          >
            Verification usually takes 1-2 business days. We'll notify you via
            email.
          </p>
        </div>
      </section>
    </div>
  );
}
