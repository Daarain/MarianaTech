import { type ReactNode } from 'react';
import { COLOURS } from '@/constants/colours';

interface BioGlowProps {
  children: ReactNode;
  colour?: string;
  duration?: number;
}

export default function BioGlow({
  children,
  colour = COLOURS.bio.light,
  duration = 3,
}: BioGlowProps) {
  return (
    <div
      className="relative rounded-2xl"
      style={{
        animation: `bioPulse ${duration}s ease-in-out infinite`,
      }}
    >
      {children}
    </div>
  );
}
