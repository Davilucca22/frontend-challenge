import { tw } from '../../shared/tw'
import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { RealtimeNotice } from '../components/RealtimeNotice'
import { Footer } from './Footer'

// Monta a estrutura comum das páginas e ajusta o shell em telas de autenticação.
export function RootLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  return <div className={tw(`app-shell ${pathname === '/login' || pathname === '/register' ? 'app-shell-auth' : ''}`)}><Header /><RealtimeNotice /><Outlet /><Footer /></div>
}

// Apresenta uma página de recuperação quando a rota não existe.
export function NotFoundPage() {
  return <main className={"[width:min(var(--content),_calc(100%_-_64px))] [margin-inline:auto] max-[900px]:[width:calc(100%_-_42px)] max-[640px]:[width:calc(100%_-_36px)] [min-height:280px] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center] [padding:40px_20px] [text-align:center] [&_p]:[color:var(--muted)] page-shell empty-state"}><span className={"[color:var(--accent-light)] [font-size:10px] [letter-spacing:.17em] [text-transform:uppercase] eyebrow"}>404</span><h1>Esta página não existe</h1><p>O endereço pode estar incorreto ou o conteúdo foi removido.</p><Link className={"[min-height:42px] [padding:0_20px] [display:inline-flex] [justify-content:center] [align-items:center] [gap:9px] [border:1px_solid_var(--accent)] [border-radius:6px] [color:#1b1009] [background:var(--accent)] [font-weight:700] [font-size:15px] [cursor:pointer] [transition:background_.15s,_transform_.15s] [&:hover]:[color:#1b1009] [&:hover]:[background:var(--accent-light)] [&:hover]:[transform:translateY(-1px)] [&:disabled]:[transform:none] [&:disabled]:[cursor:not-allowed] [&:disabled]:[opacity:.52] [&.disabled]:[transform:none] [&.disabled]:[cursor:not-allowed] [&.disabled]:[opacity:.52] button"} to="/">Voltar ao início</Link></main>
}
