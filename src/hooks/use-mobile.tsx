import * as React from "react";

/**
 * Breakpoint por defecto del dashboard: por debajo de `lg` (1024px) la
 * navegación se colapsa en un panel deslizable (Sheet) con botón hamburguesa.
 */
export const MOBILE_BREAKPOINT = 1024;

export function useIsMobile(breakpoint: number = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < breakpoint);
    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);

  return !!isMobile;
}
