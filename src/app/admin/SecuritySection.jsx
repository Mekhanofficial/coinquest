import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { API_BASE_URL } from "../../config/api";
import KYCReviewPage from "./kyc-review";

const getToken = () =>
  (localStorage.getItem("authToken") || "").replace(/^["']|["']$/g, "").trim();

export default function SecuritySection() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isLoading, setIsLoading] = useState(false);
  const [kycRows, setKycRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadError, setLoadError] = useState("");

  const loadSecurityData = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const token = getToken();
      if (!token) throw new Error("Missing admin token");

      const [kycResponse, usersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/Admin/Kyc`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        }),
        fetch(`${API_BASE_URL}/Admin/Users`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        }),
      ]);

      const [kycResult, usersResult] = await Promise.all([
        kycResponse.json(),
        usersResponse.json(),
      ]);

      if (!kycResponse.ok || !kycResult?.success) {
        throw new Error(kycResult?.message || `KYC fetch failed (${kycResponse.status})`);
      }

      if (!usersResponse.ok || !usersResult?.success) {
        throw new Error(
          usersResult?.message || `Users fetch failed (${usersResponse.status})`
        );
      }

      setKycRows(kycResult?.data || []);
      setUsers(usersResult?.data || []);
    } catch (error) {
      console.error("Security data load failed:", error);
      setLoadError(error?.message || "Unable to load security data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSecurityData();
    const intervalId = setInterval(loadSecurityData, 30000);
    return () => clearInterval(intervalId);
  }, [loadSecurityData]);

  const stats = useMemo(() => {
    const pendingKyc = kycRows.filter((item) => item.status === "pending").length;
    const verifiedKyc = kycRows.filter((item) => item.status === "verified").length;
    const rejectedKyc = kycRows.filter((item) => item.status === "rejected").length;
    const suspendedUsers = users.filter((item) => item.status === "suspended").length;
    return {
      pendingKyc,
      verifiedKyc,
      rejectedKyc,
      suspendedUsers,
    };
  }, [kycRows, users]);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className={`rounded-2xl border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Security & Compliance</h3>
            <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Real-time KYC, suspended users, and verification monitoring.
            </p>
          </div>
          <button
            onClick={loadSecurityData}
            className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-500"
            disabled={isLoading}
          >
            {isLoading ? "Syncing..." : "Refresh"}
          </button>
        </div>
      </div>

      {loadError && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className={`rounded-xl border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <p className="text-xs text-slate-500">Pending KYC</p>
          <p className="mt-2 text-2xl font-semibold text-amber-500">{stats.pendingKyc}</p>
        </div>
        <div className={`rounded-xl border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <p className="text-xs text-slate-500">Completed KYC</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-500">{stats.verifiedKyc}</p>
        </div>
        <div className={`rounded-xl border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <p className="text-xs text-slate-500">Rejected KYC</p>
          <p className="mt-2 text-2xl font-semibold text-rose-500">{stats.rejectedKyc}</p>
        </div>
        <div className={`rounded-xl border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <p className="text-xs text-slate-500">Suspended Users</p>
          <p className="mt-2 text-2xl font-semibold text-violet-500">{stats.suspendedUsers}</p>
        </div>
      </div>

      <div className={`rounded-2xl border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
        <KYCReviewPage />
      </div>
    </div>
  );
}
