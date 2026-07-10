import * as React from 'react';
import { cn } from '../../lib/utils.js';

export function Table({ className, ...props }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full border-collapse text-[13px]', className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }) {
  return <thead className={cn('bg-bg-soft', className)} {...props} />;
}

export function TableBody({ className, ...props }) {
  return <tbody className={className} {...props} />;
}

export function TableRow({ className, ...props }) {
  return <tr className={cn('border-b border-border last:border-b-0', className)} {...props} />;
}

export function TableHead({ className, ...props }) {
  return <th className={cn('whitespace-nowrap px-3.5 py-3 text-start font-semibold text-ink-muted', className)} {...props} />;
}

export function TableCell({ className, ...props }) {
  return <td className={cn('px-3.5 py-3 text-ink', className)} {...props} />;
}
