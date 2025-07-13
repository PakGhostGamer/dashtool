import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = "",
  onClick,
  disabled = false,
  type = 'button'
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-xl font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:pointer-events-none disabled:opacity-50 shadow-[4px_4px_16px_#e0e0e0,_-4px_-4px_16px_#ffffff] backdrop-blur-sm';
  
  const variantClasses = {
    'bg-blue-600 text-white': variant === 'primary',
    'bg-gray-100 text-gray-900': variant === 'secondary',
    'border border-gray-200 bg-white/70': variant === 'outline',
    'bg-white/70': variant === 'ghost',
  };

  const sizeClasses = {
    'px-3 py-1.5 text-sm': size === 'sm',
    'px-4 py-2 text-sm': size === 'md',
    'px-6 py-3 text-base': size === 'lg',
  };

  return (
    <button
      type={type}
      className={clsx(
        baseClasses,
        variantClasses,
        sizeClasses,
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}