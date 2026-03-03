import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";
import { useUser } from "../../context/UserContext";

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
};

const formatRelative = (value) => {
  if (!value) return "";
  const date = new Date(value).getTime();
  if (!Number.isFinite(date)) return "";
  const seconds = Math.max(1, Math.floor((Date.now() - date) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const STATUS_STYLES = {
  open: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  resolved: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  closed: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
};

export default function MessagesPage() {
  const { theme } = useTheme();
  const { getAuthToken, isAuthenticated, userData } = useUser();
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [selectedThread, setSelectedThread] = useState(null);
  const [draftSubject, setDraftSubject] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(0);
  const [messagingUnavailable, setMessagingUnavailable] = useState(false);
  const [hasShownRouteToast, setHasShownRouteToast] = useState(false);

  const isDark = theme === "dark";
  const normalizedPlan = `${userData?.subscriptionPlan || "Basic"}`
    .trim()
    .toLowerCase();
  const canSendDirectMessages =
    normalizedPlan === "elite" || normalizedPlan === "platinum";

  const authFetch = useCallback(
    async (urlOrUrls, options = {}) => {
      const token = getAuthToken?.();
      if (!token) {
        throw new Error("Session expired. Please login again.");
      }

      const urls = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls];
      let lastError = null;

      for (const url of urls) {
        const response = await fetch(url, {
          ...options,
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            ...(options.headers || {}),
          },
        });

        const text = await response.text();
        let json = null;
        try {
          json = JSON.parse(text);
        } catch {
          json = null;
        }

        if (response.ok && json?.success) {
          return json;
        }

        const error = new Error(
          json?.message || `Request failed (${response.status})`
        );
        if (response.status === 404) {
          lastError = error;
          continue;
        }
        throw error;
      }

      throw lastError || new Error("Request failed");
    },
    [getAuthToken]
  );

  const fetchThreads = useCallback(async () => {
    if (!isAuthenticated || messagingUnavailable) return;
    setIsLoadingThreads(true);
    try {
      const result = await authFetch([
        `${API_BASE_URL}/Message/Threads?limit=80`,
        `${API_BASE_URL}/Messages/Threads?limit=80`,
        `${API_BASE_URL}/message/threads?limit=80`,
        `${API_BASE_URL}/messages/threads?limit=80`,
      ]);
      const rows = Array.isArray(result?.data) ? result.data : [];
      setThreads(rows);
      setLastSyncAt(Date.now());
      setMessagingUnavailable(false);

      setSelectedThreadId((current) => {
        if (current && rows.some((thread) => thread.id === current)) {
          return current;
        }
        return rows[0]?.id || "";
      });
    } catch (error) {
      const isRouteError = /\(404\)/.test(error?.message || "");
      if (isRouteError) {
        setMessagingUnavailable(true);
        if (!hasShownRouteToast) {
          toast.error("Messaging routes are missing on backend. Redeploy backend to enable messages.");
          setHasShownRouteToast(true);
        }
        return;
      }
      console.error("Messages thread sync failed:", error);
      toast.error(error.message || "Unable to load messages.");
    } finally {
      setIsLoadingThreads(false);
    }
  }, [authFetch, hasShownRouteToast, isAuthenticated, messagingUnavailable]);

  const fetchThreadDetails = useCallback(
    async (threadId) => {
      if (!threadId) {
        setSelectedThread(null);
        return;
      }
      if (messagingUnavailable) return;

      setIsLoadingThread(true);
      try {
        const result = await authFetch([
          `${API_BASE_URL}/Message/Thread/${threadId}`,
          `${API_BASE_URL}/Messages/Thread/${threadId}`,
          `${API_BASE_URL}/message/thread/${threadId}`,
          `${API_BASE_URL}/messages/thread/${threadId}`,
        ]);
        setSelectedThread(result?.data || null);
      } catch (error) {
        if (/\(404\)/.test(error?.message || "")) {
          setMessagingUnavailable(true);
          return;
        }
        console.error("Messages thread load failed:", error);
        toast.error(error.message || "Unable to load selected thread.");
      } finally {
        setIsLoadingThread(false);
      }
    },
    [authFetch, messagingUnavailable]
  );

  useEffect(() => {
    if (!messagingUnavailable) {
      fetchThreads();
    }
  }, [fetchThreads, messagingUnavailable]);

  useEffect(() => {
    fetchThreadDetails(selectedThreadId);
  }, [fetchThreadDetails, selectedThreadId]);

  useEffect(() => {
    if (!isAuthenticated || messagingUnavailable) return undefined;
    const interval = setInterval(() => {
      fetchThreads();
      if (selectedThreadId) {
        fetchThreadDetails(selectedThreadId);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [
    fetchThreads,
    fetchThreadDetails,
    isAuthenticated,
    messagingUnavailable,
    selectedThreadId,
  ]);

  const selectedSummary = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) || null,
    [threads, selectedThreadId]
  );

  const startNewMessage = () => {
    setSelectedThreadId("");
    setSelectedThread(null);
    setDraftSubject("");
    setDraftMessage("");
  };

  const handleSend = useCallback(async () => {
    if (messagingUnavailable) {
      toast.error("Messaging module is not available on backend yet.");
      return;
    }

    if (!canSendDirectMessages) {
      toast.error("Direct admin messaging is available for Platinum and Elite plans.");
      return;
    }

    const messageText = `${draftMessage || ""}`.trim();
    const subjectText = `${draftSubject || ""}`.trim();

    if (!messageText) {
      toast.error("Type a message first.");
      return;
    }

    if (!selectedThreadId && !subjectText) {
      toast.error("Please add a subject for the new message.");
      return;
    }

    setIsSending(true);
    try {
      const payload = {
        message: messageText,
      };
      if (selectedThreadId) {
        payload.threadId = selectedThreadId;
      } else {
        payload.subject = subjectText;
      }

      const result = await authFetch(
        [
          `${API_BASE_URL}/Message/Send`,
          `${API_BASE_URL}/Messages/Send`,
          `${API_BASE_URL}/message/send`,
          `${API_BASE_URL}/messages/send`,
        ],
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const threadId = result?.data?.thread?.id || selectedThreadId;
      setDraftMessage("");
      if (!selectedThreadId) {
        setDraftSubject("");
      }
      if (threadId) {
        setSelectedThreadId(threadId);
      }

      await fetchThreads();
      if (threadId) {
        await fetchThreadDetails(threadId);
      }

      toast.success("Message sent to admin.");
    } catch (error) {
      console.error("Send message failed:", error);
      toast.error(error.message || "Unable to send message.");
    } finally {
      setIsSending(false);
    }
  }, [
    authFetch,
    canSendDirectMessages,
    draftMessage,
    draftSubject,
    fetchThreadDetails,
    fetchThreads,
    messagingUnavailable,
    selectedThreadId,
  ]);

  return (
    <section
      className={`min-h-screen px-4 py-8 sm:px-6 lg:px-8 ${
        isDark ? "bg-zinc-950 text-slate-100" : "bg-gray-50 text-slate-900"
      }`}
    >
      <div className="w-full">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Direct support inbox. Admin replies appear here in real time.
          </p>
          <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Sync {lastSyncAt ? formatDateTime(lastSyncAt) : "starting..."}
          </p>
        </div>

        {messagingUnavailable && (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              isDark
                ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                : "border-rose-300 bg-rose-50 text-rose-700"
            }`}
          >
            Messaging routes are missing on this backend deployment. Redeploy backend with latest routes to enable live support chat.
          </div>
        )}

        {!canSendDirectMessages && (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              isDark
                ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                : "border-amber-300 bg-amber-50 text-amber-800"
            }`}
          >
            Direct admin messaging is locked for your current plan.
            <Link to="/Subscription" className="ml-1 font-semibold underline">
              Upgrade to Platinum or Elite
            </Link>
            {" "}to send messages.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <aside
            className={`xl:col-span-4 rounded-2xl border p-3 ${
              isDark ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Your Threads</h2>
              <button
                onClick={startNewMessage}
                disabled={!canSendDirectMessages || messagingUnavailable}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${
                  canSendDirectMessages && !messagingUnavailable
                    ? "bg-teal-600 hover:bg-teal-500"
                    : "cursor-not-allowed bg-slate-500"
                }`}
              >
                New Message
              </button>
            </div>

            <div className="max-h-[62vh] space-y-2 overflow-y-auto pr-1">
              {isLoadingThreads ? (
                <div className="text-xs opacity-70">Loading threads...</div>
              ) : threads.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-400/40 p-3 text-xs opacity-80">
                  No messages yet. Start a new message to contact admin.
                </div>
              ) : (
                threads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                      selectedThreadId === thread.id
                        ? isDark
                          ? "border-teal-400 bg-slate-800"
                          : "border-teal-400 bg-teal-50"
                        : isDark
                        ? "border-slate-700 bg-slate-900 hover:bg-slate-800"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-1 text-xs font-semibold">{thread.subject}</p>
                      {thread.unreadForUser > 0 && (
                        <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          {thread.unreadForUser}
                        </span>
                      )}
                    </div>
                    <p className={`mt-1 line-clamp-1 text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                      {thread.latestMessage?.text || "No messages yet"}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          STATUS_STYLES[thread.status] || STATUS_STYLES.open
                        }`}
                      >
                        {thread.status}
                      </span>
                      <span className="text-[10px] opacity-70">
                        {formatRelative(thread.lastMessageAt)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          <div
            className={`xl:col-span-8 rounded-2xl border p-4 ${
              isDark ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white"
            }`}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold">
                  {selectedSummary?.subject || "New Message"}
                </h3>
                {selectedSummary?.status && (
                  <p className="text-xs opacity-70">
                    Status: <span className="font-medium">{selectedSummary.status}</span>
                  </p>
                )}
              </div>
            </div>

            {!selectedThreadId && (
              <div className="mb-3">
                <label className="mb-1 block text-xs font-semibold opacity-80">
                  Subject
                </label>
                <input
                  type="text"
                  value={draftSubject}
                  onChange={(event) => setDraftSubject(event.target.value)}
                  placeholder="e.g. Withdrawal pending for too long"
                  className={`w-full rounded-xl border px-3 py-2 text-sm ${
                    isDark
                      ? "border-slate-700 bg-slate-800 text-slate-100"
                      : "border-slate-300 bg-slate-50 text-slate-900"
                  }`}
                />
              </div>
            )}

            <div
              className={`mb-3 h-[46vh] overflow-y-auto rounded-xl border p-3 ${
                isDark ? "border-slate-700 bg-slate-950/60" : "border-slate-200 bg-slate-50"
              }`}
            >
              {selectedThreadId ? (
                isLoadingThread ? (
                  <p className="text-xs opacity-70">Loading conversation...</p>
                ) : selectedThread?.messages?.length ? (
                  <div className="space-y-3">
                    {selectedThread.messages.map((message) => {
                      const isAdminMessage = message.senderRole === "admin";
                      return (
                        <div
                          key={message.id}
                          className={`max-w-[88%] rounded-xl px-3 py-2 text-sm ${
                            isAdminMessage
                              ? isDark
                                ? "bg-slate-700 text-slate-100"
                                : "bg-slate-200 text-slate-900"
                              : "ml-auto bg-teal-600 text-white"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.text}</p>
                          <p className="mt-1 text-[10px] opacity-80">
                            {isAdminMessage ? "Admin" : "You"} |{" "}
                            {formatDateTime(message.createdAt)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs opacity-70">No messages in this thread.</p>
                )
              ) : (
                <p className="text-xs opacity-70">
                  Start a new message to reach admin directly.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold opacity-80">
                Message
              </label>
              <textarea
                value={draftMessage}
                onChange={(event) => setDraftMessage(event.target.value)}
                rows={4}
                placeholder="Type your message to admin..."
                className={`w-full resize-none rounded-xl border px-3 py-2 text-sm ${
                  isDark
                    ? "border-slate-700 bg-slate-800 text-slate-100"
                    : "border-slate-300 bg-slate-50 text-slate-900"
                }`}
              />
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleSend}
                  disabled={isSending || !canSendDirectMessages || messagingUnavailable}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
                    isSending || !canSendDirectMessages || messagingUnavailable
                      ? "cursor-not-allowed bg-slate-500"
                      : "bg-teal-600 hover:bg-teal-500"
                  }`}
                >
                  {isSending
                    ? "Sending..."
                    : canSendDirectMessages
                    ? "Send Message"
                    : "Plan Locked"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
