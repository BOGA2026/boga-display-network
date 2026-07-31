import React from "react";
import { logError } from "@/lib/errorLogger";

type Props = { children: React.ReactNode; routeKey?: string };
type State = { error: Error | null };

/**
 * RouteErrorBoundary — evita que un error (o un chunk que no cargó tras un
 * deploy) tumbe toda la app. Muestra una tarjeta con opción de reintentar.
 */
export class RouteErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logError(error, {
      label: "route-error",
      scope: "route-error",
      section: this.props.routeKey ?? "unknown",
      route: this.props.routeKey,
      info: info.componentStack,
    });
  }


  componentDidUpdate(prev: Props) {
    if (prev.routeKey !== this.props.routeKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    const isChunkError = /chunk|dynamically imported module|Importing a module script failed/i.test(
      this.state.error.message || ""
    );

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 text-center space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            {isChunkError ? "Hay una versión nueva disponible" : "Algo salió mal"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isChunkError
              ? "Recargá la página para cargar la última versión."
              : "No pudimos mostrar esta sección. Podés intentarlo de nuevo."}
          </p>
          <div className="flex gap-2 justify-center pt-1">
            <button
              onClick={() => this.setState({ error: null })}
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted/40 transition-colors"
            >
              Reintentar
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Recargar
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default RouteErrorBoundary;
