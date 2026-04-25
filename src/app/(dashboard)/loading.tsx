export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-3">
        <div className="skeleton h-7 w-1/3" />
        <div className="skeleton h-4 w-1/2" />
      </div>
      <div className="skeleton h-48 w-full" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
      </div>
    </div>
  );
}
