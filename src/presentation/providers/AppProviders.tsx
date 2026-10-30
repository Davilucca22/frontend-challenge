import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { AuthProvider } from './AuthProvider'
import { RealtimeProvider } from './RealtimeProvider'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 20_000,
        gcTime: 5 * 60_000,
        retry: (count, error) => {
          const status = 'status' in error ? error.status : undefined
          return count < 1 && (typeof status !== 'number' || status >= 500 || status === 0)
        },
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  }))
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RealtimeProvider>{children}</RealtimeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
