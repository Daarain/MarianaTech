import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {icon && <span className="absolute left-3 text-orange-400/70">{icon}</span>}
        <input
          className={`w-full rounded border bg-[#101214] px-3 py-2 font-sans text-xs text-[#E8E5DF] placeholder-slate-500 transition-all duration-200 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400/50 ${icon ? 'pl-9' : ''} ${error ? 'border-rose-500' : 'border-[#B9C0C8]/30'} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="font-sans text-[11px] text-rose-400">{error}</span>}
    </div>
  );
};

export default Input;
