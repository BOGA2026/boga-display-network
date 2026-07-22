/**
 * Global background — refactored to the new minimal design system.
 * Flat off-white surface, no orbs, no grain, no particles.
 * The `variant` prop is preserved for API compatibility.
 */
interface PremiumBackgroundProps {
  variant?: 'default' | 'dashboard';
  children: React.ReactNode;
  className?: string;
}

const PremiumBackground = ({ children, className = '' }: PremiumBackgroundProps) => {
  return (
    <div className={`relative min-h-screen bg-transparent ${className}`}>
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default PremiumBackground;
