import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils.js';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-bold transition-all duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:scale-[0.97] [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-br from-gold-light to-gold text-[#241102] shadow-[0_8px_20px_rgba(242,183,5,0.35)] hover:shadow-[0_10px_26px_rgba(242,183,5,0.5)]',
        outline:
          'border border-white/25 text-ink bg-transparent hover:border-gold hover:text-gold',
        ghost: 'text-ink-muted hover:text-ink hover:bg-white/5',
        magenta:
          'bg-gradient-to-br from-magenta-light to-magenta text-white shadow-[0_8px_20px_rgba(179,22,112,0.4)]',
      },
      size: {
        default: 'h-11 px-6',
        sm: 'h-9 px-4 text-[13px]',
        icon: 'h-10 w-10 rounded-full p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  }
);

export const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = 'Button';

export { buttonVariants };
