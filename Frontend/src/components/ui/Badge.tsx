import { formatPriority } from '@/utils/formatters';
import type { Priority } from '@/api/mockData';

const PRIORITY_COLOURS: Record<Priority, { bg: string; dot: string; border: string }> = {
  critical: { bg: 'rgba(163, 45, 45, 0.15)', dot: '#A32D2D', border: '#A32D2D' },
  high: { bg: 'rgba(55, 138, 221, 0.15)', dot: '#378ADD', border: '#378ADD' },
  medium: { bg: 'rgba(83, 74, 183, 0.15)', dot: '#534AB7', border: '#534AB7' },
  low: { bg: 'rgba(136, 135, 128, 0.15)', dot: '#888780', border: '#888780' },
};

interface BadgeProps {
  priority: Priority;
}

export default function Badge({ priority }: BadgeProps) {
  const c = PRIORITY_COLOURS[priority];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: c.bg, color: c.dot, borderColor: c.border }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
      {formatPriority(priority)}
    </span>
  );
}
