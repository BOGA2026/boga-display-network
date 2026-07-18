// Shared skeleton primitives shaped like the real content they replace,
// so the perceived loading feels faster and less "blank".

export function AdminBar({ w = "100%", h = 12 }: { w?: string | number; h?: number }) {
  return (
    <div
      className="rounded animate-pulse"
      style={{
        width: typeof w === "number" ? `${w}px` : w,
        height: `${h}px`,
        background: "hsl(var(--admin-surface-2))",
      }}
    />
  );
}

export function AdminTableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full">
      <div
        className="grid gap-4 px-4 py-3"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          borderBottom: "1px solid hsl(var(--admin-border))",
        }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <AdminBar key={i} w="60%" h={10} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid gap-4 px-4 py-3.5"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            borderBottom: "1px solid hsl(var(--admin-border) / 0.6)",
          }}
        >
          {Array.from({ length: cols }).map((__, c) => (
            <AdminBar key={c} w={c === 0 ? "80%" : "50%"} h={12} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function AdminInlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="admin-card p-4 flex items-start justify-between gap-4"
      style={{ borderColor: "hsl(var(--admin-danger) / 0.4)" }}
    >
      <div>
        <p className="text-[13px] font-medium" style={{ color: "hsl(var(--admin-danger))" }}>
          No pudimos cargar los datos
        </p>
        <p className="text-[12px] admin-muted mt-1">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-[12px] font-medium rounded-md px-3 py-1.5 shrink-0"
          style={{
            border: "1px solid hsl(var(--admin-border))",
            background: "hsl(var(--admin-surface))",
            color: "hsl(var(--admin-fg))",
          }}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
