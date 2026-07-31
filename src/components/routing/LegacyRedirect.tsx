import { Navigate, useLocation, useParams } from "react-router-dom";

/**
 * Redirección de rutas legadas que PRESERVA los parámetros de ruta,
 * el query string y el hash.
 *
 * <LegacyRedirect to="/dashboard/listas/:id" /> montado en
 * "/dashboard/playlists/:id" manda /dashboard/playlists/abc?x=1
 * a /dashboard/listas/abc?x=1 sin perder el deep link.
 */
export default function LegacyRedirect({ to }: { to: string }) {
  const params = useParams();
  const { search, hash } = useLocation();

  const target = to.replace(/:([A-Za-z0-9_]+)/g, (match, key: string) => {
    const value = params[key];
    return value === undefined ? match : encodeURIComponent(value);
  });

  return <Navigate to={`${target}${search}${hash}`} replace />;
}
