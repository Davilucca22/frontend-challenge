import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { ArrowDownWideNarrow, ArrowRight, Search, SlidersHorizontal } from 'lucide-react'
import type { NFTSearch } from '../../domain/entities/NFT'
import { HttpNFTRepository } from '../../infrastructure/repositories/HttpNFTRepository'
import { httpClient } from '../../infrastructure/http/axios-client'
import { errorMessage } from '../../shared/utils/format'
import { artwork } from '../../shared/constants/assets'
import { useAuth } from '../providers/AuthProvider'
import { Feedback } from '../components/Feedback'
import { LoadingGrid } from '../components/Loading'
import { NFTCard } from '../components/NFTCard'

const nftRepository = new HttpNFTRepository()
const categories = ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Colecionáveis']

export function HomePage() {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [draft, setDraft] = useState(search.q ?? '')
  const catalogQuery = useQuery({
    queryKey: ['nfts', search],
    queryFn: ({ signal }) => nftRepository.list(search, signal),
  })
  const favoritesQuery = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => nftRepository.getFavorites(),
    enabled: Boolean(user),
    retry: false,
  })
  const favoriteMutation = useMutation({
    mutationFn: (id: string) => nftRepository.setFavorite(id, !(favoritesQuery.data ?? []).includes(id)),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['favorites', user?.id] })
      const previous = queryClient.getQueryData<string[]>(['favorites', user?.id]) ?? []
      queryClient.setQueryData<string[]>(['favorites', user?.id], previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id])
      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context) queryClient.setQueryData(['favorites', user?.id], context.previous)
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] }),
  })
  const addMutation = useMutation({
    mutationFn: (nftId: string) => httpClient.put(`/cart/items/${nftId}`, { quantity: 1 }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['cart'] }),
  })
  const pages = Math.max(1, Math.ceil((catalogQuery.data?.total ?? 0) / (catalogQuery.data?.pageSize ?? 9)))
  const currentPage = search.page ?? 1
  const updateSearch = (patch: Partial<NFTSearch>) => {
    void navigate({ search: (previous) => ({ ...previous, ...patch }) })
  }
  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    updateSearch({ q: draft.trim() || undefined, page: 1 })
  }
  const highlighted = useMemo(() => catalogQuery.data?.items.slice(0, 3) ?? [], [catalogQuery.data])

  return (
    <main>
      <div className="mobile-search-row page-shell">
        <form className="mobile-search-form" onSubmit={submitSearch}>
          <label className="sr-only" htmlFor="mobile-catalog-search">Buscar por NFT ou coleção</label>
          <Search size={14} aria-hidden="true" />
          <input id="mobile-catalog-search" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Explorar coleções" />
        </form>
        <button className="mobile-filter-button" type="button" aria-label="Abrir filtros" onClick={() => setMobileFiltersOpen((open) => !open)}><SlidersHorizontal size={15} /></button>
      </div>
      <section className="hero page-shell">
        <div className="hero-copy">
          <span className="eyebrow">Bem-vindo à Kurio</span>
          <h1><span className="hero-title-desktop">SEJA DONO DO FUTURO<br />DA ARTE DIGITAL.</span><span className="hero-title-mobile">SEJA DONO DA<br />CULTURA DIGITAL.</span></h1>
          <p>Descubra NFTs selecionados de criadores do mundo todo.</p>
          <a className="button" href="#catalog">Explorar <ArrowRight size={15} /></a>
        </div>
        <div className="hero-art"><img src={artwork.emerald} alt="Macaco colecionável digital da coleção Kurio Apes" /><img className="hero-art-secondary" src={artwork.sage} alt="" /><span className="hero-sticker">EDIÇÃO<br /><b>LIMITADA</b></span></div>
        <div className="hero-pagination" aria-hidden="true"><span /><span /><span /></div>
      </section>

      <section className="page-shell catalog-section" id="catalog">
        <div className="section-heading">
          <div><span className="eyebrow">Explore</span><h2>Descubra colecionáveis</h2></div>
          <span className="muted">{catalogQuery.data?.total ?? '—'} NFTs selecionados</span>
        </div>
        <div className="catalog-layout">
          <aside className={`filter-panel ${mobileFiltersOpen ? 'open' : ''}`} aria-label="Filtros do catálogo">
            <form className="search-form" onSubmit={submitSearch}>
              <label className="sr-only" htmlFor="catalog-search">Buscar por NFT ou coleção</label>
              <input id="catalog-search" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Buscar coleção..." />
              <button className="icon-button" aria-label="Buscar"><Search size={16} /></button>
            </form>
            <button type="button" className="mobile-filter-toggle" aria-expanded={mobileFiltersOpen} onClick={() => setMobileFiltersOpen((open) => !open)}><SlidersHorizontal size={15} />{mobileFiltersOpen ? 'Fechar filtros' : 'Filtros'}</button>
            <div className="filter-group"><h3>Coleções</h3>
              <button className={`filter-option ${!search.category ? 'selected' : ''}`} onClick={() => updateSearch({ category: undefined, page: 1 })}>Todas as categorias</button>
              {categories.map((category) => <button className={`filter-option ${search.category === category ? 'selected' : ''}`} key={category} onClick={() => updateSearch({ category: search.category === category ? undefined : category, page: 1 })}>{category}</button>)}
            </div>
            <div className="filter-group"><h3>Rede</h3>
              {['Ethereum', 'Polygon', 'Solana'].map((network) => <label className="check-option" key={network}><input type="checkbox" checked={search.network === network} onChange={() => updateSearch({ network: search.network === network ? undefined : network, page: 1 })} />{network}</label>)}
            </div>
            <div className="filter-group"><h3>Faixa de preço (ETH)</h3>
              <div className="range-fields"><label><span className="sr-only">Preço mínimo</span><input aria-label="Preço mínimo" type="number" min="0" step="0.01" value={search.min ?? ''} placeholder="Mín." onChange={(event) => updateSearch({ min: event.target.value || undefined, page: 1 })} /></label><label><span className="sr-only">Preço máximo</span><input aria-label="Preço máximo" type="number" min="0" step="0.01" value={search.max ?? ''} placeholder="Máx." onChange={(event) => updateSearch({ max: event.target.value || undefined, page: 1 })} /></label></div>
            </div>
          </aside>
          <div className="catalog-content">
            <div className="catalog-toolbar">
                <div className="catalog-tabs"><button className="active" type="button">Todos os NFTs</button><button type="button" className="muted">Novos lançamentos</button><button type="button" className="muted">Em alta</button></div>
              <label className="sort-control"><ArrowDownWideNarrow size={15} /><span className="sr-only">Ordenar NFTs</span><select value={search.sort ?? 'recent'} onChange={(event) => updateSearch({ sort: event.target.value as NFTSearch['sort'], page: 1 })}><option value="recent">Mais recentes</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option></select></label>
            </div>
            {catalogQuery.isPending ? <LoadingGrid /> : catalogQuery.isError ? <Feedback>{errorMessage(catalogQuery.error, 'Não foi possível carregar o catálogo.')}</Feedback> : catalogQuery.data?.items.length ? (
              <>
                <div className="nft-grid">{catalogQuery.data.items.map((nft) => <NFTCard key={nft.id} nft={nft} favorite={favoritesQuery.data?.includes(nft.id)} onFavorite={() => user ? favoriteMutation.mutate(nft.id) : void navigate({ to: '/login', search: { redirect: '/' } })} onAddToCart={() => addMutation.mutate(nft.id)} />)}</div>
                <nav className="pagination" aria-label="Paginação do catálogo">
                  <button disabled={currentPage <= 1} onClick={() => updateSearch({ page: currentPage - 1 })} aria-label="Página anterior">‹</button>
                  {Array.from({ length: pages }, (_, index) => index + 1).map((page) => <button key={page} className={page === currentPage ? 'active' : ''} onClick={() => updateSearch({ page })} aria-label={`Página ${page}`} aria-current={page === currentPage ? 'page' : undefined}>{page}</button>)}
                  <button disabled={currentPage >= pages} onClick={() => updateSearch({ page: currentPage + 1 })} aria-label="Próxima página">›</button>
                </nav>
              </>
            ) : <div className="empty-state"><h3>Nenhum NFT encontrado</h3><p>Tente remover alguns filtros ou buscar outro termo.</p><button className="button button-outline" onClick={() => { setDraft(''); void navigate({ search: {} }) }}>Limpar filtros</button></div>}
          </div>
        </div>
      </section>

      <section className="creator-banner page-shell" id="creators">
        {highlighted.slice(0, 2).map((nft) => <article key={nft.id}><img src={nft.image} alt="" /><div><span className="eyebrow">Conheça o artista</span><h3>{nft.creator}</h3><p>Peças digitais selecionadas da coleção {nft.collection}.</p><Link to="/nft/$nftId" params={{ nftId: nft.id }}>Conhecer coleção <ArrowRight size={14} /></Link></div></article>)}
      </section>
      <section className="page-shell about-section" id="about"><span className="eyebrow">Colecione com confiança</span><h2>Arte digital, feita para durar.</h2><p>Descubra criadores independentes e encontre uma peça que conte a sua história.</p></section>
    </main>
  )
}
