import LandingHeader from "@/components/landing/LandingHeader";
import LegalFooter from "@/components/landing/LegalFooter";
import Seo from "@/components/Seo";
import { Link } from "react-router-dom";
import { ORGANIZATION_JSON_LD } from "@/config/organization";

const facts: { label: string; value: string }[] = [
  { label: "Razón social", value: "Boga Casa de Contenidos S.A.S." },
  { label: "Marca comercial", value: "Visualia (Visualia Media)" },
  { label: "NIT", value: "900.325.011-10" },
  { label: "País", value: "Colombia" },
  { label: "Sede", value: "Bogotá, Colombia" },
  { label: "Correo", value: "hola@visualiamedia.com" },
  { label: "WhatsApp", value: "+57 316 326 5696" },
  { label: "Sitio web", value: "visualiamedia.com" },
];

export default function NosotrosPage() {
  return (
    <div className="min-h-screen">
      <Seo
        title="Quiénes somos | Visualia, plataforma colombiana de menús digitales"
        description="Visualia es un producto de Boga Casa de Contenidos S.A.S., empresa colombiana con NIT 900.325.011-10 y sede en Bogotá. Plataforma de menús digitales y señalización para restaurantes."
        path="/nosotros"
        jsonLd={ORGANIZATION_JSON_LD}
      />
      <LandingHeader />

      <main className="px-6 pb-24 pt-32">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Quiénes somos
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Visualia</strong> (también conocida como Visualia
            Media) es un producto de{" "}
            <strong className="text-foreground">Boga Casa de Contenidos S.A.S.</strong>, empresa
            colombiana con NIT 900.325.011-10 y sede en Bogotá, Colombia.
          </p>

          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Hacemos una plataforma colombiana de menús digitales y señalización digital para
            restaurantes y negocios físicos: permite mostrar el menú en televisores, cambiar precios
            y promociones en segundos y administrar todas las pantallas de una o varias sedes desde
            un solo panel.
          </p>

          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Operamos en Colombia y atendemos negocios en todo el país, con más de 150 pantallas
            activas en restaurantes, cafés y comercios.
          </p>

          <section className="mt-12">
            <h2 className="text-2xl font-bold text-foreground">
              Una empresa colombiana detrás del producto
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Visualia</strong> es desarrollado y operado por{" "}
              <strong className="text-foreground">Boga Casa de Contenidos S.A.S.</strong>, una
              empresa constituida en Colombia con NIT 900.325.011-10 y sede en Bogotá, D.C. Toda la
              operación —desarrollo, soporte y facturación— se hace desde el país, para negocios
              físicos en Colombia.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-bold text-foreground">Datos de la empresa</h2>
            <dl className="mt-6 divide-y divide-border/40 rounded-2xl border border-border/50">
              {facts.map((f) => (
                <div
                  key={f.label}
                  className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <dt className="text-sm text-muted-foreground">{f.label}</dt>
                  <dd className="text-sm font-semibold text-foreground">{f.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-bold text-foreground">Contacto</h2>
            <ul className="mt-4 space-y-2 text-base text-muted-foreground">
              <li>
                Correo:{" "}
                <a className="text-foreground underline" href="mailto:hola@visualiamedia.com">
                  hola@visualiamedia.com
                </a>
              </li>
              <li>
                WhatsApp:{" "}
                <a
                  className="text-foreground underline"
                  href="https://wa.me/573163265696"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  +57 316 326 5696
                </a>
              </li>
              <li>Bogotá, Colombia</li>
              <li>
                <Link className="text-foreground underline" to="/acerca">
                  Más sobre el producto
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
