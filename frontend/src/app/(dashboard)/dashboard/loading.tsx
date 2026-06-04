export default function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-pulse">
      {/* Welcome Banner skeleton */}
      <div className="glass-card p-6 h-24">
        <div className="skeleton h-7 w-64 mb-2" />
        <div className="skeleton h-4 w-48" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="glass-card p-5 h-32">
            <div className="skeleton h-10 w-10 rounded-xl mb-3" />
            <div className="skeleton h-7 w-28 mb-2" />
            <div className="skeleton h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="glass-card p-6 h-64">
            <div className="skeleton h-5 w-36 mb-4" />
            <div className="flex items-center justify-center">
              <div className="skeleton rounded-full w-32 h-32" />
            </div>
          </div>
          <div className="glass-card p-5 h-48">
            <div className="skeleton h-5 w-28 mb-4" />
            {[1,2,3].map(i => <div key={i} className="skeleton h-10 rounded-xl mb-3" />)}
          </div>
        </div>
        <div className="lg:col-span-2 glass-card">
          <div className="p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="skeleton h-5 w-36" />
          </div>
          <div className="p-5 space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
          </div>
        </div>
      </div>
    </div>
  )
}
