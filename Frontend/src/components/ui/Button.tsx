import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'hazard' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'relative inline-flex items-center justify-center font-mono font-semibold tracking-wider transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none rounded';

  const variantClasses = {
    primary:
      'bg-cyan-500 text-black hover:bg-cyan-400 active:bg-cyan-600 shadow-[0_0_16px_rgba(0,240,255,0.35)] border border-cyan-300',
    secondary:
      'bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/80 hover:text-cyan-200 border border-cyan-500/40 shadow-sm',
    outline:
      'bg-transparent text-slate-300 border border-slate-700 hover:border-cyan-500/50 hover:text-cyan-400',
    hazard:
      'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 shadow-[0_0_16px_rgba(255,59,48,0.35)] border border-rose-400',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 shadow-[0_0_16px_rgba(0,255,157,0.35)] border border-emerald-400',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs gap-2',
    lg: 'px-6 py-3 text-sm gap-2.5',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-current" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};

export default Button;
