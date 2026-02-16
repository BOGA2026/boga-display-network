/**
 * Global premium background with ambient orbs, grain texture, and floating particles.
 * Use variant="default" for public pages, variant="dashboard" for authenticated areas.
 */
const orbConfigs = [
  { size: 500, top: '-5%', left: '-8%', bg: 'hsl(270 100% 40%)', delay: '0s', duration: '18s', anim: 'orb-drift' },
  { size: 400, top: '15%', right: '-10%', bg: 'hsl(290 100% 35%)', delay: '0s', duration: '22s', anim: 'orb-drift-alt' },
  { size: 600, top: '45%', left: '10%', bg: 'hsl(265 100% 30%)', delay: '4s', duration: '24s', anim: 'orb-drift' },
  { size: 350, top: '70%', right: '5%', bg: 'hsl(280 100% 35%)', delay: '8s', duration: '18s', anim: 'orb-drift-alt' },
  { size: 450, bottom: '5%', left: '30%', bg: 'hsl(270 100% 28%)', delay: '12s', duration: '20s', anim: 'orb-drift' },
];

const dashboardOrbs = [
  { size: 400, top: '-10%', left: '-12%', bg: 'hsl(270 100% 30%)', delay: '0s', duration: '22s', anim: 'orb-drift' },
  { size: 300, top: '50%', right: '-8%', bg: 'hsl(280 100% 25%)', delay: '6s', duration: '26s', anim: 'orb-drift-alt' },
  { size: 350, bottom: '10%', left: '20%', bg: 'hsl(265 100% 22%)', delay: '10s', duration: '24s', anim: 'orb-drift' },
];

interface PremiumBackgroundProps {
  variant?: 'default' | 'dashboard';
  children: React.ReactNode;
  className?: string;
}

const PremiumBackground = ({ variant = 'default', children, className = '' }: PremiumBackgroundProps) => {
  const isDashboard = variant === 'dashboard';
  const orbs = isDashboard ? dashboardOrbs : orbConfigs;
  const particleCount = isDashboard ? 3 : 6;

  const bgGradient = isDashboard
    ? 'linear-gradient(180deg, hsl(260 30% 5%) 0%, hsl(260 25% 7%) 50%, hsl(260 30% 5%) 100%)'
    : 'linear-gradient(180deg, hsl(260 35% 4%) 0%, hsl(265 30% 9%) 20%, hsl(260 25% 6%) 40%, hsl(270 30% 10%) 60%, hsl(260 28% 7%) 80%, hsl(260 35% 4%) 100%)';

  return (
    <div className={`relative min-h-screen grain-overlay ${className}`} style={{ background: bgGradient }}>
      {/* Ambient light orbs */}
      {orbs.map((orb, i) => (
        <div
          key={i}
          className="ambient-orb"
          style={{
            width: orb.size,
            height: orb.size,
            top: orb.top,
            left: orb.left,
            right: orb.right,
            bottom: orb.bottom,
            background: orb.bg,
            animationName: orb.anim,
            animationDelay: orb.delay,
            animationDuration: orb.duration,
            opacity: isDashboard ? 0.06 : undefined,
          } as React.CSSProperties}
        />
      ))}

      {/* Floating particles */}
      {[...Array(particleCount)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            width: 2 + (i % 3),
            height: 2 + (i % 3),
            left: `${12 + i * 15}%`,
            bottom: '-2%',
            animationDuration: `${20 + i * 5}s`,
            animationDelay: `${i * 3}s`,
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default PremiumBackground;
