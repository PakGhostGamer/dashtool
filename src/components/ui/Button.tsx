import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  ...props 
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:pointer-events-none disabled:opacity-50 shadow-[4px_4px_16px_#e0e0e0,_-4px_-4px_16px_#ffffff] backdrop-blur-md',
        {
          'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
          'bg-gray-100 text-gray-900 hover:bg-gray-200': variant === 'secondary',
          'border border-gray-200 bg-white/70 hover:bg-gray-50': variant === 'outline',
          'hover:bg-gray-100 bg-white/70': variant === 'ghost',
          'h-8 px-3 text-sm': size === 'sm',
          'h-10 px-5': size === 'md',
          'h-12 px-7 text-lg': size === 'lg'
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}