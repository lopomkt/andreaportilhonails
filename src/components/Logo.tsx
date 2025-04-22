
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClass = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  }[size];

  return (
    <div className={`font-bold ${sizeClass} ${className}`}>
      <span className="text-nail-600">Nail</span>
      <span className="text-nail-400">Designer</span>
    </div>
  );
};
