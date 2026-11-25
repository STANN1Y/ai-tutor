import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/utils';
import styles from './ui.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          styles.button,
          styles[variant],
          styles[size],
          className
        )}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <svg className={styles.spinner} viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.3" />
              <path fill="currentColor" d="M12 3a9 9 0 0 0-9 9h3a6 6 0 0 1 6-6V3z" />
            </svg>
            <span>Working…</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';