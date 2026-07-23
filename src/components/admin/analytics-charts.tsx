"use client";

const COLORS: Record<string, string[]> = {
  jade: ["bg-jade-500", "bg-jade-400", "bg-jade-600", "bg-jade-300", "bg-jade-700", "bg-jade-800"],
  bronze: ["bg-bronze-500", "bg-bronze-400", "bg-bronze-600", "bg-bronze-300", "bg-amber-500", "bg-amber-600"],
  ink: ["bg-ink-700", "bg-ink-600", "bg-ink-800", "bg-sky-500", "bg-indigo-500", "bg-purple-500"],
};

export function AnalyticsCharts({ data, color = "jade" }: { data: { label: string; value: number }[]; color?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const colors = COLORS[color] || COLORS.jade;

  return (
    <div className="space-y-3">
      {data.sort((a, b) => b.value - a.value).map((item, i) => {
        const pct = total > 0 ? (item.value / total) * 100 : 0;
        return (
          <div key={item.label} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-ink-900 capitalize">{item.label}</span>
              <span className="text-sm font-bold text-ink-900">{item.value} <span className="text-xs text-ink-600/50">({pct.toFixed(0)}%)</span></span>
            </div>
            <div className="h-3 rounded-full bg-rice-200 overflow-hidden">
              <div className={`h-full rounded-full ${colors[i % colors.length]} transition-all duration-1000`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
