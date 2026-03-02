import type { ScreenData } from "@/data/mockScreens";

export default function ScreenPreview({ screen }: { screen: ScreenData }) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h3 className="text-sm font-semibold text-foreground">Now playing</h3>
        <span className="text-xs text-muted-foreground">{screen.currentContent.aspectRatio}</span>
      </div>
      <div className="relative aspect-video w-full bg-muted">
        <img
          src={screen.currentContent.thumbnailUrl}
          alt={screen.currentContent.assetName}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/80 to-transparent p-4">
          <p className="text-sm font-semibold text-foreground">{screen.currentContent.assetName}</p>
        </div>
      </div>
    </div>
  );
}
