import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LocationEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  initialName: string;
  initialAddress?: string;
  initialLat?: number;
  initialLng?: number;
  onSaved: (data: { name: string; address: string; latitude: number; longitude: number }) => void;
}

const DEFAULT_LAT = 4.6097; // Bogotá
const DEFAULT_LNG = -74.0817;

export default function LocationEditorDialog({
  open,
  onOpenChange,
  locationId,
  initialName,
  initialAddress = "",
  initialLat,
  initialLng,
  onSaved,
}: LocationEditorDialogProps) {
  const [name, setName] = useState(initialName);
  const [address, setAddress] = useState(initialAddress);
  const [lat, setLat] = useState<number>(initialLat ?? DEFAULT_LAT);
  const [lng, setLng] = useState<number>(initialLng ?? DEFAULT_LNG);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setAddress(initialAddress);
      setLat(initialLat ?? DEFAULT_LAT);
      setLng(initialLng ?? DEFAULT_LNG);
      setSearchQuery(initialAddress || "");
    }
  }, [open, initialName, initialAddress, initialLat, initialLng]);

  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005}%2C${lat - 0.003}%2C${lng + 0.005}%2C${lat + 0.003}&layer=mapnik&marker=${lat}%2C${lng}`;

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
        { headers: { "Accept-Language": "es" } }
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const result = data[0];
        setLat(parseFloat(result.lat));
        setLng(parseFloat(result.lon));
        setAddress(result.display_name);
        toast({
          title: "Ubicación encontrada",
          description: result.display_name,
        });
      } else {
        toast({
          title: "Sin resultados",
          description: "No encontramos esa dirección. Intenta ser más específico.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error de búsqueda",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS no disponible",
        description: "Tu navegador no soporta geolocalización.",
        variant: "destructive",
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        toast({
          title: "Ubicación actual capturada",
          description: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        });
      },
      (err) => {
        toast({
          title: "No pudimos obtener tu ubicación",
          description: err.message,
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Falta el nombre de la sede", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const { error } = await supabase
      .from("locations")
      .update({
        name: name.trim(),
        address: address.trim() || null,
        latitude: lat,
        longitude: lng,
      })
      .eq("id", locationId);

    setIsSaving(false);

    if (error) {
      toast({
        title: "No se pudo guardar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Ubicación actualizada",
      description: "El mapa ahora mostrará la posición correcta.",
    });
    onSaved({ name: name.trim(), address: address.trim(), latitude: lat, longitude: lng });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar ubicación de la sede</DialogTitle>
          <DialogDescription>
            Ajusta dónde está físicamente la pantalla. Busca la dirección o usa tu ubicación actual.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="loc-name">Nombre de la sede</Label>
            <Input
              id="loc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Restaurante Centro"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loc-search">Buscar dirección</Label>
            <div className="flex gap-2">
              <Input
                id="loc-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Ej: Carrera 7 #45-12, Bogotá"
              />
              <Button onClick={handleSearch} disabled={isSearching} variant="secondary">
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleUseMyLocation}
              className="h-auto p-0 text-xs text-primary hover:underline"
            >
              <MapPin className="mr-1 h-3 w-3" />
              Usar mi ubicación actual (GPS)
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <iframe
              ref={iframeRef}
              key={`${lat}-${lng}`}
              title="Mapa de ubicación"
              width="100%"
              height="280"
              style={{ border: 0 }}
              loading="lazy"
              src={mapSrc}
            />
            <div className="border-t border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Coordenadas: {lat.toFixed(5)}, {lng.toFixed(5)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="loc-lat" className="text-xs">Latitud</Label>
              <Input
                id="loc-lat"
                type="number"
                step="0.000001"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="loc-lng" className="text-xs">Longitud</Label>
              <Input
                id="loc-lng"
                type="number"
                step="0.000001"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gradient-primary">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar ubicación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
