import { useMemo } from "react";
import { useUser } from "../../context/UserContext";

const messagesSeed = [
  {
    id: 1,
    title: "Deposit cleared",
    body: "Your USD deposit has been credited to your account balance.",
    time: "2m ago",
  },
  {
    id: 2,
    title: "Trading signal",
    body: "New BUY signal posted for BTCUSD. Consider reviewing.",
    time: "11m ago",
  },
  {
    id: 3,
    title: "Copy trader update",
    body: "Lisa Dawson reported +4.2% in the last hour.",
    time: "47m ago",
  },
];

const MessageListItem = ({ message }) => (
  <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg transition">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
        {message.title}
      </h3>
      <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
        {message.time}
      </span>
    </div>
    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
      {message.body}
    </p>
  </div>
);

export default function MessagesPage() {
  const { userData } = useUser();
  const displayName = useMemo(
    () => userData?.firstName || userData?.name || "Trader",
    [userData]
  );

  return (
    <section className="min-h-screen px-4 py-10 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <p className="text-sm text-slate-500 dark:text-slate-400">Messages</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Hello {displayName}, here's what you missed
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Latest system updates and copy-trader alerts in one place.
          </p>
        </header>

        <div className="space-y-4">
          {messagesSeed.map((message) => (
            <MessageListItem key={message.id} message={message} />
          ))}
        </div>
      </div>
    </section>
  );
}
