import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import type { ComponentPropsWithoutRef, ElementRef } from 'react'
import { forwardRef } from 'react'
import { Check } from 'lucide-react'
import { cn } from '../../shared/utils/cn'

// Encapsula o checkbox acessível do Radix com o tema visual do projeto.
export const Checkbox = forwardRef<ElementRef<typeof CheckboxPrimitive.Root>, ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>>(
  ({ className, ...props }, ref) => (
    <CheckboxPrimitive.Root ref={ref} className={cn('peer h-4 w-4 shrink-0 rounded-sm border border-border bg-[#1b110d] text-[#1b1009] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-light disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-accent data-[state=checked]:bg-accent', className)} {...props}>
      <CheckboxPrimitive.Indicator className="grid place-items-center"><Check aria-hidden="true" className="h-3.5 w-3.5" /></CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  ),
)
Checkbox.displayName = CheckboxPrimitive.Root.displayName
