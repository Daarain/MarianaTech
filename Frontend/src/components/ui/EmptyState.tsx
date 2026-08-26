import { Inbox, Loader2, AlertCircle } from 'lucide-react';
import { COLOURS } from '@/constants/colours';

interface EmptyStateProps {
  variant?: 'no_data' | 'processing' | 'error';
  title?: string;
  message?: string;
}

export default function EmptyState({
  variant = 'no_data',
  title,
  message,
}: EmptyStateProps) {
  const defaults = {
    no_data: { icon: Inbox, title: 'No Data Available', message: 'There is nothing to display here yet.' },
    processing: { icon: Loader2, title: 'Processing...', message: 'Data is being analyzed. Please wait.' },
    error: { icon: AlertCircle, title: 'Something Went Wrong', message: 'An error occurred while loading.' },
  };
  const cfg = defaults[variant];
  const Icon = cfg.icon;
  const colour = variant === 'error' ? COLOURS.hazard.light : COLOURS.seafloor.light;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon
        size={40}
        strokeWidth={1.5}
        className={variant === 'processing' ? 'animate-spin' : ''}
        style={{ color: colour }}
      />
      <h3 className="mt-4 text-sm font-semibold" style={{ color: COLOURS.textPrimary }}>
        {title ?? cfg.title}
      </h3>
      <p className="mt-1 text-xs" style={{ color: COLOURS.seafloor.light }}>
        {message ?? cfg.message}
      </p>
    </div>
  );
}
