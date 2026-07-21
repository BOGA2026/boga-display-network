import { forwardRef, useRef } from "react";

interface CodeInputProps {
  value: string; // 6 chars
  onChange: (next: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

/**
 * 6-cell numeric OTP input with iOS-style auto-advance, backspace-back,
 * paste-of-full-code support, and a neon-violet caret ring.
 */
export const CodeInput = forwardRef<HTMLInputElement, CodeInputProps>(
  ({ value, onChange, disabled, error, autoFocus }, _ref) => {
    const inputs = useRef<Array<HTMLInputElement | null>>([]);

    const chars = value.padEnd(6, " ").split("").slice(0, 6);

    const setChar = (idx: number, ch: string) => {
      const arr = value.padEnd(6, " ").split("");
      arr[idx] = ch;
      onChange(arr.join("").replace(/\s+$/g, ""));
    };

    const focusAt = (i: number) => {
      const el = inputs.current[Math.max(0, Math.min(5, i))];
      el?.focus();
      el?.select();
    };

    return (
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {chars.map((ch, i) => {
          const filled = ch.trim().length > 0;
          return (
            <input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              autoFocus={autoFocus && i === 0}
              disabled={disabled}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={ch.trim()}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                if (!raw) {
                  setChar(i, "");
                  return;
                }
                // Support paste-of-many via onChange (browsers sometimes fire this)
                if (raw.length > 1) {
                  const clean = raw.slice(0, 6 - i);
                  const arr = value.padEnd(6, " ").split("");
                  for (let k = 0; k < clean.length; k++) arr[i + k] = clean[k];
                  onChange(arr.join("").replace(/\s+$/g, ""));
                  focusAt(Math.min(5, i + clean.length));
                  return;
                }
                setChar(i, raw);
                if (i < 5) focusAt(i + 1);
              }}
              onKeyDown={(e) => {
                if (e.key === "Backspace") {
                  if (!chars[i].trim() && i > 0) {
                    e.preventDefault();
                    setChar(i - 1, "");
                    focusAt(i - 1);
                  }
                } else if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  focusAt(i - 1);
                } else if (e.key === "ArrowRight") {
                  e.preventDefault();
                  focusAt(i + 1);
                }
              }}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                if (!text) return;
                e.preventDefault();
                const arr = "      ".split("");
                for (let k = 0; k < text.length; k++) arr[k] = text[k];
                onChange(arr.join("").replace(/\s+$/g, ""));
                focusAt(Math.min(5, text.length));
              }}
              className={[
                "h-14 w-11 sm:h-16 sm:w-14 rounded-xl text-center font-mono text-3xl sm:text-4xl font-bold",
                "bg-secondary/30 border transition-all outline-none caret-primary",
                error
                  ? "border-destructive/60 text-destructive"
                  : filled
                    ? "border-primary/50 text-primary shadow-[0_0_24px_-6px_hsl(var(--primary)/0.6)]"
                    : "border-border/40 text-foreground",
                "focus:border-primary focus:shadow-[0_0_28px_-6px_hsl(var(--primary)/0.8)]",
                disabled ? "opacity-50 cursor-not-allowed" : "",
              ].join(" ")}
              aria-label={`Dígito ${i + 1} de 6`}
            />
          );
        })}
      </div>
    );
  }
);

CodeInput.displayName = "CodeInput";
