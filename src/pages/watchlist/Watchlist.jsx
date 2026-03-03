export default function WatchlistPage() {
  return (
    <section className="min-h-screen bg-gray-50 dark:bg-zinc-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8">
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
