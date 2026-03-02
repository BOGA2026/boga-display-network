import { useState, useCallback, useEffect, useRef } from "react";
import {
  Camera,
  RefreshCw,
  RotateCcw,
  Trash2,
  Tag,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import type { ScreenData } from "@/data/mockScreens";

interface Props {
  screen: ScreenData;
  onChange: (patch: Partial<ScreenData>) => void;
  onDelete: () => void;
}

function useDebounce<T>(value: T, ms = 500): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function ScreenSettingsPanel({ screen, onChange, onDelete }: Props) {
  const [name, setName] = useState(screen.name);
  const debouncedName = useDebounce(name, 800);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (debouncedName !== screen.name) {
      onChange({ name: debouncedName });
      toast({ title: "Screen name saved" });
    }
  }, [debouncedName]);

  const [tagInput, setTagInput] = useState("");
  const addTag = useCallback(() => {
    const t = tagInput.trim().toLowerCase();
    if (t && !screen.tags.includes(t)) {
      onChange({ tags: [...screen.tags, t] });
    }
    setTagInput("");
  }, [tagInput, screen.tags, onChange]);

  return (
    <aside className="glass-card rounded-xl space-y-5 p-4">
      <h3 className="text-sm font-semibold text-foreground">Screen settings</h3>

      {/* Name */}
      <fieldset className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Screen name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-secondary border-border"
        />
      </fieldset>

      {/* Volume */}
      <fieldset className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Volume – {screen.volume}%</label>
        <Slider
          value={[screen.volume]}
          max={100}
          step={1}
          onValueChange={([v]) => onChange({ volume: v })}
        />
      </fieldset>

      {/* Adaptive brightness */}
      <fieldset className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground">Adaptive brightness</label>
        <Switch
          checked={screen.adaptiveBrightness}
          onCheckedChange={(v) => onChange({ adaptiveBrightness: v })}
        />
      </fieldset>

      {/* Brightness */}
      <fieldset className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Brightness – {screen.brightness}%</label>
        <Slider
          value={[screen.brightness]}
          max={100}
          step={1}
          onValueChange={([v]) => onChange({ brightness: v })}
          disabled={screen.adaptiveBrightness}
        />
      </fieldset>

      {/* Sleep mode */}
      <fieldset className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground">Sleep mode</label>
        <Switch
          checked={screen.sleepMode}
          onCheckedChange={(v) => onChange({ sleepMode: v })}
        />
      </fieldset>

      {/* Timezone */}
      <fieldset className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Timezone</label>
        <Select
          value={screen.timezone}
          onValueChange={(v) => onChange({ timezone: v })}
        >
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="America/Bogota">America/Bogota</SelectItem>
            <SelectItem value="America/New_York">America/New_York</SelectItem>
            <SelectItem value="America/Chicago">America/Chicago</SelectItem>
            <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
            <SelectItem value="Europe/London">Europe/London</SelectItem>
            <SelectItem value="Europe/Madrid">Europe/Madrid</SelectItem>
          </SelectContent>
        </Select>
      </fieldset>

      {/* Orientation */}
      <fieldset className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Orientation</label>
        <Select
          value={screen.orientation}
          onValueChange={(v) => onChange({ orientation: v as "landscape" | "portrait" })}
        >
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="landscape">Landscape</SelectItem>
            <SelectItem value="portrait">Portrait</SelectItem>
          </SelectContent>
        </Select>
      </fieldset>

      {/* Display mode */}
      <fieldset className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Display mode</label>
        <Select
          value={screen.displayMode}
          onValueChange={(v) => onChange({ displayMode: v as "fill" | "fit" | "stretch" })}
        >
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fill">Fill</SelectItem>
            <SelectItem value="fit">Fit</SelectItem>
            <SelectItem value="stretch">Stretch</SelectItem>
          </SelectContent>
        </Select>
      </fieldset>

      {/* Auto reboot */}
      <fieldset className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground">Auto reboot</label>
        <Switch
          checked={screen.autoReboot}
          onCheckedChange={(v) => onChange({ autoReboot: v })}
        />
      </fieldset>

      {/* Tags */}
      <fieldset className="space-y-1.5">
        <label className="text-xs text-muted-foreground flex items-center gap-1">
          <Tag className="h-3 w-3" /> Tags
        </label>
        <div className="flex flex-wrap gap-1.5">
          {screen.tags.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1 text-xs">
              {t}
              <button
                onClick={() => onChange({ tags: screen.tags.filter((x) => x !== t) })}
                aria-label={`Remove tag ${t}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-1.5">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTag()}
            placeholder="Add tag…"
            className="h-8 bg-secondary border-border text-xs"
          />
          <Button variant="outline" size="sm" onClick={addTag} className="h-8">
            Add
          </Button>
        </div>
      </fieldset>

      {/* Actions */}
      <div className="space-y-2 pt-2 border-t border-border">
        <Button variant="outline" size="sm" className="w-full justify-start gap-2">
          <Camera className="h-4 w-4" /> Take screenshot
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start gap-2">
          <RefreshCw className="h-4 w-4" /> Sync data
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start gap-2">
          <RotateCcw className="h-4 w-4" /> Recovery screen
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="w-full justify-start gap-2">
              <Trash2 className="h-4 w-4" /> Delete screen
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete screen?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove <strong>{screen.name}</strong> and all its schedule data.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </aside>
  );
}
