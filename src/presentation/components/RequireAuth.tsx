import { Link } from '@tanstack/react-router'
import { useAuth } from '../providers/AuthProvider'

// Protege conteúdo privado, indicando carregamento ou encaminhando ao login.
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <main className={"[width:min(var(--content),_calc(100%_-_64px))] [margin-inline:auto] max-[900px]:[width:calc(100%_-_42px)] max-[640px]:[width:calc(100%_-_36px)] page-shell"}><p className={"[color:var(--muted)] muted"}>Verificando sessão...</p></main>
  if (!user) return <main className={"[width:min(var(--content),_calc(100%_-_64px))] [margin-inline:auto] max-[900px]:[width:calc(100%_-_42px)] max-[640px]:[width:calc(100%_-_36px)] page-shell"}><section className={"[min-height:280px] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center] [padding:40px_20px] [text-align:center] [&_p]:[color:var(--muted)] empty-state"}><h1>Entre para continuar</h1><p>Este fluxo está disponível para colecionadores autenticados.</p><Link className={"[min-height:42px] [padding:0_20px] [display:inline-flex] [justify-content:center] [align-items:center] [gap:9px] [border:1px_solid_var(--accent)] [border-radius:6px] [color:#1b1009] [background:var(--accent)] [font-weight:700] [font-size:15px] [cursor:pointer] [transition:background_.15s,_transform_.15s] [&:hover]:[color:#1b1009] [&:hover]:[background:var(--accent-light)] [&:hover]:[transform:translateY(-1px)] [&:disabled]:[transform:none] [&:disabled]:[cursor:not-allowed] [&:disabled]:[opacity:.52] [&.disabled]:[transform:none] [&.disabled]:[cursor:not-allowed] [&.disabled]:[opacity:.52] button"} to="/login" search={{ redirect: `${window.location.pathname}${window.location.search}` }}>Entrar na Kurio</Link></section></main>
  return children
}
