import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { API_BASE_URL } from "../../config/api";

const getToken = () =>
  (localStorage.getItem("authToken") || "").replace(/^["']|["']$/g, "").trim();

const formatTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
};

const statusStyle = (status = "") => {
  const normalized = `${status}`.toLowerCase();
  if (normalized === "verified") return "bg-emerald-500/15 text-emerald-500";
  if (normalized === "rejected") return "bg-rose-500/15 text-rose-500";
  return "bg-amber-500/15 text-amber-500";
};

export default function KYCReviewPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [isUpdating, setIsUpdating] = useState("");
  const [lastSyncAt, setLastSyncAt] = useState(0);
  const [showProcessed, setShowProcessed] = useState(true);

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const token = getToken();
      if (!token) throw new Error("Missing admin token");

      const response = await fetch(`${API_BASE_URL}/Admin/Kyc`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || `KYC fetch failed (${response.status})`);
      }
      setSubmissions(result.data || []);
      setLastSyncAt(Date.now());
    } catch (error) {
      console.error("Failed to load KYC submissions", error);
      setLoadError(error?.message || "Unable to sync KYC submissions.");
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
    const intervalId = setInterval(fetchSubmissions, 15000);
    return () => clearInterval(intervalId);
  }, [fetchSubmissions]);

  const updateKycStatus = async (userId, nextStatus) => {
    if (!userId) return;
    setIsUpdating(userId);
    try {
      const token = getToken();
      if (!token) throw new Error("Missing admin token");

      const response = await fetch(`${API_BASE_URL}/Admin/UpdateKycStatus`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ userId, status: nextStatus }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || `Update failed (${response.status})`);
      }

      setSubmissions((prev) =>
        prev.map((row) =>
          row.userId === userId
            ? {
                ...row,
                status: nextStatus,
              }
            : row
        )
      );
    } catch (error) {
      console.error("Failed to update KYC status", error);
      setLoadError(error?.message || "Unable to update KYC status.");
    } finally {
      setIsUpdating("");
    }
  };

  const pendingRows = useMemo(
    () => submissions.filter((item) => `${item.status || ""}`.toLowerCase() === "pending"),
    [submissions]
  );

  const processedRows = useMemo(
    () => submissions.filter((item) => `${item.status || ""}`.toLowerCase() !== "pending"),
    [submissions]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">KYC Review Queue</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSubmissions}
            disabled={isLoading}
            className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-500"
          >
            {isLoading ? "Syncing..." : "Refresh"}
          </button>
          <span className="text-[11px] text-slate-500">
            Sync {lastSyncAt ? formatTime(lastSyncAt) : "starting..."}
          </span>
        </div>
      </div>

      {loadError && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {loadError}
        </div>
      )}

      <section
        className={`rounded-xl border p-3 ${
          isDark ? "border-slate-700 bg-slate-950/50" : "border-slate-200 bg-slate-50"
        }`}
      >
        <div className="mb-3 flex items-center justify-between">
          <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Pending ({pendingRows.length})
          </h5>
          <p className="text-[11px] text-slate-500">
            Verified users are moved to Completed automatically.
          </p>
        </div>

        {pendingRows.length === 0 ? (
          <p className="text-xs text-slate-500">No pending KYC submissions.</p>
        ) : (
          <div className="space-y-3">
            {pendingRows.map((submission) => (
              <div
                key={submission.id}
                className={`rounded-lg border p-3 ${
                  isDark ? "border-slate-700 bg-slate-900/70" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{submission.name || "N/A"}</p>
                    <p className="text-xs text-slate-500">{submission.email || "N/A"}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle(submission.status)}`}>
                    {`${submission.status || "pending"}`.toUpperCase()}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  {submission.governmentId && (
                    <a
                      href={submission.governmentId}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-500 underline"
                    >
                      Government ID
                    </a>
                  )}
                  {submission.selfie && (
                    <a
                      href={submission.selfie}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-500 underline"
                    >
                      Selfie
                    </a>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => updateKycStatus(submission.userId, "verified")}
                    disabled={isUpdating === submission.userId}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                  >
                    {isUpdating === submission.userId ? "Updating..." : "Mark Completed"}
                  </button>
                  <button
                    onClick={() => updateKycStatus(submission.userId, "rejected")}
                    disabled={isUpdating === submission.userId}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section
        className={`rounded-xl border p-3 ${
          isDark ? "border-slate-700 bg-slate-950/50" : "border-slate-200 bg-slate-50"
        }`}
      >
        <button
          onClick={() => setShowProcessed((prev) => !prev)}
          className="flex w-full items-center justify-between text-left"
        >
          <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Processed ({processedRows.length})
          </h5>
          <span className="text-xs text-slate-500">{showProcessed ? "Hide" : "Show"}</span>
        </button>

        {showProcessed && (
          <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {processedRows.length === 0 ? (
              <p className="text-xs text-slate-500">No completed/rejected KYC records.</p>
            ) : (
              processedRows.map((submission) => (
                <div
                  key={submission.id}
                  className={`rounded-lg border px-3 py-2 ${
                    isDark ? "border-slate-700 bg-slate-900/60" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold">{submission.email || "Unknown user"}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle(submission.status)}`}>
                      {`${submission.status || ""}`.toLowerCase() === "verified"
                        ? "COMPLETED"
                        : `${submission.status || "REJECTED"}`.toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Submitted: {formatTime(submission.submittedAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}
