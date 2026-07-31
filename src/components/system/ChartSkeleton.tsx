/** Placeholder ligero (sin dependencias pesadas) para gráficos diferidos. */
export default function ChartSkeleton({ height = 180, label }: { height?: number; label?: string }) {
  return (
    <div
      className="flex flex-col justify-end gap-2 rounded-xl border border-white/10 bg-white/5 p-4"
      style={{ height }}
      aria-hidden="true"
    >
      {label && <span className="sr-only">{label}</span>}
      <div className="flex h-full items-end gap-2">
        {[42, 68, 55, 80, 35, 72, 60].map((h, i) => (
          <div
            key={i}
            className="flex-1 animate-pulse rounded-t-md bg-white/10"
            style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
      <div className="h-2 w-full animate-pulse rounded bg-white/5" />
    </div>
  );
}
