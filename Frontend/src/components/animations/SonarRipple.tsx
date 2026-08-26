import { COLOURS } from '@/constants/colours';

interface SonarRippleProps {
  size?: number;
  colour?: string;
}

export default function SonarRipple({ size = 36, colour = COLOURS.ocean.light }: SonarRippleProps) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <span
        className="absolute inset-0 rounded-full animate-sonarPing"
        style={{ border: `2px solid ${colour}` }}
      />
      <span
        className="absolute inset-0 rounded-full animate-sonarPing"
        style={{ border: `2px solid ${colour}`, animationDelay: '1s' }}
      />
      <span
        className="relative rounded-full"
        style={{
          width: size * 0.5,
          height: size * 0.5,
          backgroundColor: colour,
          boxShadow: `0 0 12px ${colour}88`,
        }}
      />
    </div>
  );
}
