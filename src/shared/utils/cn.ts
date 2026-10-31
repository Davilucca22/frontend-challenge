import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Combina classes condicionais e elimina utilitários Tailwind conflitantes.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
