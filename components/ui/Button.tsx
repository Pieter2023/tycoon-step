import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  fullWidth,
  className = '',
  type = 'button',
  ...props
}) => {
  const widthClass = fullWidth ? 'ds-button--full' : '';
  return (
    <button
      type={type}
      className={`ds-button ds-button--${variant} ds-button--${size} ${widthClass} ${className}`.trim()}
      {...props}
    />
  );
};

export default Button;
