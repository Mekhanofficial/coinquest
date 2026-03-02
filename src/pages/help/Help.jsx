export default function HelpPage() {
  return (
    <section className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-10">
      <div className="max-w-3xl mx-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8 space-y-4">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
          Help Center
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Need assistance? Browse the guides or reach out to support for help
          with deposits, trading, KYC, and more.
        </p>
        <div className="space-y-2">
          {[
            "How to verify my identity",
            "Deposits, withdrawals, and wallet setup",
            "Understanding copy trading and bots",
            "Contact support or report a bug",
          ].map((item) => (
            <div
              key={item}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm text-slate-600 dark:text-slate-300"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
