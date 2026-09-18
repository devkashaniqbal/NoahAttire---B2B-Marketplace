export default function RevenueProfitChart({ data = [] }) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No revenue data yet</div>;
  }

  const width = 600;
  const height = 180;
  const padding = 24;
  const maxVal = Math.max(...data.map((d) => Math.max(d.revenue, d.profit)), 1);

  const toPoints = (key) =>
    data.map((d, i) => {
      const x = padding + (i / Math.max(data.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - (d[key] / maxVal) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44" preserveAspectRatio="none">
        <polyline points={toPoints('revenue')} fill="none" stroke="#7c3aed" strokeWidth="2.5" />
        <polyline points={toPoints('profit')} fill="none" stroke="#22c55e" strokeWidth="2.5" />
        {data.map((d, i) => {
          const x = padding + (i / Math.max(data.length - 1, 1)) * (width - padding * 2);
          const yRev = height - padding - (d.revenue / maxVal) * (height - padding * 2);
          const yProfit = height - padding - (d.profit / maxVal) * (height - padding * 2);
          return (
            <g key={d.date}>
              <circle cx={x} cy={yRev} r="3" fill="#7c3aed" />
              <circle cx={x} cy={yProfit} r="3" fill="#22c55e" />
            </g>
          );
        })}
      </svg>
      <div className="flex items-center justify-between mt-2 px-1">
        {data.map((d) => (
          <span key={d.date} className="text-[10px] text-gray-400">{d.date.slice(5)}</span>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3">
        <span className="flex items-center gap-1.5 text-xs text-gray-600">
          <span className="w-2.5 h-2.5 rounded-full bg-[#7c3aed]" /> Revenue
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-600">
          <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" /> Profit
        </span>
      </div>
    </div>
  );
}
