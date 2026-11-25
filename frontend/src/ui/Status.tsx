import { cn } from '../lib/utils';
import styles from './ui.module.css';

export interface StatusProps {
  phase?: 'reading' | 'marking' | 'idle';
  className?: string;
}

const messages = {
  reading: 'Looking through your sources…',
  marking: 'Writing a note…',
  idle: '',
};

export function Status({ phase = 'idle', className }: StatusProps) {
  if (phase === 'idle') return null;

  return (
    <div className={cn(styles.status, className)} aria-live="polite" aria-atomic="true">
      {messages[phase]}
    </div>
  );
}