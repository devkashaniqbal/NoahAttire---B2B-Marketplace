import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-navy-600 text-white hover:bg-navy-700 shadow-sm',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        outline: 'border border-navy-600 text-navy-600 bg-transparent hover:bg-navy-50',
        secondary: 'bg-gray-100 text-navy-600 hover:bg-gray-200',
        ghost: 'text-navy-600 hover:bg-navy-50',
        link: 'text-navy-600 underline-offset-4 hover:underline',
        gold: 'bg-gold-500 text-white hover:bg-gold-600 shadow-sm',
        'gold-outline': 'border border-gold-500 text-gold-600 hover:bg-gold-50',
        primary: 'bg-alibaba-500 text-white hover:bg-alibaba-600 shadow-sm',
        'primary-outline': 'border border-alibaba-500 text-alibaba-600 hover:bg-alibaba-50',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-8 text-base',
        xl: 'h-12 rounded-md px-10 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  );
});
Button.displayName = 'Button';

export { Button, buttonVariants };
