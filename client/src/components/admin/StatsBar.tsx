interface Stats {
  totalToday: number;
  approved: number;
  rejected: number;
  displaying: number;
}

export function StatsBar({ stats }: { stats: Stats }) {
  const items = [
    { label: 'Today', value: stats.totalToday },
    { label: 'Approved', value: stats.approved },
    { label: 'Rejected', value: stats.rejected },
    { label: 'On wall', value: stats.displaying },
  ];

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-bg-secondary border border-border rounded-lg mb-6">
      {items.map((item) => (
        <div key={item.label} className="text-center min-w-[80px]">
          <p className="font-mono text-2xl text-accent-primary">{item.value}</p>
          <p className="text-xs text-text-secondary font-inter">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
