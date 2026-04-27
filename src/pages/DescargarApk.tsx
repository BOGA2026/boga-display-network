import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Tv, Smartphone, ShieldCheck, ArrowRight } from "lucide-react";
import { useEffect } from "react";

// URL pública directa de la APK. Reemplaza por tu link final cuando subas el archivo.
const APK_URL = "https://visualiamedia.com/downloads/visualia-firetv.apk";
const APK_VERSION = "1.0.0";

const steps = [
  {
    icon: ShieldCheck,
    title: "1. Activar apps desconocidas",
    desc: "En tu Fire TV ve a: Ajustes → Mi Fire TV → Opciones de desarrollador → Instalar apps desconocidas. Activa la app 'Downloader'.",
  },
  {
    icon: Smartphone,
    title: "2. Instalar Downloader",
    desc: "Desde la tienda de apps de tu Fire TV, busca e instala la app gratuita 'Downloader' de AFTVnews.",
  },
  {
    icon: Download,
    title: "3. Descargar Visualia",
    desc: "Abre Downloader, escribe la URL que ves en esta página (o escanea el QR) y presiona 'Go'. Acepta instalar cuando termine la descarga.",
  },
  {
    icon: Tv,
    title: "4. Vincular pantalla",
    desc: "Al abrir Visualia verás un código de 6 dígitos. Ingrésalo en tu panel: Pantallas → Agregar pantalla.",
  },
];

export default function DescargarApk() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Descargar app Fire TV | Visualia</title>
        <meta
          name="description"
          content="Instala Visualia en tu Amazon Fire TV en 4 pasos. Descarga la APK oficial y conecta tu pantalla en minutos."
        />
      </Helmet>

      <main className="container mx-auto max-w-5xl px-4 py-16">
        <header className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            Fire TV · v{APK_VERSION}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Instala Visualia en tu Fire TV
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Convierte cualquier televisor con Amazon Fire TV en una pantalla
            profesional para tu negocio. Sin computador, sin cables extra.
          </p>
        </header>

        <Card className="p-8 mb-10 bg-card/50 border-border">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG value={APK_URL} size={200} level="H" />
              </div>
              <p className="text-sm text-muted-foreground mt-3 text-center">
                Escanea para abrir el link de descarga
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2">
                Link directo de descarga
              </h2>
              <code className="block bg-muted px-3 py-2 rounded text-sm break-all mb-4">
                {APK_URL}
              </code>
              <Button asChild size="lg" className="w-full">
                <a href={APK_URL} download>
                  <Download className="mr-2 h-5 w-5" />
                  Descargar APK
                </a>
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                Tamaño aproximado: 3 MB · Compatible con Fire TV Stick, Cube y
                Smart TV con Fire OS.
              </p>
            </div>
          </div>
        </Card>

        <section>
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Cómo instalarla (4 pasos)
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {steps.map((s) => (
              <Card key={s.title} className="p-6 bg-card/50 border-border">
                <s.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            ¿Necesitas ayuda con la instalación?
          </p>
          <Button variant="outline" asChild>
            <a href="/#contacto">
              Hablar con un experto <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </main>
    </div>
  );
}
