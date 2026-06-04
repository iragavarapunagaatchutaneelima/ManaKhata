export default function ExpensesLoading() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3].map(i => (
          <div key={i} className="glass-card p-5 h-28">
            <div className="skeleton h-10 w-10 rounded-xl mb-3" />
            <div className="skeleton h-6 w-24 mb-1" />
            <div className="skeleton h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="glass-card p-6 h-52">
        <div className="skeleton h-5 w-40 mb-4" />
        <div className="skeleton h-36 w-full rounded-xl" />
      </div>
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="skeleton h-5 w-32" />
        </div>
        <div className="p-5 space-y-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
        </div>
      </div>
    </div>
  )
}
