import { Link } from "react-router-dom";
import PremiumBackground from "@/components/layout/PremiumBackground";
import LandingHeader from "@/components/landing/LandingHeader";
import Seo from "@/components/Seo";
import { LEGAL_VERSIONS } from "@/lib/legalVersions";

const TerminosPage = () => (
  <PremiumBackground>
    <Seo
      title="Términos y condiciones | Visualia"
      description="Términos y condiciones del servicio SaaS de Visualia (Boga Casa de Contenidos S.A.S.): prueba, facturación, cancelación y responsabilidades."
      path="/terminos"
    />
    <LandingHeader />
    <main className="mx-auto max-w-3xl px-6 pt-32 pb-20 text-foreground">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Contenido legal</p>
      <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">
        Términos y condiciones del servicio
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Versión {LEGAL_VERSIONS.terms} · Vigente desde julio de 2026 · Colombia
      </p>

      <div className="mt-8 rounded-lg border border-border/40 bg-muted/20 p-4 text-sm text-muted-foreground">
        Este documento es un borrador estructural. El texto definitivo debe ser revisado por un
        abogado antes de considerarse vinculante. Al crear una cuenta o usar Visualia usted acepta
        estos términos en su versión vigente.
      </div>

      <section className="mt-10 space-y-4">
        <h2 className="font-display text-xl font-semibold">1. Proveedor</h2>
        <p className="text-muted-foreground">
          Visualia es un servicio de software como servicio (SaaS) operado por{" "}
          <strong className="text-foreground">Boga Casa de Contenidos S.A.S.</strong>, NIT
          900.325.011-10, domiciliada en Bogotá D.C., Colombia.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-display text-xl font-semibold">2. Objeto del servicio</h2>
        <p className="text-muted-foreground">
          Visualia permite crear, programar y transmitir contenido audiovisual en pantallas
          conectadas de establecimientos comerciales. El servicio se presta bajo modalidad de
          suscripción mensual.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-display text-xl font-semibold">3. Cuenta y elegibilidad</h2>
        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
          <li>El usuario debe ser mayor de edad y actuar en nombre de un negocio legalmente constituido u operativo.</li>
          <li>La información suministrada debe ser veraz, completa y actualizada.</li>
          <li>El usuario es responsable de la confidencialidad de sus credenciales.</li>
        </ul>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-display text-xl font-semibold">4. Prueba y planes</h2>
        <p className="text-muted-foreground">
          Podemos ofrecer una prueba gratuita o pantallas demo sin costo. Al finalizar la prueba, el
          servicio continúa bajo el plan contratado. Los precios vigentes se publican en la página
          de precios y pueden ajustarse con aviso previo de al menos 30 días.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-display text-xl font-semibold">5. Facturación y pagos</h2>
        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
          <li>La facturación es mensual y anticipada, en pesos colombianos (COP).</li>
          <li>Los pagos se procesan mediante Wompi (tarjeta, PSE, Nequi).</li>
          <li>El servicio puede suspenderse ante mora superior a 48 horas.</li>
          <li>El uso proporcional se cobra de forma prorrateada al añadir pantallas.</li>
        </ul>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-display text-xl font-semibold">6. Cancelación</h2>
        <p className="text-muted-foreground">
          El usuario puede cancelar la suscripción en cualquier momento desde el panel. La
          cancelación surte efecto al finalizar el ciclo facturado; no se generan reembolsos por
          períodos parciales, salvo obligación legal.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-display text-xl font-semibold">7. Contenido del cliente</h2>
        <p className="text-muted-foreground">
          El cliente es el único responsable del contenido cargado y de contar con las licencias y
          autorizaciones necesarias. Visualia se reserva el derecho de suspender contenido ilegal,
          ofensivo o que infrinja derechos de terceros.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-display text-xl font-semibold">8. Disponibilidad y soporte</h2>
        <p className="text-muted-foreground">
          Trabajamos con altos niveles de disponibilidad pero no garantizamos ausencia total de
          interrupciones. Ofrecemos soporte por correo y WhatsApp en horario hábil colombiano.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-display text-xl font-semibold">9. Limitación de responsabilidad</h2>
        <p className="text-muted-foreground">
          Salvo dolo o culpa grave, la responsabilidad de Visualia se limita al valor efectivamente
          pagado por el cliente durante los tres (3) meses anteriores al hecho generador.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-display text-xl font-semibold">10. Ley aplicable</h2>
        <p className="text-muted-foreground">
          Estos términos se rigen por las leyes de la República de Colombia. Las controversias se
          someterán a los jueces de Bogotá D.C.
        </p>
      </section>

      <div className="mt-12 flex flex-wrap gap-4 text-sm">
        <Link to="/" className="text-primary hover:underline">← Volver al inicio</Link>
        <Link to="/privacidad" className="text-primary hover:underline">Ver política de privacidad</Link>
      </div>
    </main>
  </PremiumBackground>
);

export default TerminosPage;
