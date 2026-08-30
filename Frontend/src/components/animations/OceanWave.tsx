import { COLOURS } from '@/constants/colours';

interface OceanWaveProps {
  className?: string;
}

export default function OceanWave({ className = '' }: OceanWaveProps) {
  return (
    <div className={`pointer-events-none absolute inset-x-0 top-0 h-32 overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-[200%] animate-waveMove"
        style={{ opacity: 0.15 }}
      >
        <path
          d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z"
          fill={COLOURS.ocean.base}
        />
      </svg>
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-[200%] animate-waveMove"
        style={{ opacity: 0.08, animationDelay: '1s' }}
      >
        <path
          d="M0,70 C240,30 480,110 720,70 C960,30 1200,110 1440,70 L1440,120 L0,120 Z"
          fill={COLOURS.ocean.light}
        />
      </svg>
    </div>
  );
}
