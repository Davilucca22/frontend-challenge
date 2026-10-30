import { Link } from '@tanstack/react-router'
import { useAuth } from '../providers/AuthProvider'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <main className="page-shell"><p className="muted">Verificando sessão...</p></main>
  if (!user) return <main className="page-shell"><section className="empty-state"><h1>Entre para continuar</h1><p>Este fluxo está disponível para colecionadores autenticados.</p><Link className="button" to="/login" search={{ redirect: `${window.location.pathname}${window.location.search}` }}>Entrar na Kurio</Link></section></main>
  return children
}
