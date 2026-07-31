/**
 * BaselineCommands — registra TODOS los comandos globales del ⌘K.
 *
 * Única fuente: `buildCommands()`. Antes había dos listas paralelas
 * (aquí + GlobalCommands), lo que generaba duplicados como
 * "Ir a Pantallas" y "Pantallas".
 */
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Upload,
  Sparkles,
  PenTool,
  ListVideo,
  QrCode,
  CircleHelp,
  Command as CommandIcon,
} from "lucide-react";
import { buildCommands, type CommandDef } from "@/lib/commands";
import { useRegisterCommand, type CommandItem } from "@/hooks/useCommandRegistry";
import { useLocationContext } from "@/context/LocationContext";
import { SUPPORT_WHATSAPP_URL } from "@/config/support";

const ICONS: Record<string, typeof Plus> = {
  plus: Plus,
  upload: Upload,
  sparkles: Sparkles,
  pen: PenTool,
  list: ListVideo,
  qr: QrCode,
  help: CircleHelp,
};

function iconFor(cmd: CommandDef) {
  const Icon = cmd.nav?.icon ?? (cmd.iconKey ? ICONS[cmd.iconKey] : undefined) ?? CommandIcon;
  return <Icon className="mr-2 h-4 w-4" />;
}

export function BaselineCommands() {
  const navigate = useNavigate();
  const { locations, setActiveLocationId } = useLocationContext();

  const items = useMemo<CommandItem[]>(
    () =>
      buildCommands({
        navigate,
        locations,
        setActiveLocationId,
        supportUrl: SUPPORT_WHATSAPP_URL,
      }).map((cmd) => ({
        id: cmd.id,
        label: cmd.label,
        group: cmd.group,
        keywords: cmd.keywords,
        priority: cmd.priority,
        icon: iconFor(cmd),
        onSelect: cmd.run,
      })),
    [navigate, locations, setActiveLocationId],
  );

  useRegisterCommand(items);
  return null;
}

export default BaselineCommands;
