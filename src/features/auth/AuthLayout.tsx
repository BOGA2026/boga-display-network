import { ReactNode } from "react";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Apple-like auth shell: dark aurora background, glass card, soft transitions.
 * Reused by Login / Register / ForgotPassword / MagicLink screens.
 */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 hero-aurora opacity-70" aria-hidden />
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <Link
          to="/"
          className="mb-8 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Volver a Visualia
        </Link>
        <div className="v-card w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-6 space-y-4">{children}</div>
        </div>
        {footer && (
          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        )}
      </div>
    </div>
  );
}
