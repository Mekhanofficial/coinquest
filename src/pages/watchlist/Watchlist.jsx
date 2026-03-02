export default function WatchlistPage() {
  return (
    <section className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-10">
      <div className="max-w-4xl mx-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white mb-3">
          Watch List
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Keep an eye on your favorite markets. Track price alerts, liquidity,
          and performance for coins you care about.
        </p>
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-900"
            >
              <div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  BTC / USD
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Alert triggered when price drops below $24,000
                </p>
              </div>
              <span className="text-sm text-emerald-500">Watching</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
