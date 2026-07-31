/**
 * PageTransition — subtle fade + rise between dashboard routes.
 *
 * Rationale:
 * - Pure CSS: the wrapper is re-keyed by pathname, so React remounts it and
 *   the `motion-rise` animation replays. No JS animation runtime in the shell.
 * - Timing comes from the --duration-medium / --ease-ios tokens in index.css.
 * - No exit animation on purpose: waiting for an unmount tween delays the new
 *   route's paint, and the rise already reads as a transition.
 */
import { useLocation } from "react-router-dom";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="motion-rise h-full">
      {children}
    </div>
  );
}
