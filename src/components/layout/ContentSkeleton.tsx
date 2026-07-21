/**
 * ContentSkeleton — fallback usado dentro del AppShell/AdminLayout
 * mientras un chunk de ruta se carga. No cubre sidebar ni topbar,
 * así el shell permanece estable y evita el flash blanco.
 */
export function ContentSkeleton() {
  return (
    <div className="p-6 md:p-8 animate-in fade-in duration-200">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-7 w-56 rounded-md bg-muted/60 animate-pulse" />
        <div className="h-4 w-80 rounded bg-muted/40 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-muted/40 animate-pulse"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-muted/30 animate-pulse" />
      </div>
    </div>
  );
}

export default ContentSkeleton;
