import { forwardRef, useRef } from "react";

interface CodeInputProps {
  value: string; // hasta 6 caracteres ya normalizados (A-Z0-9)
  onChange: (next: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

/** Deja solo A-Z y 0-9: descarta guiones, espacios y pasa a mayúsculas. */
export function normalizePairingCode(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
}

/**
 * Casillas para el código de 6 caracteres que muestra el televisor.
 * Acepta letras y números, con o sin guion, en mayúsculas o minúsculas:
 * "k7m-p42" y "K7MP42" entran igual. Pegar el código completo también funciona.
 */
export const CodeInput = forwardRef<HTMLInputElement, CodeInputProps>(
  ({ value, onChange, disabled, error, autoFocus }, _ref) => {
    const inputs = useRef<Array<HTMLInputElement | null>>([]);

    const chars = value.padEnd(6, " ").split("").slice(0, 6);

    const setChar = (idx: number, ch: string) => {
      const arr = value.padEnd(6, " ").split("");
      arr[idx] = ch || " ";
      onChange(arr.join("").replace(/\s+$/g, ""));
    };

    const focusAt = (i: number) => {
      const el = inputs.current[Math.max(0, Math.min(5, i))];
      el?.focus();
      el?.select();
    };

    const fillFrom = (start: number, text: string) => {
      const clean = normalizePairingCode(text).slice(0, 6 - start);
      if (!clean) return;
      const arr = value.padEnd(6, " ").split("");
      for (let k = 0; k < clean.length; k++) arr[start + k] = clean[k];
      onChange(arr.join("").replace(/\s+$/g, ""));
      focusAt(Math.min(5, start + clean.length));
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
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="one-time-code"
              spellCheck={false}
              maxLength={1}
              value={ch.trim()}
              onChange={(e) => {
                const raw = normalizePairingCode(e.target.value);
                if (!raw) {
                  setChar(i, "");
                  return;
                }
                if (raw.length > 1) {
                  fillFrom(i, raw);
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
                const text = e.clipboardData.getData("text");
                if (!normalizePairingCode(text)) return;
                e.preventDefault();
                fillFrom(0, text);
              }}
              className={[
                "h-14 w-11 sm:h-16 sm:w-14 rounded-xl text-center font-mono text-3xl sm:text-4xl font-bold uppercase",
                "bg-secondary/30 border transition-all outline-none caret-primary",
                error
                  ? "border-destructive/60 text-destructive"
                  : filled
                    ? "border-primary/50 text-primary shadow-[0_0_24px_-6px_hsl(var(--primary)/0.6)]"
                    : "border-border/40 text-foreground",
                "focus:border-primary focus:shadow-[0_0_28px_-6px_hsl(var(--primary)/0.8)]",
                disabled ? "opacity-50 cursor-not-allowed" : "",
              ].join(" ")}
              aria-label={`Carácter ${i + 1} de 6 del código`}
            />
          );
        })}
      </div>
    );
  }
);

CodeInput.displayName = "CodeInput";
