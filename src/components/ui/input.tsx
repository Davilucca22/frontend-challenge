import type { InputHTMLAttributes } from 'react'
import { cn } from '../../shared/utils/cn'

// Aplica estilo e foco acessível aos campos de texto reutilizados nas telas.
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('flex min-h-10 w-full rounded-md border border-border bg-[#1b110d] px-3 py-2 text-sm text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-light disabled:cursor-not-allowed disabled:opacity-50', className)} {...props} />
}
