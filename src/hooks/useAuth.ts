import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/context/AuthContext";

/**
 * Sesión + redirección para rutas protegidas.
 * No hace red: lee del <AuthProvider>, que es el único que valida el token.
 */
export function useAuth(redirectTo = "/login") {
  const { session, loading } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate(redirectTo, { replace: true });
  }, [loading, session, navigate, redirectTo]);

  return { session, loading };
}

export async function signOut() {
  await supabase.auth.signOut();
}
