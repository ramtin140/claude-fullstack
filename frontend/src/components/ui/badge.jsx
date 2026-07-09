import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils.js';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
  {
    variants: {
      variant: {
        live: 'bg-magenta-light/20 text-magenta-light',
        waiting: 'bg-gold/15 text-gold',
        finished: 'bg-white/10 text-ink-muted',
        success: 'bg-success/15 text-success',
        critical: 'bg-critical/15 text-critical',
      },
    },
    defaultVariants: { variant: 'waiting' },
  }
);

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
