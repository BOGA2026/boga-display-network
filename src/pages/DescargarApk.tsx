import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Tv,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Copy,
  PlayCircle,
  Lock,
  FileCheck2,
  HelpCircle,
} from "lucide-react";
import { useState } from "react";
import Seo from "@/components/Seo";
import LegalFooter from "@/components/landing/LegalFooter";

// Metadatos del APK oficial. En CI reemplazar version/size/updatedAt/sha256 al publicar.
const APK = {
  url: "https://ovuhtroiuuqsiltqgqpp.supabase.co/storage/v1/object/public/downloads/visualia-firetv.apk",
  version: "1.0.0",
  sizeMB: 5.58,
  updatedAt: "2026-04-27",
  sha256: "891dd2e0ac5c87e7464c3f5391f031c3b220c239c0faac87cecab2cf01eb8573",
};

const compatibleDevices = [
  "Smart TV con Android TV o Google TV",
  "TV Box Android 8.0 o superior",
  "Amazon Fire TV Stick, Cube y Smart TV con Fire OS",
  "Chromecast con Google TV (4K y HD)",
];

const guidedSteps = [
  {
    title: "Abre 'Downloader' en tu TV",
    desc: "Es una app gratuita disponible en Google Play y la tienda de Fire TV. Búscala como 'Downloader by AFTVnews'.",
  },
  {
    title: "Escribe la dirección corta",
    desc: "En el campo URL de Downloader escribe la dirección que aparece en pantalla y presiona 'Go'.",
  },
  {
    title: "Acepta instalar Visualia",
    desc: "Cuando termine la descarga, la TV te preguntará si quieres instalar. Confirma y abre la app.",
  },
  {
    title: "Conecta tu pantalla",
    desc: "Visualia mostrará un código de 6 caracteres. Ingrésalo en tu panel: Pantallas → Agregar pantalla.",
  },
];

export default function DescargarApk() {
  const [copied, setCopied] = useState(false);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(APK.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen text-foreground">
      <Seo
        title="Instalar Visualia en tu TV | Android TV, Google TV y Fire TV"
        description="Instalá Visualia en tu Smart TV en menos de 5 minutos. Guía paso a paso, app oficial verificada y soporte humano para dueños de restaurantes."
        path="/descargar-apk"
      />

      <main className="container mx-auto max-w-5xl px-4 py-12 md:py-16">
        {/* HERO */}
        <header className="text-center mb-10">
          <Badge variant="secondary" className="mb-4">
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
            App oficial firmada · v{APK.version}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Instalá Visualia en tu TV
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Convertí cualquier televisor moderno en un menú digital profesional
            para tu negocio. Sin computador, sin cables extra, en menos de 5
            minutos.
          </p>
        </header>

        {/* Compatibilidad */}
        <Card className="p-6 mb-8 border-border">
          <div className="flex items-start gap-3 mb-4">
            <Tv className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-lg">¿Tu TV es compatible?</h2>
              <p className="text-sm text-muted-foreground">
                Visualia funciona en la mayoría de televisores inteligentes
                fabricados desde 2019.
              </p>
            </div>
          </div>
          <ul className="grid sm:grid-cols-2 gap-2">
            {compatibleDevices.map((d) => (
              <li key={d} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* OPCIÓN A: Play Store */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              A
            </span>
            <h2 className="text-xl font-semibold">Opción recomendada · Google Play</h2>
          </div>
          <Card className="p-6 border-border">
            <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
              <div>
                <p className="font-medium mb-1">
                  Buscá "Visualia" en la Play Store de tu Android TV
                </p>
                <p className="text-sm text-muted-foreground">
                  La forma más fácil y segura. Actualizaciones automáticas y
                  cero configuración.
                </p>
              </div>
              <Badge variant="outline" className="w-fit">
                Próximamente en Play Store
              </Badge>
            </div>
          </Card>
        </section>

        {/* OPCIÓN B: Instalación guiada */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              B
            </span>
            <h2 className="text-xl font-semibold">Instalación guiada con Downloader</h2>
          </div>
          <Card className="p-6 border-border">
            <div className="grid md:grid-cols-2 gap-6 items-center mb-6">
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-xl">
                  <QRCodeSVG value={APK.url} size={180} level="H" />
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Escaneá con tu celular para ver esta página en la TV
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Dirección para Downloader:</p>
                <div className="flex gap-2 mb-3">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-xs break-all">
                    {APK.url}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyUrl}
                    aria-label="Copiar dirección"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Escribe esta dirección en Downloader (o pídele ayuda a
                  soporte, la ingresamos contigo).
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <p className="font-medium mb-4 flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-primary" />
                Video corto (60 segundos) del proceso completo
              </p>
              <div className="aspect-video rounded-lg bg-muted flex items-center justify-center border border-border mb-6">
                <p className="text-sm text-muted-foreground text-center px-4">
                  Video tutorial en preparación.<br />
                  Mientras tanto, escríbenos por WhatsApp y te acompañamos en vivo.
                </p>
              </div>

              <ol className="space-y-4">
                {guidedSteps.map((step, i) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium mb-1">{step.title}</p>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Card>
        </section>

        {/* OPCIÓN C: Descarga directa */}
        <section aria-labelledby="apk-title" className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center justify-center h-7 w-7 rounded-full bg-muted text-foreground text-sm font-semibold border border-border">
              C
            </span>
            <h2 id="apk-title" className="text-xl font-semibold">
              Descarga directa <span className="text-muted-foreground font-normal text-base">· opción avanzada</span>
            </h2>
          </div>
          <Card className="p-6 border-border">
            <p className="text-sm text-muted-foreground mb-4">
              Para técnicos o instaladores. Descargá el archivo de instalación
              (APK) y transferilo a la TV con USB o Downloader.
            </p>

            <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
              <a
                href={APK.url}
                download
                data-analytics="apk_download"
                type="application/vnd.android.package-archive"
              >
                <Download className="mr-2 h-5 w-5" />
                Descargar Visualia para TV v{APK.version} ({APK.sizeMB} MB)
              </a>
            </Button>

            <div className="mt-5 grid sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-start gap-2">
                <FileCheck2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Versión</p>
                  <p className="text-muted-foreground">{APK.version} · {APK.sizeMB} MB</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Servido por HTTPS</p>
                  <p className="text-muted-foreground">Actualizado: {APK.updatedAt}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Verificación</p>
                  <p className="text-muted-foreground">SHA-256 más abajo</p>
                </div>
              </div>
            </div>

            <details className="mt-5 group">
              <summary className="cursor-pointer text-sm font-medium flex items-center gap-2 hover:text-primary">
                <HelpCircle className="h-4 w-4" />
                Ver hash SHA-256 (verificación de integridad)
              </summary>
              <div className="mt-3">
                <code className="block bg-muted px-3 py-2 rounded text-xs break-all font-mono">
                  {APK.sha256}
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  En Mac/Linux: <code className="bg-muted px-1 rounded">shasum -a 256 visualia-firetv.apk</code>.
                  Debe coincidir con el hash publicado arriba.
                </p>
              </div>
            </details>
          </Card>
        </section>

        {/* Señales de confianza */}
        <Card className="p-6 mb-10 border-border bg-muted/30">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Por qué es seguro instalar Visualia
          </h3>
          <ul className="grid sm:grid-cols-2 gap-3 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>App oficial de <strong>Boga Casa de Contenidos S.A.S.</strong> (NIT 900.325.011-10).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Firmada digitalmente y servida por HTTPS desde nuestros servidores.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Hash SHA-256 público para verificar la integridad del archivo.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Solo lee y muestra el contenido que tú programas desde el panel.</span>
            </li>
          </ul>
        </Card>

        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            ¿Prefieres que lo instalemos por ti? Es gratis.
          </p>
          <Button asChild size="lg">
            <a href="/#contacto">
              Hablar con un experto <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </main>
      <LegalFooter />
    </div>
  );
}
