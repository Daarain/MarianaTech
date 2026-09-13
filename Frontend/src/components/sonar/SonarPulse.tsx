import React from 'react';

interface SonarPulseProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'cyan' | 'green' | 'hazard';
  className?: string;
  active?: boolean;
}

export const SonarPulse: React.FC<SonarPulseProps> = ({
  size = 'md',
  variant = 'cyan',
  className = '',
  active = true,
}) => {
  const sizeMap = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-48 h-48',
  };

  const colorMap = {
    cyan: 'border-cyan-400 bg-cyan-500/20 text-cyan-400',
    green: 'border-emerald-400 bg-emerald-500/20 text-emerald-400',
    hazard: 'border-rose-500 bg-rose-500/20 text-rose-400',
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeMap[size]} ${className}`}>
      {/* Center Beacon Dot */}
      <div className={`h-3 w-3 rounded-full ${variant === 'cyan' ? 'bg-cyan-400 shadow-[0_0_12px_#00F0FF]' : variant === 'green' ? 'bg-emerald-400 shadow-[0_0_12px_#00FF9D]' : 'bg-rose-500 shadow-[0_0_12px_#FF3B30]'}`} />

      {/* Pulse Rings */}
      {active && (
        <>
          <div
            className={`animate-sonarPing absolute inset-0 rounded-full border ${colorMap[variant]}`}
          />
          <div
            className={`animate-sonarPing absolute inset-0 rounded-full border ${colorMap[variant]}`}
            style={{ animationDelay: '0.8s' }}
          />
          <div
            className={`animate-sonarPing absolute inset-0 rounded-full border ${colorMap[variant]}`}
            style={{ animationDelay: '1.6s' }}
          />
        </>
      )}
    </div>
  );
};

export default SonarPulse;
