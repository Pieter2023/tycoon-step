import React from 'react';

type BadgeVariant = 'low' | 'med' | 'high' | 'extreme' | 'neutral';

type BadgeProps = {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
};

const Badge: React.FC<BadgeProps> = ({ variant = 'low', className = '', children }) => {
  return (
    <span className={`ds-badge ds-badge--${variant} ${className}`.trim()}>
      {children}
    </span>
  );
};

export default Badge;
