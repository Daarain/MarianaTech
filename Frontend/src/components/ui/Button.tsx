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
    'relative inline-flex items-center justify-center font-sans font-semibold tracking-wide transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none rounded';

  const variantClasses = {
    primary:
      'bg-orange-500 text-[#101214] hover:bg-orange-400 active:bg-orange-600 border border-orange-400 focus:ring-2 focus:ring-orange-500/40',
    secondary:
      'bg-[#242930] text-[#E8E5DF] hover:bg-[#2D333B] border border-[#B9C0C8]/40',
    outline:
      'bg-transparent text-[#B9C0C8] border border-[#B9C0C8]/40 hover:border-orange-500/60 hover:text-orange-400',
    hazard:
      'bg-[#B94A48] text-[#E8E5DF] hover:bg-[#D47774] active:bg-[#8F3735] border border-[#D47774]',
    success:
      'bg-[#242930] text-[#E8E5DF] hover:bg-[#2D333B] border border-[#B9C0C8]/50',
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
