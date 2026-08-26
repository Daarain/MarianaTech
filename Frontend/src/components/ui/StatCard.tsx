import { type LucideIcon } from 'lucide-react';
import { COLOURS } from '@/constants/colours';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  colour: { base: string; light: string; tint: string };
  delay?: number;
  pulse?: boolean;
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  colour,
  delay = 0,
  pulse = false,
}: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 opacity-0 animate-fadeUp ${pulse ? 'animate-bioPulse' : ''}`}
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderColor: 'rgba(255,255,255,0.08)',
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10"
        style={{ backgroundColor: colour.light }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: COLOURS.seafloor.light }}>
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums" style={{ color: COLOURS.textPrimary }}>
            {value}
          </p>
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${colour.base}22`, color: colour.light }}
        >
          <Icon size={22} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
