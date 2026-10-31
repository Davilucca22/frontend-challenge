import * as LabelPrimitive from '@radix-ui/react-label'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '../../shared/utils/cn'

// Padroniza o texto e o estado visual dos rótulos de formulário.
export function Label({ className, ...props }: ComponentPropsWithoutRef<typeof LabelPrimitive.Root>) {
  return <LabelPrimitive.Root className={cn('text-sm font-medium leading-none text-[#dfd1c1] peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)} {...props} />
}
