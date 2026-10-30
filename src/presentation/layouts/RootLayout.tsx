import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { RealtimeNotice } from '../components/RealtimeNotice'
import { Footer } from './Footer'

export function RootLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  return <div className={`app-shell ${pathname === '/login' || pathname === '/register' ? 'app-shell-auth' : ''}`}><Header /><RealtimeNotice /><Outlet /><Footer /></div>
}

export function NotFoundPage() {
  return <main className="page-shell empty-state"><span className="eyebrow">404</span><h1>Esta página não existe</h1><p>O endereço pode estar incorreto ou o conteúdo foi removido.</p><Link className="button" to="/">Voltar ao início</Link></main>
}
