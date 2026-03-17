// CORRECCIÓN 11 aplicada — Página placeholder de Política de privacidad
import { Link } from "react-router-dom";
import PremiumBackground from "@/components/layout/PremiumBackground";
import LandingHeader from "@/components/landing/LandingHeader";

const PrivacidadPage = () => (
  <PremiumBackground>
    <LandingHeader />
    <div className="mx-auto max-w-3xl px-6 pt-32 pb-20 text-center">
      <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">Política de privacidad</h1>
      <p className="mt-4 text-muted-foreground">Esta página estará disponible próximamente.</p>
      <Link to="/" className="mt-8 inline-block text-sm font-medium text-primary hover:underline">← Volver al inicio</Link>
    </div>
  </PremiumBackground>
);

export default PrivacidadPage;
