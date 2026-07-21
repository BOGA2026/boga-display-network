/**
 * PageTransition — subtle fade + rise between dashboard routes.
 *
 * Rationale:
 * - Uses `AnimatePresence mode="wait"` keyed by pathname to avoid stacking
 *   two pages during unmount.
 * - 240ms with ios easing is short enough to feel snappy but long enough to
 *   read as intentional. Y offset kept tiny (6px) to avoid layout jump.
 */
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
