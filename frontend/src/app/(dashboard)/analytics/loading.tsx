export default function AnalyticsLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="skeleton h-7 w-48 mb-2" />
          <div className="skeleton h-4 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="glass-card p-5 h-28">
            <div className="skeleton h-10 w-10 rounded-xl mb-3" />
            <div className="skeleton h-6 w-24 mb-1" />
            <div className="skeleton h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="glass-card p-6 h-72">
        <div className="skeleton h-5 w-44 mb-5" />
        <div className="skeleton h-52 w-full rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1,2].map(i => (
          <div key={i} className="glass-card p-6 h-56">
            <div className="skeleton h-5 w-36 mb-5" />
            <div className="skeleton h-40 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
