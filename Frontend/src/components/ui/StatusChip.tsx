import type { MissionStatus } from '@/types/api';

const STATUS_COLOURS: Record<MissionStatus, { bg: string; dot: string }> = {
  processing: { bg: '#D97732', dot: '#E8E5DF' },
  complete: { bg: '#242930', dot: '#B9C0C8' },
  failed: { bg: '#B94A48', dot: '#E8E5DF' },
  pending: { bg: '#59616B', dot: '#B9C0C8' },
};

interface StatusChipProps {
  status: MissionStatus;
}

export default function StatusChip({ status }: StatusChipProps) {
  const c = STATUS_COLOURS[status];
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
      style={{ backgroundColor: c.bg }}
    >
      {status === 'processing' && (
        <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: c.dot }} />
      )}
      {status !== 'processing' && (
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
      )}
      {label}
    </span>
  );
}
