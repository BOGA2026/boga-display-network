interface InitialsAvatarProps {
  name: string;
  size?: number;
  className?: string;
  /** HSL background; defaults to brand purple. */
  background?: string;
  color?: string;
  ariaLabel?: string;
}

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Local, dependency-free avatar. Renders initials on a solid background —
 * no network request, no third-party dependency (replaces ui-avatars.com).
 */
export default function InitialsAvatar({
  name,
  size = 40,
  className = "",
  background = "hsl(262 83% 45%)",
  color = "#ffffff",
  ariaLabel,
}: InitialsAvatarProps) {
  const initials = initialsFrom(name);
  return (
    <span
      role="img"
      aria-label={ariaLabel ?? `Avatar de ${name}`}
      className={`inline-flex items-center justify-center rounded-full font-semibold select-none ${className}`}
      style={{
        width: size,
        height: size,
        background,
        color,
        fontSize: Math.round(size * 0.4),
        lineHeight: 1,
        letterSpacing: "0.02em",
      }}
    >
      {initials}
    </span>
  );
}
