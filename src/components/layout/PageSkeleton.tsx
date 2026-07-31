/**
 * PageSkeleton — fallback estándar para todas las rutas lazy.
 * Reutiliza el ContentSkeleton para mantener un solo lenguaje visual.
 */
import { ContentSkeleton } from "./ContentSkeleton";

export function PageSkeleton() {
  return <ContentSkeleton />;
}

export default PageSkeleton;
