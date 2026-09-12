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
        <label className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {icon && <span className="absolute left-3 text-cyan-400/70">{icon}</span>}
        <input
          className={`w-full rounded border bg-slate-950/80 px-3 py-2 font-mono text-xs text-slate-100 placeholder-slate-500 transition-all duration-200 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 ${icon ? 'pl-9' : ''} ${error ? 'border-rose-500' : 'border-cyan-500/30'} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="font-mono text-[10px] text-rose-400">{error}</span>}
    </div>
  );
};

export default Input;
