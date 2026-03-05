import React from "react";
import { TextStyle } from "./EditorTextTools";
import {
  TEXT_PRESETS,
  PRESET_LABELS,
  type TextPresetKey,
} from "./TextPresets";

type Props = {
  onApply: (style: TextStyle) => void;
};

const PRESET_KEYS = Object.keys(TEXT_PRESETS) as TextPresetKey[];

export function PresetPicker({ onApply }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Presets de texto
      </p>
      <div className="grid grid-cols-2 gap-2">
        {PRESET_KEYS.map((key) => {
          const preset = TEXT_PRESETS[key];
          const bg =
            preset.bannerStyle === "solid"
              ? preset.bannerColor
              : preset.bannerStyle === "gradient"
              ? `linear-gradient(90deg, ${preset.bannerFrom}, ${preset.bannerTo})`
              : "transparent";

          return (
            <button
              key={key}
              onClick={() => onApply({ ...preset })}
              className="group relative flex flex-col items-start gap-1 rounded-lg border border-border p-2 text-left transition-colors hover:border-primary hover:bg-accent/50"
            >
              <div
                className="w-full rounded px-2 py-1 text-xs font-bold truncate"
                style={{
                  background: bg,
                  color: preset.color,
                  fontFamily: preset.fontFamily,
                  borderRadius: Math.min(preset.borderRadius, 8),
                }}
              >
                {preset.content.slice(0, 16)}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {PRESET_LABELS[key]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
