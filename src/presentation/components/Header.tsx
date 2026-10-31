import { useRef, useState } from 'react'
import { tw } from '../../shared/tw'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { ArrowLeft, Heart, Home, ScanLine, Search, ShoppingCart, UserRound } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { httpClient } from '../../infrastructure/http/axios-client'
import type { CartLine } from '../../domain/entities/Cart'
import { useAuth } from '../providers/AuthProvider'
import { FavoritesModal } from './FavoritesModal'

// Renderiza navegação responsiva, ações globais e o modal de favoritos.
export function Header() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const favoritesTriggerRef = useRef<HTMLElement | null>(null)
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const authPage = pathname === '/login' || pathname === '/register'
  const mobileTitle = pathname === '/cart'
    ? 'Carrinho de NFTs'
    : pathname === '/checkout'
      ? 'Pagamento com carteira'
      : pathname.startsWith('/nft/')
        ? ''
        : pathname.startsWith('/orders/')
          ? 'Pedido'
          : pathname === '/profile'
            ? 'Meu perfil'
            : pathname === '/wallets'
              ? 'Carteiras'
              : ''
  // Mantém a quantidade do carrinho sincronizada com o cache de consultas.
  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: async () => (await httpClient.get<{ items: CartLine[] }>('/cart')).data,
  })
  const count = cartQuery.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0
  return (
    <header className={tw(`site-header ${authPage ? 'site-header-auth' : pathname === '/' ? 'site-header-home' : 'site-header-inner'}`)}>
      <Link to="/" className={"[font-size:16px] [font-weight:800] [letter-spacing:.17em] max-[640px]:[font-size:13px] brand"} aria-label="Kurio início">KURIO</Link>
      <nav className={"[display:flex] [align-items:center] [gap:clamp(22px,_4vw,_58px)] [margin-inline:auto] [&_a]:[font-size:15px] [&_a]:[font-weight:700] [&_a]:[color:#e5d7c6] [&_a:hover]:[color:var(--accent-light)] [&_a[aria-current=\"page\"]]:[color:var(--accent-light)] max-[640px]:[display:none] desktop-nav"} aria-label="Navegação principal">
        <Link to="/">Início</Link><a href="#catalog">Mercado</a><a href="#creators">Criadores</a><a href="#about">Aprenda</a>
      </nav>
      <div className={"[display:flex] [align-items:center] [gap:15px] max-[640px]:[&_>_.icon-button[aria-label=\"Favoritos\"]]:[display:none] max-[640px]:[margin-left:auto] max-[640px]:[&_>_.button]:[min-height:30px] max-[640px]:[&_>_.button]:[padding-inline:9px] max-[640px]:[&_>_.button]:[font-size:14px] header-actions"}>
        <Link className={"[min-width:34px] [min-height:34px] [display:inline-flex] [align-items:center] [justify-content:center] [color:var(--muted)] [background:transparent] [border:0] [border-radius:50%] [cursor:pointer] [position:relative] [&:hover]:[background:#382317] [&:hover]:[color:var(--accent-light)] [&.large]:[width:42px] [&.large]:[height:42px] [&.large]:[border:1px_solid_var(--border)] max-[640px]:[display:none] icon-button header-search"} to="/" aria-label="Buscar NFTs"><Search size={18} /></Link>
        {user && pathname !== '/profile' && <button className={"[min-width:34px] [min-height:34px] [display:inline-flex] [align-items:center] [justify-content:center] [color:var(--muted)] [background:transparent] [border:0] [border-radius:50%] [cursor:pointer] [position:relative] [&:hover]:[background:#382317] [&:hover]:[color:var(--accent-light)] [&.large]:[width:42px] [&.large]:[height:42px] [&.large]:[border:1px_solid_var(--border)] icon-button"} type="button" onClick={(event) => { favoritesTriggerRef.current = event.currentTarget; setFavoritesOpen(true) }} aria-label="Ver NFTs favoritas"><Heart size={17} /></button>}
        <Link className={"[min-width:34px] [min-height:34px] [display:inline-flex] [align-items:center] [justify-content:center] [color:var(--muted)] [background:transparent] [border:0] [border-radius:50%] [cursor:pointer] [position:relative] [&:hover]:[background:#382317] [&:hover]:[color:var(--accent-light)] [&.large]:[width:42px] [&.large]:[height:42px] [&.large]:[border:1px_solid_var(--border)] icon-button cart-link"} to="/cart" aria-label={`Carrinho, ${count} itens`}><ShoppingCart size={18} />{count > 0 && <span className={"[position:absolute] [top:-3px] [right:-3px] [width:16px] [height:16px] [border-radius:50%] [display:grid] [place-items:center] [color:var(--bg)] [background:var(--accent-light)] [font-size:14px] [font-weight:700] cart-count"}>{count}</span>}</Link>
        {user ? <div className={"[display:flex] [align-items:center] [gap:10px] [color:var(--muted)] [font-size:14px] max-[640px]:[display:none] user-menu"}><Link to="/profile">{user.username}</Link></div> : <Link className={"[min-height:42px] [padding:0_20px] [display:inline-flex] [justify-content:center] [align-items:center] [gap:9px] [border:1px_solid_var(--accent)] [border-radius:6px] [color:#1b1009] [background:var(--accent)] [font-weight:700] [font-size:15px] [cursor:pointer] [transition:background_.15s,_transform_.15s] [&:hover]:[color:#1b1009] [&:hover]:[background:var(--accent-light)] [&:hover]:[transform:translateY(-1px)] [&:disabled]:[transform:none] [&:disabled]:[cursor:not-allowed] [&:disabled]:[opacity:.52] [&.disabled]:[transform:none] [&.disabled]:[cursor:not-allowed] [&.disabled]:[opacity:.52] [min-height:32px] [padding:0_12px] button button-small"} to="/login" search={{ redirect: '/' }}><UserRound size={14} />{loading ? '...' : 'Entrar'}</Link>}
      </div>
      {!authPage && pathname !== '/' && <div className={"[display:none] max-[640px]:[width:100%] max-[640px]:[min-height:48px] max-[640px]:[display:flex] max-[640px]:[align-items:center] max-[640px]:[justify-content:space-between] max-[640px]:[padding-inline:21px] max-[640px]:[color:var(--text)] max-[640px]:[font-size:14px] max-[640px]:[font-weight:700] max-[640px]:[&_>_span]:[flex:1] max-[640px]:[&_>_span]:[text-align:center] max-[640px]:[&_>_.icon-button]:[min-width:29px] max-[640px]:[&_>_.icon-button]:[min-height:29px] max-[640px]:[&_>_.icon-button]:[color:var(--accent-light)] mobile-page-bar"}>
        <button className={"max-[640px]:[width:29px] max-[640px]:[height:29px] max-[640px]:[display:grid] max-[640px]:[place-items:center] max-[640px]:[border:1px_solid_#3c281c] max-[640px]:[border-radius:50%] max-[640px]:[color:var(--accent-light)] max-[640px]:[background:#241710] mobile-back-button"} type="button" aria-label="Voltar" onClick={() => void navigate({ to: pathname === '/checkout' ? '/cart' : '/' })}><ArrowLeft size={17} /></button>
        {mobileTitle && <span>{mobileTitle}</span>}
        {pathname.startsWith('/nft/') && <button className={"[min-width:34px] [min-height:34px] [display:inline-flex] [align-items:center] [justify-content:center] [color:var(--muted)] [background:transparent] [border:0] [border-radius:50%] [cursor:pointer] [position:relative] [&:hover]:[background:#382317] [&:hover]:[color:var(--accent-light)] [&.large]:[width:42px] [&.large]:[height:42px] [&.large]:[border:1px_solid_var(--border)] icon-button"} type="button" aria-label="Alternar NFT nos favoritos" onClick={() => user ? window.dispatchEvent(new Event('kurio:toggle-favorite')) : void navigate({ to: '/login', search: { redirect: pathname } })}><Heart size={16} /></button>}
      </div>}
      <nav className={"[display:none] max-[640px]:[position:fixed] max-[640px]:[z-index:20] max-[640px]:[right:10px] max-[640px]:[bottom:max(9px,_env(safe-area-inset-bottom))] max-[640px]:[left:10px] max-[640px]:[min-height:64px] max-[640px]:[display:flex] max-[640px]:[justify-content:space-around] max-[640px]:[align-items:center] max-[640px]:[border:1px_solid_#3a2518] max-[640px]:[border-radius:26px] max-[640px]:[background:rgb(36_22_15_/_98%)] max-[640px]:[box-shadow:0_7px_24px_#0008] max-[640px]:[&_a]:[position:relative] max-[640px]:[&_a]:[width:44px] max-[640px]:[&_a]:[height:44px] max-[640px]:[&_a]:[display:grid] max-[640px]:[&_a]:[place-items:center] max-[640px]:[&_a]:[color:#c8a980] max-[640px]:[&_a[aria-current=\"page\"]]:[color:var(--accent-light)] max-[640px]:[&_.mobile-explore-link]:[width:46px] max-[640px]:[&_.mobile-explore-link]:[height:46px] max-[640px]:[&_.mobile-explore-link]:[transform:translateY(-14px)] max-[640px]:[&_.mobile-explore-link]:[border:3px_solid_#7e4f2c] max-[640px]:[&_.mobile-explore-link]:[border-radius:50%] max-[640px]:[&_.mobile-explore-link]:[color:#f0d7b8] max-[640px]:[&_.mobile-explore-link]:[background:#a76e3f] max-[640px]:[&_.cart-count]:[top:2px] max-[640px]:[&_.cart-count]:[right:5px] max-[640px]:[&_.cart-count]:[width:13px] max-[640px]:[&_.cart-count]:[height:13px] max-[640px]:[&_.cart-count]:[font-size:14px] mobile-nav"} aria-label="Navegação mobile">
        <Link to="/" aria-label="Início"><Home size={17} /></Link>
        <button className="grid h-11 w-11 place-items-center border-0 bg-transparent text-[#c8a980]" type="button" aria-label="Ver NFTs favoritas" onClick={() => {
          if (user) {
            favoritesTriggerRef.current = document.activeElement as HTMLElement | null
            setFavoritesOpen(true)
          } else {
            void navigate({ to: '/login', search: { redirect: '/' } })
          }
        }}><Heart size={17} /></button>
        <Link className={"mobile-explore-link"} to="/" hash="catalog" aria-label="Explorar coleções"><ScanLine size={17} /></Link>
        <Link to="/cart" aria-label="Carrinho"><ShoppingCart size={17} />{count > 0 && <span className={"[position:absolute] [top:-3px] [right:-3px] [width:16px] [height:16px] [border-radius:50%] [display:grid] [place-items:center] [color:var(--bg)] [background:var(--accent-light)] [font-size:14px] [font-weight:700] cart-count"}>{count}</span>}</Link>
        <Link to={user ? '/profile' : '/login'} search={user ? undefined : { redirect: '/profile' }} aria-label="Conta"><UserRound size={17} /></Link>
      </nav>
      {user && favoritesOpen && <FavoritesModal userId={user.id} returnFocusRef={favoritesTriggerRef} onClose={() => setFavoritesOpen(false)} />}
    </header>
  )
}
