const SEGMENTS = [
  { key: 'pending',      label: 'Pending',       color: '#fbbf24' },
  { key: 'inProduction', label: 'In Production', color: '#3b82f6' },
  { key: 'ready',        label: 'Ready',          color: '#a855f7' },
  { key: 'shipped',      label: 'Shipped',        color: '#6366f1' },
  { key: 'delivered',    label: 'Delivered',      color: '#22c55e' },
];

export default function OrdersDonutChart({ overview = {}, total = 0 }) {
  let cumulative = 0;
  const stops = SEGMENTS.map(({ key, color }) => {
    const value = overview[key] || 0;
    const pct = total > 0 ? (value / total) * 100 : 0;
    const start = cumulative;
    cumulative += pct;
    return `${color} ${start}% ${cumulative}%`;
  }).join(', ');

  return (
    <div className="flex items-center gap-6">
      <div
        className="relative w-32 h-32 rounded-full flex-shrink-0"
        style={{ background: total > 0 ? `conic-gradient(${stops})` : '#e5e7eb' }}
      >
        <div className="absolute inset-3 bg-white rounded-full flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-gray-900">{total}</span>
          <span className="text-[10px] text-gray-400">Orders</span>
        </div>
      </div>
      <div className="space-y-1.5 flex-1">
        {SEGMENTS.map(({ key, label, color }) => (
          <div key={key} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-gray-600">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </span>
            <span className="font-semibold text-gray-800">{overview[key] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
