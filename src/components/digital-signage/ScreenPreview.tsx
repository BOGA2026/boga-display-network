import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ScreenData } from "@/data/mockScreens";

export default function ScreenPreview({ screen }: { screen: ScreenData }) {
  const [deviceCode, setDeviceCode] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDevice() {
      const { data } = await supabase
        .from("devices")
        .select("device_code")
        .eq("screen_id", screen.id)
        .eq("status", "paired")
        .order("paired_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setDeviceCode(data.device_code);
    }
    fetchDevice();
  }, [screen.id]);

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <h3 className="text-sm font-semibold text-foreground">Reproduciendo ahora</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {deviceCode ? `Dispositivo: ${deviceCode}` : "16:9"}
        </span>
      </div>
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        {deviceCode ? (
          // The player itself already applies the rotation transform — render iframe flat
          // so the dashboard preview matches exactly what the Fire TV displays.
          <iframe
            src={`/player/${deviceCode}`}
            title="Vista en vivo"
            sandbox="allow-scripts allow-same-origin"
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <>
            <img
              src={screen.currentContent.thumbnailUrl}
              alt={screen.currentContent.assetName}
              className="h-full w-full object-cover"
              style={{ transform: `rotate(${screen.rotation ?? 0}deg)` }}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/80 to-transparent p-4">
              <p className="text-sm font-semibold text-foreground">{screen.currentContent.assetName}</p>
              <p className="text-xs text-muted-foreground">Sin dispositivo vinculado</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
