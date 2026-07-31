import { useState, useId, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export type FeatureCardProps = {
  icon: ReactNode;
  title: string;
  explanation: string;
};

export function FeatureCard({ icon, title, explanation }: FeatureCardProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="feature-card group" data-open={open}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="feature-trigger v-card v-card-interactive flex w-full items-center gap-4 px-5 py-4 hover-lift min-h-11"
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/15 neon-border">
          {icon}
        </div>
        <span className="flex-1 text-sm font-medium text-foreground">
          {title}
        </span>
        <ChevronDown
          className="chevron h-4 w-4 text-muted-foreground transition-transform duration-300"
          data-open={open}
          aria-hidden="true"
        />
      </button>
      <div
        id={panelId}
        role="region"
        className="feature-panel grid transition-all duration-300 ease-out"
        data-open={open}
        style={{
          gridTemplateRows: open ? "1fr" : "0fr",
        }}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-4 pt-3 text-sm leading-relaxed text-muted-foreground">
            {explanation}
          </p>
        </div>
      </div>
    </div>
  );
}
