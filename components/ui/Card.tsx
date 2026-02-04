import React from 'react';

type CardProps = {
  className?: string;
  muted?: boolean;
  children: React.ReactNode;
};

const Card: React.FC<CardProps> = ({ className = '', muted, children }) => {
  return (
    <div className={`ds-card ${muted ? 'ds-card--muted' : ''} ${className}`.trim()}>
      {children}
    </div>
  );
};

export default Card;
