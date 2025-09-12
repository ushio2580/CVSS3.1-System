import React from 'react';
import { cn } from '../../utils';

interface ResponsiveWrapperProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  container?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'none';
}

export function ResponsiveWrapper({
  children,
  className,
  as: Component = 'div',
  container = false,
  padding = 'md',
  maxWidth = 'xl'
}: ResponsiveWrapperProps) {
  const paddingClasses = {
    none: '',
    sm: 'px-2 sm:px-4',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12',
    xl: 'px-8 sm:px-12 lg:px-16'
  };

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
    none: ''
  };

  return (
    <Component
      className={cn(
        'w-full mx-auto',
        container && 'responsive-container',
        paddingClasses[padding],
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </Component>
  );
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  autoFit?: boolean;
  minWidth?: string;
}

export function ResponsiveGrid({
  children,
  className,
  cols = 1,
  gap = 'md',
  autoFit = false,
  minWidth = '280px'
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-2 sm:gap-4',
    md: 'gap-4 sm:gap-6 lg:gap-8',
    lg: 'gap-6 sm:gap-8 lg:gap-12',
    xl: 'gap-8 sm:gap-12 lg:gap-16'
  };

  const gridCols = autoFit 
    ? `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
    : `grid-cols-1 sm:grid-cols-${Math.min(cols, 2)} lg:grid-cols-${Math.min(cols, 3)} xl:grid-cols-${cols}`;

  return (
    <div
      className={cn(
        'grid',
        gapClasses[gap],
        gridCols,
        autoFit && 'auto-rows-fr',
        className
      )}
      style={autoFit ? {
        gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))`
      } : undefined}
    >
      {children}
    </div>
  );
}

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  interactive?: boolean;
}

export function ResponsiveCard({
  children,
  className,
  padding = 'md',
  hover = false,
  interactive = false
}: ResponsiveCardProps) {
  const paddingClasses = {
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6 lg:p-8',
    lg: 'p-6 sm:p-8 lg:p-12',
    xl: 'p-8 sm:p-12 lg:p-16'
  };

  return (
    <div
      className={cn(
        'bg-card border rounded-lg shadow-sm',
        paddingClasses[padding],
        hover && 'hover:shadow-md transition-shadow duration-200',
        interactive && 'cursor-pointer hover:bg-accent/50 transition-colors duration-200',
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

export function ResponsiveText({
  children,
  className,
  as: Component = 'p',
  size = 'base',
  weight = 'normal'
}: ResponsiveTextProps) {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm sm:text-base',
    base: 'text-sm sm:text-base lg:text-lg',
    lg: 'text-base sm:text-lg lg:text-xl',
    xl: 'text-lg sm:text-xl lg:text-2xl',
    '2xl': 'text-xl sm:text-2xl lg:text-3xl',
    '3xl': 'text-2xl sm:text-3xl lg:text-4xl',
    '4xl': 'text-3xl sm:text-4xl lg:text-5xl'
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };

  return (
    <Component
      className={cn(
        sizeClasses[size],
        weightClasses[weight],
        className
      )}
    >
      {children}
    </Component>
  );
}

interface ResponsiveButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function ResponsiveButton({
  children,
  className,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  onClick,
  disabled = false,
  type = 'button'
}: ResponsiveButtonProps) {
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
  };

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs sm:text-sm',
    md: 'h-10 px-4 py-2 text-sm sm:text-base',
    lg: 'h-12 px-6 py-3 text-base sm:text-lg'
  };

  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : 'w-full sm:w-auto',
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
