/**
 * GlobalCommands — registers app-wide commands into the ⌘K palette.
 * Mounted once inside AppShell.
 */
import { useNavigate } from "react-router-dom";
import { useRegisterCommand } from "@/hooks/useCommandRegistry";
import { Map, QrCode, Sparkles, Monitor, Send } from "lucide-react";
import { useMemo } from "react";

export function GlobalCommands() {
  const navigate = useNavigate();

  const items = useMemo(
    () => [
      {
        id: "nav-mapa",
        group: "Navegación" as const,
        label: "Ir a Mapa",
        icon: <Map className="mr-2 h-4 w-4" />,
        keywords: ["mapa", "ubicacion"],
        onSelect: () => navigate("/dashboard/mapa"),
      },
      {
        id: "nav-qr",
        group: "Navegación" as const,
        label: "Ir a QR",
        icon: <QrCode className="mr-2 h-4 w-4" />,
        keywords: ["qr", "codigo"],
        onSelect: () => navigate("/dashboard/qr"),
      },
      {
        id: "nav-pantallas",
        group: "Navegación" as const,
        label: "Ir a Pantallas",
        icon: <Monitor className="mr-2 h-4 w-4" />,
        onSelect: () => navigate("/dashboard/pantallas"),
      },
      {
        id: "action-crear-ia",
        group: "Acciones" as const,
        label: "Crear con IA",
        icon: <Sparkles className="mr-2 h-4 w-4" />,
        onSelect: () => navigate("/dashboard/generar-ia"),
      },
      {
        id: "action-pair",
        group: "Acciones" as const,
        label: "Emparejar pantalla",
        icon: <Send className="mr-2 h-4 w-4" />,
        onSelect: () => navigate("/dashboard/pantallas?pair=1"),
      },
    ],
    [navigate],
  );

  useRegisterCommand(items);
  return null;
}
