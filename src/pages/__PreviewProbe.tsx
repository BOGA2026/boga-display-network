import ScreenPreviewFrame from "@/components/content/ScreenPreviewFrame";
export default function PreviewProbe() {
  return (
    <div className="min-h-dvh bg-background p-8">
      <div className="mx-auto max-w-3xl surface-elevated rounded-xl border border-border/30 p-6">
        <ScreenPreviewFrame
          item={{
            id: "probe",
            name: "Promo vertical",
            type: "video",
            file_url: "/probe.mp4",
            thumbnail_url: null,
            duration_seconds: 20,
            file_size_bytes: 38_000_000,
            width: 1080,
            height: 1920,
          }}
        />
      </div>
    </div>
  );
}
