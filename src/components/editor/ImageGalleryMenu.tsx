import React, { useRef, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Cloud, Monitor, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type GalleryImage = { id: string; name: string; url: string };
type Source = "cloud" | "device" | "presets";

const PRESET_IMAGES: GalleryImage[] = [
  { id: "p1", name: "Gradient Azul", url: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=80" },
  { id: "p2", name: "Gradient Rosa", url: "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80" },
  { id: "p3", name: "Textura Madera", url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80" },
  { id: "p4", name: "Mármol", url: "https://images.unsplash.com/photo-1566041510394-cf7c8fe21800?w=800&q=80" },
  { id: "p5", name: "Neon Lights", url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80" },
  { id: "p6", name: "Abstracto", url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80" },
];

interface Props {
  onInsertImage: (url: string, name: string) => void;
}

export default function ImageGalleryMenu({ onInsertImage }: Props) {
  const [source, setSource] = useState<Source>("cloud");
  const [cloud, setCloud] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const loadCloud = async () => {
    try {
      setLoading(true);
      setError("");
      const { data, error: err } = await supabase
        .from("content")
        .select("id, name, file_url")
        .eq("type", "image")
        .order("created_at", { ascending: false })
        .limit(50);
      if (err) throw err;
      setCloud(
        (data ?? [])
          .filter((d) => d.file_url)
          .map((d) => ({ id: d.id, name: d.name, url: d.file_url! }))
      );
    } catch {
      setError("No se pudo cargar contenido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCloud();
  }, []);

  const onPickDevice = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localURL = URL.createObjectURL(file);
    onInsertImage(localURL, file.name.replace(/\.[^/.]+$/, ""));
  };

  const tabs: { id: Source; label: string; icon: typeof Cloud }[] = [
    { id: "cloud", label: "Nube", icon: Cloud },
    { id: "device", label: "Equipo", icon: Monitor },
    { id: "presets", label: "Presets", icon: Sparkles },
  ];

  return (
    <div className="w-72 rounded-lg border border-border bg-card p-3 shadow-lg text-sm">
      <p className="mb-2 font-semibold text-foreground">Galería de imágenes</p>

      {/* Tabs */}
      <div className="mb-3 flex gap-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              source === id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
            onClick={() => {
              setSource(id);
              if (id === "cloud") loadCloud();
            }}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {error && <p className="text-xs text-destructive mb-2">{error}</p>}

      {/* Device */}
      {source === "device" && !loading && (
        <div className="space-y-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-md border border-dashed border-border py-6 text-center text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
          >
            Seleccionar archivo
          </button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
            onChange={onPickDevice}
          />
        </div>
      )}

      {/* Cloud */}
      {source === "cloud" && !loading && (
        <Grid items={cloud} onPick={(img) => onInsertImage(img.url, img.name)} />
      )}

      {/* Presets */}
      {source === "presets" && !loading && (
        <Grid items={PRESET_IMAGES} onPick={(img) => onInsertImage(img.url, img.name)} />
      )}
    </div>
  );
}

function Grid({
  items,
  onPick,
}: {
  items: GalleryImage[];
  onPick: (img: GalleryImage) => void;
}) {
  if (!items.length)
    return <p className="py-4 text-center text-muted-foreground text-xs">Sin imágenes</p>;

  return (
    <div className="grid grid-cols-3 gap-1.5 max-h-60 overflow-y-auto">
      {items.map((img) => (
        <button
          key={img.id}
          onClick={() => onPick(img)}
          className="group overflow-hidden rounded-md border border-border text-left hover:border-primary/50 transition-colors"
          title={img.name}
        >
          <img
            src={img.url}
            alt={img.name}
            className="h-16 w-full object-cover group-hover:scale-105 transition-transform"
            loading="lazy"
          />
          <div className="truncate px-1 py-0.5 text-[10px] text-muted-foreground">
            {img.name}
          </div>
        </button>
      ))}
    </div>
  );
}
