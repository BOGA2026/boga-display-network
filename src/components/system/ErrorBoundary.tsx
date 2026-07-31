import React from "react";
import { logError } from "@/lib/errorLogger";

type Props = {
  children: React.ReactNode;
  /** Al cambiar este valor, el boundary se resetea (útil por ruta). */
  resetKey?: string;
  fallback?: (args: { error: Error; reset: () => void }) => React.ReactNode;
  label?: string;
};

type State = { error: Error | null };

/**
 * AppErrorBoundary — última línea de defensa. Si algo revienta en render,
 * mostramos una tarjeta clara en vez de una pantalla en blanco.
 */
export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logError(error, {
      label: this.props.label ?? "app-error-boundary",
      info: info.componentStack,
    });
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback({ error, reset: this.reset });

    const isChunkError =
      /chunk|dynamically imported module|Importing a module script failed/i.test(error.message || "");

    return (
      <div className="min-h-dvh flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center space-y-3">
          <h1 className="text-lg font-semibold text-foreground">
            {isChunkError ? "Hay una versión nueva disponible" : "Algo salió mal"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isChunkError
              ? "Recargá la página para cargar la última versión de Visualia."
              : "Tuvimos un problema mostrando esta pantalla. Podés intentarlo de nuevo."}
          </p>
          <div className="flex justify-center gap-2 pt-1">
            <button
              onClick={this.reset}
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted/40"
            >
              Reintentar
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
            >
              Recargar
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
