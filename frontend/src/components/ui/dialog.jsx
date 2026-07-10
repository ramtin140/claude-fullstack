import { cn } from '../../lib/utils.js';
import { Card } from './card.jsx';

export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-5"
      onClick={() => onOpenChange?.(false)}
    >
      {children}
    </div>
  );
}

export function DialogContent({ className, children, ...props }) {
  return (
    <Card
      className={cn('max-h-[90vh] w-full max-w-[480px] overflow-y-auto p-6', className)}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </Card>
  );
}

export function DialogTitle({ className, ...props }) {
  return <h2 className={cn('mb-4 mt-0 text-lg font-bold text-gold', className)} {...props} />;
}

export function DialogFooter({ className, ...props }) {
  return <div className={cn('mt-4 flex justify-end gap-2.5', className)} {...props} />;
}
