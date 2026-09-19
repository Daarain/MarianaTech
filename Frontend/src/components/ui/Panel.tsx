import React from 'react';

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'standard' | 'elevated' | 'analysis' | 'warning' | 'result';
  hasCornerNotch?: boolean;
  headerTitle?: string;
  headerIcon?: React.ReactNode;
  headerRight?: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({
  children,
  variant = 'standard',
  hasCornerNotch = false,
  headerTitle,
  headerIcon,
  headerRight,
  className = '',
  ...props
}) => {
  const variantClasses = {
    standard: 'sonar-panel',
    elevated: 'sonar-panel-elevated',
    analysis: 'sonar-panel-analysis',
    warning: 'sonar-panel-warning',
    result: 'sonar-panel-elevated border-orange-500/40',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-lg p-4 transition-all duration-200 ${variantClasses[variant]} ${hasCornerNotch ? 'corner-notch' : ''} ${className}`}
      {...props}
    >
      {headerTitle && (
        <div className="mb-4 flex items-center justify-between border-b border-[#B9C0C8]/20 pb-3">
          <div className="flex items-center gap-2">
            {headerIcon && <span className="text-orange-400">{headerIcon}</span>}
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-100">
              {headerTitle}
            </h3>
          </div>
          {headerRight && <div>{headerRight}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Panel;
