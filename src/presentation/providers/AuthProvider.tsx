import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { User } from '../../domain/entities/User'
import { HttpAuthRepository } from '../../infrastructure/repositories/HttpAuthRepository'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (name: string, username: string, email: string, password: string) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const authRepository = new HttpAuthRepository()

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  useEffect(() => {
    const expireSession = () => {
      queryClient.setQueryData(['auth', 'session'], null)
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' && query.queryKey[0] !== 'cart' })
    }
    window.addEventListener('kurio:session-expired', expireSession)
    return () => window.removeEventListener('kurio:session-expired', expireSession)
  }, [queryClient])
  const sessionQuery = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: () => authRepository.session(),
    retry: false,
    staleTime: 30_000,
  })
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => authRepository.login(email, password),
    onSuccess: (user) => {
      queryClient.removeQueries({ predicate: (query) => ['favorites', 'profile', 'wallets', 'order'].includes(String(query.queryKey[0])) })
      queryClient.setQueryData(['auth', 'session'], user)
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
  const registerMutation = useMutation({
    mutationFn: ({ name, username, email, password }: { name: string; username: string; email: string; password: string }) =>
      authRepository.register(name, username, email, password),
    onSuccess: (user) => {
      queryClient.removeQueries({ predicate: (query) => ['favorites', 'profile', 'wallets', 'order'].includes(String(query.queryKey[0])) })
      queryClient.setQueryData(['auth', 'session'], user)
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
  const logoutMutation = useMutation({
    mutationFn: () => authRepository.logout(),
    onSuccess: async () => {
      queryClient.setQueryData(['auth', 'session'], null)
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' })
      await queryClient.invalidateQueries({ queryKey: ['auth', 'session'] })
    },
  })
  const value = useMemo<AuthContextValue>(() => ({
    user: sessionQuery.data ?? null,
    loading: sessionQuery.isPending,
    login: async (email, password) => loginMutation.mutateAsync({ email, password }),
    register: async (name, username, email, password) => registerMutation.mutateAsync({ name, username, email, password }),
    logout: async () => logoutMutation.mutateAsync(),
  }), [sessionQuery.data, sessionQuery.isPending, loginMutation, registerMutation, logoutMutation])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  return context
}
