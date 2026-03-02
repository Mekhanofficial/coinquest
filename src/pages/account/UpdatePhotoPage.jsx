import { useState, useEffect } from "react";
import {
  FaUser,
  FaCheck,
  FaUpload,
  FaArrowLeft,
  FaSpinner,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";

const defaultAvatars = [
  "https://cdn.pixabay.com/photo/2018/01/18/07/31/bitcoin-3089728_640.jpg",
  "https://cdn.pixabay.com/photo/2022/05/10/15/08/bitcoin-7187347_640.png",
  "https://cdn.pixabay.com/photo/2017/08/14/14/38/bitcoin-2640692_640.png",
  "https://cdn.pixabay.com/photo/2021/05/24/09/15/ethereum-logo-6278329_640.png",
  "https://cdn.pixabay.com/photo/2018/01/15/07/51/woman-3083379_640.jpg",
  "https://cdn.pixabay.com/photo/2016/11/21/12/42/beard-1845166_640.jpg",
];

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

function UpdatePhotoPage() {
  const navigate = useNavigate();
  const { userData, updateUserProfile, saveUserProfile } = useUser();
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [customImageDataUrl, setCustomImageDataUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState(userData?.photoURL || "");
  const [firstName, setFirstName] = useState(userData?.firstName || "");
  const [lastName, setLastName] = useState(userData?.lastName || "");
  const [phoneNumber, setPhoneNumber] = useState(userData?.phoneNumber || "");
  const [country, setCountry] = useState(userData?.country || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (userData?.photoURL) {
      setPreviewUrl(userData.photoURL);
    }
    setFirstName(userData?.firstName || "");
    setLastName(userData?.lastName || "");
    setPhoneNumber(userData?.phoneNumber || "");
    setCountry(userData?.country || "");
  }, [userData]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select a valid image file (JPEG, PNG, etc.)");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setMessage("Image size should be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCustomImageDataUrl(reader.result);
      setSelectedAvatar("");
      setPreviewUrl(reader.result);
      setMessage("");
    };
    reader.onerror = () => {
      setMessage("Unable to read the selected file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarSelect = (avatarUrl) => {
    setSelectedAvatar(avatarUrl);
    setCustomImageDataUrl("");
    setPreviewUrl(avatarUrl);
    setMessage("");
  };

  const handleSave = async () => {
    if (loading) return;
    if (!userData) {
      setMessage("Your profile is still loading. Please wait a moment.");
      return;
    }

    const photoURL =
      customImageDataUrl || selectedAvatar || userData.photoURL || "";

    setLoading(true);
    setMessage("");

    try {
      const updates = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        country: country.trim(),
        photoURL,
      };

      const persisted = updateUserProfile(updates);
      if (!persisted) {
        setMessage(
          "Saved locally but unable to persist in storage. Try a smaller image or enable browser storage."
        );
      }

      await saveUserProfile?.(updates);
      setPreviewUrl(photoURL);
      setIsSuccess(true);
      setMessage("Profile updated successfully!");
      setTimeout(() => {
        navigate("/Account");
      }, 2000);
    } catch (error) {
      console.error("Profile update failed", error);
      setMessage(error.message || "Unable to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-10 bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-emerald-700 p-6 relative">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
          >
            <FaArrowLeft className="text-white text-lg" />
          </button>
          <div className="flex justify-center">
            <div className="bg-white/20 p-4 rounded-full">
              <FaUser className="text-white text-2xl" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white text-center mt-4">
            {isSuccess ? "Photo Updated!" : "Update Profile Photo"}
          </h1>
        </div>

        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaCheck className="text-green-400 text-3xl" />
              </div>
              <p className="text-lg font-medium text-white">
                Your profile photo has been updated successfully!
              </p>
              <p className="text-slate-400 mt-2">
                You'll be redirected back to your account shortly.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">
                      First Name
                    </label>
                    <input
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      className="w-full rounded-lg bg-slate-700/60 border border-slate-600 px-4 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">
                      Last Name
                    </label>
                    <input
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      className="w-full rounded-lg bg-slate-700/60 border border-slate-600 px-4 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      className="w-full rounded-lg bg-slate-700/60 border border-slate-600 px-4 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">
                      Country
                    </label>
                    <input
                      value={country}
                      onChange={(event) => setCountry(event.target.value)}
                      className="w-full rounded-lg bg-slate-700/60 border border-slate-600 px-4 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-center mb-8">
                <div className="relative">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-40 h-40 rounded-full border-4 border-teal-500 shadow-xl object-cover"
                    />
                  ) : (
                    <div className="w-40 h-40 rounded-full border-4 border-slate-700 bg-slate-700 flex items-center justify-center">
                      <FaUser className="text-slate-500 text-5xl" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 text-center text-slate-300">
                  Choose a default avatar
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {defaultAvatars.map((src, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAvatarSelect(src)}
                      className={`relative rounded-full overflow-hidden transition-all transform hover:scale-105 ${
                        selectedAvatar === src ? "ring-4 ring-teal-500" : ""
                      }`}
                    >
                      <img
                        src={src}
                        alt={`Avatar ${idx + 1}`}
                        className="w-full h-full object-cover aspect-square"
                      />
                      {selectedAvatar === src && (
                        <div className="absolute inset-0 bg-teal-500/30 flex items-center justify-center">
                          <FaCheck className="text-white text-xl" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 text-center text-slate-300">
                  Or upload your own
                </h2>
                <div className="flex justify-center">
                  <label className="flex flex-col items-center justify-center w-full max-w-xs cursor-pointer">
                    <div className="bg-slate-700/50 hover:bg-slate-700 border-2 border-dashed border-slate-600 rounded-xl p-6 text-center transition-colors w-full">
                      <div className="flex flex-col items-center">
                        <div className="bg-teal-600/20 p-3 rounded-full mb-3">
                          <FaUpload className="text-teal-400 text-xl" />
                        </div>
                        <p className="font-medium">Upload an image</p>
                        <p className="text-sm text-slate-400 mt-1">
                          JPG, PNG (max 2MB)
                        </p>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={loading}
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className={`px-8 py-3 rounded-lg font-medium text-white shadow-lg transition-all ${
                    loading
                      ? "bg-teal-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 hover:shadow-xl transform hover:-translate-y-0.5"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <FaSpinner className="animate-spin mr-2" />
                      Saving...
                    </div>
                  ) : (
                    "Save Profile Photo"
                  )}
                </button>
              </div>

              {message && (
                <p
                  className={`text-center mt-4 p-3 rounded-lg ${
                    message.includes("Error") || message.includes("Please")
                      ? "bg-red-900/30 text-red-400"
                      : "bg-teal-900/30 text-teal-400"
                  }`}
                >
                  {message}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-8 text-center text-slate-500 text-sm">
        <p>Your profile photo is visible to other users</p>
      </div>
    </div>
  );
}

export default UpdatePhotoPage;
