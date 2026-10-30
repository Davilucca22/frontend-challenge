import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { ArrowLeft, Heart, Home, ScanLine, Search, ShoppingCart, UserRound } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { httpClient } from '../../infrastructure/http/axios-client'
import type { CartLine } from '../../domain/entities/Cart'
import { useAuth } from '../providers/AuthProvider'

export function Header() {
  const { user, logout, loading } = useAuth()
  const navigate = useNavigate()
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
  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: async () => (await httpClient.get<{ items: CartLine[] }>('/cart')).data,
  })
  const count = cartQuery.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0
  return (
    <header className={`site-header ${authPage ? 'site-header-auth' : pathname === '/' ? 'site-header-home' : 'site-header-inner'}`}>
      <Link to="/" className="brand" aria-label="Kurio início">KURIO</Link>
      <nav className="desktop-nav" aria-label="Navegação principal">
        <Link to="/">Início</Link><a href="#catalog">Mercado</a><a href="#creators">Criadores</a><a href="#about">Aprenda</a>
      </nav>
      <div className="header-actions">
        <Link className="icon-button header-search" to="/" aria-label="Buscar NFTs"><Search size={18} /></Link>
        {user && <Link className="icon-button" to="/profile" aria-label="Favoritos"><Heart size={17} /></Link>}
        <Link className="icon-button cart-link" to="/cart" aria-label={`Carrinho, ${count} itens`}><ShoppingCart size={18} />{count > 0 && <span className="cart-count">{count}</span>}</Link>
        {user ? <div className="user-menu"><Link to="/profile">{user.username}</Link><button className="text-button" onClick={() => void logout().then(() => navigate({ to: '/' }))}>Sair</button></div> : <Link className="button button-small" to="/login" search={{ redirect: '/' }}><UserRound size={14} />{loading ? '...' : 'Entrar'}</Link>}
      </div>
      {!authPage && pathname !== '/' && <div className="mobile-page-bar">
        <button className="mobile-back-button" type="button" aria-label="Voltar" onClick={() => void navigate({ to: pathname === '/checkout' ? '/cart' : '/' })}><ArrowLeft size={17} /></button>
        {mobileTitle && <span>{mobileTitle}</span>}
        {pathname.startsWith('/nft/') && <button className="icon-button" type="button" aria-label="Alternar NFT nos favoritos" onClick={() => user ? window.dispatchEvent(new Event('kurio:toggle-favorite')) : void navigate({ to: '/login', search: { redirect: pathname } })}><Heart size={16} /></button>}
      </div>}
      <nav className="mobile-nav" aria-label="Navegação mobile">
        <Link to="/" aria-label="Início"><Home size={17} /></Link>
        <Link to={user ? '/profile' : '/login'} search={user ? undefined : { redirect: '/profile' }} aria-label="Favoritos"><Heart size={17} /></Link>
        <Link className="mobile-explore-link" to="/" hash="catalog" aria-label="Explorar coleções"><ScanLine size={17} /></Link>
        <Link to="/cart" aria-label="Carrinho"><ShoppingCart size={17} />{count > 0 && <span className="cart-count">{count}</span>}</Link>
        <Link to={user ? '/profile' : '/login'} search={user ? undefined : { redirect: '/profile' }} aria-label="Conta"><UserRound size={17} /></Link>
      </nav>
    </header>
  )
}
