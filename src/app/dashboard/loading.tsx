export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-navy">
      <div className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto h-7 w-40 max-w-6xl animate-pulse rounded bg-white/10" />
      </div>
      <div className="mx-auto max-w-6xl space-y-4 px-6 py-10">
        <div className="h-8 w-64 animate-pulse rounded bg-white/10" />
        <div className="h-40 w-full animate-pulse rounded-2xl bg-white/5" />
        <div className="h-24 w-full animate-pulse rounded-xl bg-white/5" />
        <div className="h-24 w-full animate-pulse rounded-xl bg-white/5" />
      </div>
    </div>
  );
}
