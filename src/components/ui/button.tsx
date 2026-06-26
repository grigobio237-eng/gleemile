import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-bold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white shadow-lg shadow-primary/10 hover:opacity-90',
        primary: 'bg-primary text-white shadow-lg shadow-primary/10 hover:opacity-90',
        destructive: 'bg-status-danger text-white hover:opacity-90',
        outline: 'border-2 border-primary text-primary bg-transparent hover:bg-primary/5',
        secondary: 'bg-secondary-container text-on-secondary-container hover:opacity-90',
        ghost: 'text-foreground/60 hover:text-primary hover:bg-primary/5',
        link: 'text-primary hover:opacity-80',
      },
      size: {
        default: 'h-14 px-8 py-4 text-base',
        sm: 'h-10 px-4 text-sm',
        lg: 'h-16 px-10 text-lg',
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };


