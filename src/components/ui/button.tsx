import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../shared/utils/cn'

// Centraliza aparência e tamanhos das variações disponíveis de botão.
const buttonVariants = cva(
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-light focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-accent bg-accent text-[#1b1009] hover:bg-accent-light',
        outline: 'border-accent bg-transparent text-accent-light hover:bg-panel-2',
        ghost: 'border-transparent bg-transparent text-muted hover:bg-panel-2 hover:text-accent-light',
      },
      size: {
        default: 'min-h-10 px-4',
        sm: 'min-h-8 px-3 text-xs',
        icon: 'h-10 w-10 min-h-10 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

// Renderiza um botão nativo ou transfere suas propriedades para um filho.
export function Button({ asChild = false, className, size, variant, ...props }: ButtonProps) {
  const Component = asChild ? Slot : 'button'
  return <Component className={cn(buttonVariants({ className, size, variant }))} {...props} />
}
