import React from 'react';

interface ScanLineProps {
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export const ScanLine: React.FC<ScanLineProps> = ({
  direction = 'horizontal',
  className = '',
}) => {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {direction === 'horizontal' ? (
        <div className="animate-beamPass absolute left-0 right-0 h-16 bg-gradient-to-b from-transparent via-cyan-400/15 to-transparent" />
      ) : (
        <div className="animate-scanSweep absolute inset-0 origin-center bg-[conic-gradient(from_0deg,transparent_0deg,transparent_300deg,rgba(0,240,255,0.25)_360deg)] rounded-full" />
      )}
    </div>
  );
};

export default ScanLine;
