import { Link } from "react-router-dom";
import PremiumBackground from "@/components/layout/PremiumBackground";
import LandingHeader from "@/components/landing/LandingHeader";
import Seo from "@/components/Seo";
import { LEGAL_VERSIONS } from "@/lib/legalVersions";

const PrivacidadPage = () => (
  <PremiumBackground>
    <Seo
      title="Política de tratamiento de datos personales | Visualia"
      description="Política de tratamiento de datos personales de Visualia (Boga Casa de Contenidos S.A.S.) conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013 de Colombia."
      path="/privacidad"
    />
    <LandingHeader />
    <main className="mx-auto max-w-3xl px-6 pt-32 pb-20 text-foreground">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Contenido legal</p>
      <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">
        Política de tratamiento de datos personales
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Versión {LEGAL_VERSIONS.privacy} · Vigente desde julio de 2026 · Colombia
      </p>

      <div className="mt-8 rounded-lg border border-border/40 bg-muted/20 p-4 text-sm text-muted-foreground">
        Esta versión es un borrador estructural preparado por el equipo de Visualia. El texto final
        debe ser revisado y aprobado por un abogado antes de considerarse definitivo. Al utilizar
        Visualia usted acepta esta política en su versión vigente.
      </div>

      <section className="mt-10 space-y-4">
        <h2 className="font-display text-xl font-semibold">1. Responsable del tratamiento</h2>
        <p className="text-muted-foreground">
          <strong className="text-foreground">Boga Casa de Contenidos S.A.S.</strong> (en adelante,
          "Visualia"), sociedad colombiana identificada con NIT 900.325.011-10, con domicilio en
          Bogotá D.C., Colombia. Correo de contacto:{" "}
          <a href="mailto:privacidad@bogacasadecontenidos.com" className="text-primary hover:underline">
            privacidad@bogacasadecontenidos.com
          </a>.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-display text-xl font-semibold">2. Marco legal</h2>
        <p className="text-muted-foreground">
          Esta política se rige por la Ley 1581 de 2012, el Decreto 1377 de 2013 y demás normas
          aplicables en Colombia sobre protección de datos personales, así como por la
          Superintendencia de Industria y Comercio como autoridad de control.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-display text-xl font-semibold">3. Datos que recolectamos</h2>
        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
          <li>Datos de identificación y contacto: nombre, correo electrónico, teléfono.</li>
          <li>Datos del negocio: razón social, NIT, dirección, tipo de establecimiento.</li>
          <li>Datos de facturación y pago procesados mediante nuestros aliados (Wompi).</li>
          <li>
            Datos técnicos y de uso: dirección IP, identificadores de dispositivo, registros de
            acceso, contenido cargado a la plataforma.
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-display text-xl font-semibold">4. Finalidades del tratamiento</h2>
        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
          <li>Prestar el servicio de cartelería digital contratado.</li>
          <li>Gestionar la cuenta, autenticación y soporte técnico.</li>
          <li>Emitir facturación electrónica y procesar pagos recurrentes.</li>
          <li>Enviar comunicaciones operativas y, previa autorización, comerciales.</li>
          <li>Cumplir obligaciones legales, contables y contractuales.</li>
        </ul>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-display text-xl font-semibold">5. Derechos del titular</h2>
        <p className="text-muted-foreground">
          Como titular de sus datos personales, usted tiene derecho a:
        </p>
        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
          <li>Conocer, actualizar y rectificar sus datos.</li>
          <li>Solicitar prueba de la autorización otorgada.</li>
          <li>Ser informado sobre el uso dado a sus datos.</li>
          <li>Presentar quejas ante la Superintendencia de Industria y Comercio.</li>
          <li>Revocar la autorización y/o solicitar la supresión de sus datos cuando aplique.</li>
          <li>Acceder de forma gratuita a sus datos personales que hayan sido tratados.</li>
        </ul>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-display text-xl font-semibold">6. Canal para ejercer derechos</h2>
        <p className="text-muted-foreground">
          Las peticiones, consultas y reclamos podrán presentarse al correo{" "}
          <a href="mailto:privacidad@bogacasadecontenidos.com" className="text-primary hover:underline">
            privacidad@bogacasadecontenidos.com
          </a>{" "}
          indicando nombre completo, documento de identidad, medio de contacto y descripción clara
          de la solicitud. El tiempo de respuesta será el establecido por la Ley 1581 de 2012
          (consultas: 10 días hábiles; reclamos: 15 días hábiles).
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-display text-xl font-semibold">7. Transferencia y encargo</h2>
        <p className="text-muted-foreground">
          Podemos compartir datos con proveedores tecnológicos (Supabase, Wompi, servicios de
          correo, mensajería y analítica) que actúan como encargados, bajo acuerdos que garantizan
          niveles adecuados de protección.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-display text-xl font-semibold">8. Vigencia y actualizaciones</h2>
        <p className="text-muted-foreground">
          Esta política puede ser actualizada. Publicaremos la versión vigente en esta página y, en
          cambios sustanciales, notificaremos por correo electrónico.
        </p>
      </section>

      <div className="mt-12 flex flex-wrap gap-4 text-sm">
        <Link to="/" className="text-primary hover:underline">← Volver al inicio</Link>
        <Link to="/terminos" className="text-primary hover:underline">Ver términos y condiciones</Link>
      </div>
    </main>
  </PremiumBackground>
);

export default PrivacidadPage;
