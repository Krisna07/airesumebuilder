const LoadingResumeState = () => {
  return (
    <section className="w-full min-h-[70vh] flex flex-col items-center justify-center gap-8 px-4 bg-[radial-gradient(circle_at_top,#f0fdfa_0%,#f8fafc_30%,#ffffff_70%)] dark:bg-[radial-gradient(circle_at_top,#0f172a_0%,#0b1220_35%,#020617_100%)] transition-colors duration-200">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-xl bg-teal-200/30 dark:bg-teal-500/20" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 tracking-tight">Loading your resumes</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Please wait...</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 w-full max-w-5xl">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="relative h-[300px] max-w-[250px] w-full overflow-hidden rounded-2xl shadow-inner bg-gray-100 dark:bg-slate-800 skeleton-shimmer"
          />
        ))}
      </div>
    </section>
  )
}

export default LoadingResumeState
