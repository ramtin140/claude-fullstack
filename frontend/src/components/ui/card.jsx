import * as React from 'react';
import { cn } from '../../lib/utils.js';

export const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('rounded-md border border-border bg-surface', className)} {...props} />
));
Card.displayName = 'Card';
