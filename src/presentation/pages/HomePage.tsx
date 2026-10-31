import { tw } from '../../shared/tw'
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
// Conteúdos editoriais que conectam as histórias do marketplace às NFTs reais.
const mintingStories = [
  {
    id: 'ivory-baron-088',
    image: artwork.ivory,
    imageAlt: 'Arte do Ivory Baron, da coleção Kurio Apes',
    category: 'Processo criativo',
    title: 'Como nasce uma edição digital',
    summary: 'Da primeira ideia à arte final, cada etapa preserva a identidade de quem cria.',
  },
  {
    id: 'emerald-ape-042',
    image: artwork.emerald,
    imageAlt: 'Arte do Emerald Ape, da coleção Kurio Apes',
    category: 'Cunhagem',
    title: 'O que acontece na cunhagem?',
    summary: 'A obra recebe um registro único e verificável na rede escolhida para a coleção.',
  },
  {
    id: 'sage-nomad-069',
    image: artwork.sage,
    imageAlt: 'Arte do Sage Nomad, da coleção Kurio Apes',
    category: 'Coleções',
    title: 'Edições, raridade e autenticidade',
    summary: 'Tiragem e disponibilidade ajudam a contar a história de cada peça colecionável.',
  },
  {
    id: 'golden-beat-207',
    image: artwork.golden,
    imageAlt: 'Arte do Golden Beat, da coleção Kurio Apes',
    category: 'Redes',
    title: 'Escolhendo uma rede para a coleção',
    summary: 'Taxas, velocidade e comunidade também fazem parte de cada lançamento digital.',
  },
]

export function HomePage() {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [draft, setDraft] = useState(search.q ?? '')
  // Mantém catálogo e favoritos em queries separadas para refletir filtros e conta.
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
  // Atualiza o carrinho após incluir um item pelo cartão de catálogo.
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
  // Usa os primeiros resultados atuais como destaques sem fazer uma segunda busca.
  const highlighted = useMemo(() => catalogQuery.data?.items.slice(0, 3) ?? [], [catalogQuery.data])

  return (
    <main>
      {/* Busca compacta e filtros para navegação em telas estreitas. */}
      <div className={"[display:none] max-[640px]:[display:flex] max-[640px]:[width:calc(100%_-_36px)] max-[640px]:[align-items:center] max-[640px]:[gap:8px] max-[640px]:[margin:42px_auto_0] [width:min(var(--content),_calc(100%_-_64px))] [margin-inline:auto] max-[900px]:[width:calc(100%_-_42px)] max-[640px]:[width:calc(100%_-_36px)] mobile-search-row page-shell"}>
        <form className={"max-[640px]:[min-width:0] max-[640px]:[height:37px] max-[640px]:[display:flex] max-[640px]:[flex:1] max-[640px]:[align-items:center] max-[640px]:[gap:8px] max-[640px]:[padding:0_11px] max-[640px]:[color:var(--accent-light)] max-[640px]:[background:#261810] max-[640px]:[border:1px_solid_#382418] max-[640px]:[border-radius:10px] max-[640px]:[&_input]:[min-height:32px] max-[640px]:[&_input]:[padding:0] max-[640px]:[&_input]:[border:0] max-[640px]:[&_input]:[outline:0] max-[640px]:[&_input]:[background:transparent] max-[640px]:[&_input]:[font-size:14px] max-[640px]:[&_input:focus-visible]:[outline:0] mobile-search-form"} onSubmit={submitSearch}>
          <label className={"[position:absolute] [width:1px] [height:1px] [padding:0] [margin:-1px] [overflow:hidden] [clip:rect(0,_0,_0,_0)] [white-space:nowrap] [border:0] sr-only"} htmlFor="mobile-catalog-search">Buscar por NFT ou coleção</label>
          <Search size={14} aria-hidden="true" />
          <input id="mobile-catalog-search" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Explorar coleções" />
        </form>
        <button className={"max-[640px]:[width:37px] max-[640px]:[height:37px] max-[640px]:[display:grid] max-[640px]:[place-items:center] max-[640px]:[border:1px_solid_#503522] max-[640px]:[border-radius:10px] max-[640px]:[color:#1a100c] max-[640px]:[background:var(--accent)] mobile-filter-button"} type="button" aria-label="Abrir filtros" onClick={() => setMobileFiltersOpen((open) => !open)}><SlidersHorizontal size={15} /></button>
      </div>
      {/* Hero com chamada principal e imagem responsiva de destaque. */}
      <section className={"[min-height:400px] [margin-top:30px] [padding:44px_7%] [display:grid] [grid-template-columns:1.1fr_.9fr] [gap:50px] [align-items:center] [border-radius:10px] [background:radial-gradient(ellipse_at_70%_55%,_#54321c_0,_#291a12_47%,_#21150f_100%)] [overflow:hidden] [&_h1]:[margin:13px_0] [&_h1]:[max-width:580px] [&_h1]:[font-size:clamp(28px,_4vw,_48px)] [&_h1]:[line-height:1.24] max-[640px]:[position:relative] max-[640px]:[width:calc(100%_-_36px)] max-[640px]:[min-height:0] max-[640px]:[height:190px] max-[640px]:[margin-top:12px] max-[640px]:[padding:16px_12px] max-[640px]:[grid-template-columns:minmax(0,_1fr)_104px] max-[640px]:[gap:8px] max-[640px]:[border-radius:22px] max-[640px]:[background:radial-gradient(circle_at_72%_45%,_#70492e_0,_#3c271b_45%,_#281912_100%)] max-[640px]:[&_h1]:[margin:4px_0_6px] max-[640px]:[&_h1]:[font-size:14px] max-[640px]:[&_h1]:[line-height:1.35] max-[640px]:[&_h1]:[letter-spacing:0] [width:min(var(--content),_calc(100%_-_64px))] [margin-inline:auto] max-[900px]:[width:calc(100%_-_42px)] max-[640px]:[width:calc(100%_-_36px)] hero page-shell"}>
        <div className={"[position:relative] [z-index:1] [&_p]:[max-width:430px] [&_p]:[margin-bottom:25px] [&_p]:[color:#c4a98b] [&_p]:[font-size:14px] [&_p]:[font-weight:500] max-[640px]:[align-self:start] max-[640px]:[&_.eyebrow]:[font-size:8px] max-[640px]:[&_.eyebrow]:[letter-spacing:.03em] max-[640px]:[&_.eyebrow]:[text-transform:none] max-[640px]:[&_p]:[max-width:160px] max-[640px]:[&_p]:[margin-bottom:2px] max-[640px]:[&_p]:[line-height:1.35] max-[640px]:[&_.button]:[min-height:18px] max-[640px]:[&_.button]:[padding:0] max-[640px]:[&_.button]:[color:var(--accent-light)] max-[640px]:[&_.button]:[background:transparent] max-[640px]:[&_.button]:[border:0] max-[640px]:[&_.button]:[font-size:15px] max-[640px]:[&_.button]:[text-transform:uppercase] max-[640px]:[&_.button_svg]:[width:11px] hero-copy"}>
          <span className={"[color:var(--accent-light)] [font-size:10px] [letter-spacing:.17em] [text-transform:uppercase] eyebrow"}>Bem-vindo à Kurio</span>
          <h1><span className={"max-[640px]:[display:none] hero-title-desktop"}>SEJA DONO DO FUTURO<br />DA ARTE DIGITAL.</span><span className={"[display:none] max-[640px]:[display:inline] hero-title-mobile"}>SEJA DONO DA<br />CULTURA DIGITAL.</span></h1>
          <p>Descubra NFTs selecionados de criadores do mundo todo.</p>
          <a className={"[min-height:42px] [padding:0_20px] [display:inline-flex] [justify-content:center] [align-items:center] [gap:9px] [border:1px_solid_var(--accent)] [border-radius:6px] [color:#1b1009] [background:var(--accent)] [font-weight:700] [font-size:15px] [cursor:pointer] [transition:background_.15s,_transform_.15s] [&:hover]:[color:#1b1009] [&:hover]:[background:var(--accent-light)] [&:hover]:[transform:translateY(-1px)] [&:disabled]:[transform:none] [&:disabled]:[cursor:not-allowed] [&:disabled]:[opacity:.52] [&.disabled]:[transform:none] [&.disabled]:[cursor:not-allowed] [&.disabled]:[opacity:.52] button"} href="#catalog">Explorar <ArrowRight size={15} /></a>
        </div>
        <div className={"[position:relative] [justify-self:center] [width:min(100%,_380px)] [&_img]:[width:100%] [&_img]:[aspect-ratio:1_/_1] [&_img]:[border-radius:12px] [&_img]:[object-fit:cover] [&_img]:[background:#d2d2ae] [&_img.hero-art-secondary]:[display:none] max-[640px]:[width:104px] max-[640px]:[height:106px] max-[640px]:[justify-self:end] max-[640px]:[align-self:center] max-[640px]:[&_img]:[width:100%] max-[640px]:[&_img]:[height:100%] max-[640px]:[&_img]:[aspect-ratio:1] max-[640px]:[&_img]:[border-radius:12px] max-[640px]:[&_img]:[object-fit:cover] max-[640px]:[&_img.hero-art-secondary]:[display:block] max-[640px]:[&_img.hero-art-secondary]:[position:absolute] max-[640px]:[&_img.hero-art-secondary]:[right:70px] max-[640px]:[&_img.hero-art-secondary]:[bottom:3px] max-[640px]:[&_img.hero-art-secondary]:[width:40px] max-[640px]:[&_img.hero-art-secondary]:[height:40px] max-[640px]:[&_img.hero-art-secondary]:[border:2px_solid_#281912] max-[640px]:[&_img.hero-art-secondary]:[border-radius:10px] hero-art"}>
          <img src={artwork.emerald} alt="Macaco colecionável digital da coleção Kurio Apes" />
          <img className={"hero-art-secondary"} src={artwork.sage} alt="" /><span className={"[position:absolute] [right:-16px] [bottom:20px] [padding:12px] [color:#21140c] [background:var(--accent-light)] [font-size:14px] [line-height:1.25] [transform:rotate(4deg)] max-[640px]:[display:none] hero-sticker"}>EDIÇÃO<br /><b>LIMITADA</b></span></div>
        <div className={"max-[640px]:[position:absolute] max-[640px]:[bottom:7px] max-[640px]:[left:50%] max-[640px]:[display:flex] max-[640px]:[gap:5px] max-[640px]:[transform:translateX(-50%)] max-[640px]:[&_span]:[width:5px] max-[640px]:[&_span]:[height:5px] max-[640px]:[&_span]:[border-radius:50%] max-[640px]:[&_span]:[background:#d78c49] hero-pagination"} aria-hidden="true"><span /><span /><span /></div>
      </section>

      <section className={"[width:min(var(--content),_calc(100%_-_64px))] [margin-inline:auto] max-[900px]:[width:calc(100%_-_42px)] max-[640px]:[width:calc(100%_-_36px)] [padding-top:68px] max-[640px]:[width:calc(100%_-_36px)] max-[640px]:[padding-top:10px] page-shell catalog-section"} id="catalog">
        <div className={"[display:flex] [align-items:end] [justify-content:space-between] [gap:20px] [margin-bottom:25px] [&_h2]:[margin:5px_0_0] max-[640px]:[display:none] section-heading"}>
          <div><span className={"[color:var(--accent-light)] [font-size:10px] [letter-spacing:.17em] [text-transform:uppercase] eyebrow"}>Explore</span><h2>Descubra colecionáveis</h2></div>
          <span className={"[color:var(--muted)] muted"}>{catalogQuery.data?.total ?? '—'} NFTs selecionados</span>
        </div>
        <div className={"[display:grid] [grid-template-columns:235px_minmax(0,_1fr)] [align-items:start] [gap:30px] max-[900px]:[grid-template-columns:190px_minmax(0,_1fr)] max-[900px]:[gap:17px] max-[640px]:[display:block] catalog-layout"}>
          <aside className={tw(`filter-panel ${mobileFiltersOpen ? 'open' : ''}`)} aria-label="Filtros do catálogo">
            <form className={"[display:flex] [gap:5px] [margin-bottom:24px] [&_input]:[width:100%] [&_input]:[min-width:0] search-form"} onSubmit={submitSearch}>
              <label className={"[position:absolute] [width:1px] [height:1px] [padding:0] [margin:-1px] [overflow:hidden] [clip:rect(0,_0,_0,_0)] [white-space:nowrap] [border:0] sr-only"} htmlFor="catalog-search">Buscar por NFT ou coleção</label>
              <input id="catalog-search" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Buscar coleção..." />
              <button className={"[min-width:34px] [min-height:34px] [display:inline-flex] [align-items:center] [justify-content:center] [color:var(--muted)] [background:transparent] [border:0] [border-radius:50%] [cursor:pointer] [position:relative] [&:hover]:[background:#382317] [&:hover]:[color:var(--accent-light)] [&.large]:[width:42px] [&.large]:[height:42px] [&.large]:[border:1px_solid_var(--border)] icon-button"} aria-label="Buscar"><Search size={16} /></button>
            </form>
            <button type="button" className={"[display:none] mobile-filter-toggle"} aria-expanded={mobileFiltersOpen} onClick={() => setMobileFiltersOpen((open) => !open)}><SlidersHorizontal size={15} />{mobileFiltersOpen ? 'Fechar filtros' : 'Filtros'}</button>
            <div className={"[padding:17px_0] [border-top:1px_solid_#49301f] [&_h3]:[margin-bottom:11px] [&_h3]:[font-size:12px] filter-group"}><h3>Coleções</h3>
              <button className={tw(`filter-option ${!search.category ? 'selected' : ''}`)} onClick={() => updateSearch({ category: undefined, page: 1 })}>Todas as categorias</button>
              {categories.map((category) => <button className={tw(`filter-option ${search.category === category ? 'selected' : ''}`)} key={category} onClick={() => updateSearch({ category: search.category === category ? undefined : category, page: 1 })}>{category}</button>)}
            </div>
            <div className={"[padding:17px_0] [border-top:1px_solid_#49301f] [&_h3]:[margin-bottom:11px] [&_h3]:[font-size:12px] filter-group"}><h3>Rede</h3>
              {['Ethereum', 'Polygon', 'Solana'].map((network) => <label className={"[display:flex] [align-items:center] [gap:9px] [margin:7px_0] [color:var(--muted)] [font-size:14px] [&_input]:[width:15px] [&_input]:[min-height:15px] [&_input]:[accent-color:var(--accent)] check-option"} key={network}><input type="checkbox" checked={search.network === network} onChange={() => updateSearch({ network: search.network === network ? undefined : network, page: 1 })} />{network}</label>)}
            </div>
            <div className={"[padding:17px_0] [border-top:1px_solid_#49301f] [&_h3]:[margin-bottom:11px] [&_h3]:[font-size:12px] filter-group"}><h3>Faixa de preço (ETH)</h3>
              <div className={"[display:flex] [gap:8px] [&_input]:[min-width:0] range-fields"}><label><span className={"[position:absolute] [width:1px] [height:1px] [padding:0] [margin:-1px] [overflow:hidden] [clip:rect(0,_0,_0,_0)] [white-space:nowrap] [border:0] sr-only"}>Preço mínimo</span><input aria-label="Preço mínimo" type="number" min="0" step="0.01" value={search.min ?? ''} placeholder="Mín." onChange={(event) => updateSearch({ min: event.target.value || undefined, page: 1 })} /></label><label><span className={"[position:absolute] [width:1px] [height:1px] [padding:0] [margin:-1px] [overflow:hidden] [clip:rect(0,_0,_0,_0)] [white-space:nowrap] [border:0] sr-only"}>Preço máximo</span><input aria-label="Preço máximo" type="number" min="0" step="0.01" value={search.max ?? ''} placeholder="Máx." onChange={(event) => updateSearch({ max: event.target.value || undefined, page: 1 })} /></label></div>
            </div>
          </aside>
          <div className={"max-[640px]:[display:contents] catalog-content"}>
            {favoriteMutation.isError && <Feedback>{errorMessage(favoriteMutation.error, 'Não foi possível atualizar os favoritos. Tente novamente.')}</Feedback>}
            {addMutation.isError && <Feedback>{errorMessage(addMutation.error, 'Não foi possível adicionar este NFT ao carrinho.')}</Feedback>}
            <div className={"[display:flex] [align-items:center] [justify-content:space-between] [margin:0_0_18px] max-[640px]:[margin:0_0_9px] catalog-toolbar"}>
                <div className={"[display:flex] [gap:20px] [font-size:14px] max-[640px]:[width:100%] max-[640px]:[justify-content:space-between] max-[640px]:[gap:7px] max-[640px]:[overflow-x:auto] max-[640px]:[font-size:14px] max-[640px]:[white-space:nowrap] max-[640px]:[&_button]:[padding:2px_0] max-[640px]:[&_button]:[border:0] max-[640px]:[&_button]:[color:inherit] max-[640px]:[&_button]:[background:transparent] max-[640px]:[&_button]:[font:inherit] max-[640px]:[&_button.active]:[color:var(--accent-light)] max-[640px]:[&_button.active]:[font-weight:700] max-[640px]:[&_button.active]:[text-decoration:underline] max-[640px]:[&_button.active]:[text-underline-offset:4px] catalog-tabs"}><button className={"active"} type="button">Todos os NFTs</button><button type="button" className={"[color:var(--muted)] muted"}>Novos lançamentos</button><button type="button" className={"[color:var(--muted)] muted"}>Em alta</button></div>
              <label className={"[display:flex] [align-items:center] [gap:8px] [color:var(--muted)] [&_select]:[width:auto] [&_select]:[border:0] [&_select]:[background:transparent] [&_select]:[padding:6px] [&_select]:[color:var(--text)] max-[640px]:[display:none] sort-control"}><ArrowDownWideNarrow size={15} /><span className={"[position:absolute] [width:1px] [height:1px] [padding:0] [margin:-1px] [overflow:hidden] [clip:rect(0,_0,_0,_0)] [white-space:nowrap] [border:0] sr-only"}>Ordenar NFTs</span><select value={search.sort ?? 'recent'} onChange={(event) => updateSearch({ sort: event.target.value as NFTSearch['sort'], page: 1 })}><option value="recent">Mais recentes</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option></select></label>
            </div>
            {catalogQuery.isPending ? <LoadingGrid /> : catalogQuery.isError ? <Feedback onRetry={() => void catalogQuery.refetch()}>{errorMessage(catalogQuery.error, 'Não foi possível carregar o catálogo.')}</Feedback> : catalogQuery.data?.items.length ? (
              <>
                <div className={"[display:grid] [grid-template-columns:repeat(3,_minmax(0,_1fr))] [gap:25px_20px] max-[900px]:[gap:17px_12px] max-[640px]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] max-[640px]:[align-items:start] max-[640px]:[gap:12px_14px] nft-grid"}>{catalogQuery.data.items.map((nft) => <NFTCard key={nft.id} nft={nft} favorite={favoritesQuery.data?.includes(nft.id)} onFavorite={() => user ? favoriteMutation.mutate(nft.id) : void navigate({ to: '/login', search: { redirect: '/' } })} onAddToCart={() => addMutation.mutate(nft.id)} />)}</div>
                <nav className={"[display:flex] [justify-content:center] [gap:5px] [margin:26px_0] [&_button]:[width:31px] [&_button]:[height:31px] [&_button]:[color:var(--muted)] [&_button]:[background:transparent] [&_button]:[border:1px_solid_var(--border)] [&_button]:[border-radius:4px] [&_button]:[cursor:pointer] [&_button.active]:[color:#21140c] [&_button.active]:[background:var(--accent)] [&_button.active]:[border-color:var(--accent)] [&_button:hover:not(:disabled)]:[color:#21140c] [&_button:hover:not(:disabled)]:[background:var(--accent)] [&_button:hover:not(:disabled)]:[border-color:var(--accent)] max-[640px]:[margin:18px_0] pagination"} aria-label="Paginação do catálogo">
                  <button disabled={currentPage <= 1} onClick={() => updateSearch({ page: currentPage - 1 })} aria-label="Página anterior">‹</button>
                  {Array.from({ length: pages }, (_, index) => index + 1).map((page) => <button key={page} className={tw(page === currentPage ? 'active' : '')} onClick={() => updateSearch({ page })} aria-label={`Página ${page}`} aria-current={page === currentPage ? 'page' : undefined}>{page}</button>)}
                  <button disabled={currentPage >= pages} onClick={() => updateSearch({ page: currentPage + 1 })} aria-label="Próxima página">›</button>
                </nav>
              </>
            ) : <div className={"[min-height:280px] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center] [padding:40px_20px] [text-align:center] [&_p]:[color:var(--muted)] empty-state"}><h3>Nenhum NFT encontrado</h3><p>Tente remover alguns filtros ou buscar outro termo.</p><button className={"[min-height:42px] [padding:0_20px] [display:inline-flex] [justify-content:center] [align-items:center] [gap:9px] [border:1px_solid_var(--accent)] [border-radius:6px] [color:#1b1009] [background:var(--accent)] [font-weight:700] [font-size:14px] [cursor:pointer] [transition:background_.15s,_transform_.15s] [&:hover]:[color:#1b1009] [&:hover]:[background:var(--accent-light)] [&:hover]:[transform:translateY(-1px)] [&:disabled]:[transform:none] [&:disabled]:[cursor:not-allowed] [&:disabled]:[opacity:.52] [&.disabled]:[transform:none] [&.disabled]:[cursor:not-allowed] [&.disabled]:[opacity:.52] [color:var(--accent-light)] [background:transparent] [&:hover]:[color:var(--bg)] button button-outline"} onClick={() => { setDraft(''); void navigate({ search: {} }) }}>Limpar filtros</button></div>}
          </div>
        </div>
      </section>

      <section className={"[display:grid] [grid-template-columns:1fr_1fr] [gap:18px] [margin-top:60px] [&_article]:[display:flex] [&_article]:[align-items:center] [&_article]:[gap:18px] [&_article]:[padding:18px] [&_article]:[background:var(--panel)] [&_article]:[border-radius:7px] [&_img]:[width:115px] [&_img]:[aspect-ratio:1] [&_img]:[object-fit:cover] [&_img]:[border-radius:5px] [&_h3]:[margin:3px_0] [&_p]:[margin:0_0_6px] [&_p]:[color:var(--muted)] [&_p]:[font-size:14px] [&_p]:[font-weight:500] [&_a]:[display:inline-flex] [&_a]:[align-items:center] [&_a]:[gap:6px] [&_a]:[color:var(--accent-light)] [&_a]:[font-size:15px] max-[640px]:[grid-template-columns:1fr] max-[640px]:[gap:8px] max-[640px]:[margin-top:34px] max-[640px]:[&_article]:[padding:11px] max-[640px]:[&_img]:[width:84px] max-[640px]:[&_h3]:[font-size:13px] [width:min(var(--content),_calc(100%_-_64px))] [margin-inline:auto] max-[900px]:[width:calc(100%_-_42px)] max-[640px]:[width:calc(100%_-_36px)] creator-banner page-shell"} id="creators">
        {highlighted.slice(0, 2).map((nft) => <article key={nft.id}><img src={nft.image} alt="" /><div><span className={"[color:var(--accent-light)] [font-size:10px] [letter-spacing:.17em] [text-transform:uppercase] eyebrow"}>Conheça o artista</span><h3>{nft.creator}</h3><p>Peças digitais selecionadas da coleção {nft.collection}.</p><Link to="/nft/$nftId" params={{ nftId: nft.id }}>Conhecer coleção <ArrowRight size={14} /></Link></div></article>)}
      </section>
      <section className={"[width:min(var(--content),_calc(100%_-_64px))] [margin:66px_auto_0] max-[900px]:[width:calc(100%_-_42px)] max-[640px]:[width:calc(100%_-_36px)] max-[640px]:[margin-top:42px] minting-diary page-shell"} aria-labelledby="minting-diary-title">
        <header className={"[margin-bottom:24px] [text-align:center] max-[640px]:[margin-bottom:16px] minting-diary-heading"}>
          <span className={"[color:var(--accent-light)] [font-size:10px] [letter-spacing:.17em] [text-transform:uppercase] eyebrow"}>Histórias por trás das coleções</span>
          <h2 id="minting-diary-title" className={"[margin:8px_0] [font-size:clamp(20px,_2.4vw,_28px)] max-[640px]:[font-size:19px]"}>Diário de Cunhagem</h2>
          <p className={"[max-width:620px] [margin:0_auto] [color:var(--muted)] [font-size:14px] [font-weight:500] max-[640px]:[font-size:12px]"}>Conheça as ideias, escolhas e etapas que dão vida a cada coleção digital.</p>
        </header>
        <div className={"[display:grid] [grid-template-columns:repeat(4,_minmax(0,_1fr))] [gap:18px] max-[900px]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] max-[640px]:[gap:10px] minting-diary-grid"}>
          {mintingStories.map((story) => (
            <article className={"[min-width:0] [overflow:hidden] [border:1px_solid_#382418] [border-radius:7px] [background:#241610] [&_img]:[width:100%] [&_img]:[aspect-ratio:1.45_/_1] [&_img]:[object-fit:cover] [&_h3]:[margin:7px_0] [&_h3]:[font-size:16px] [&_p]:[margin:0] [&_p]:[color:var(--muted)] [&_p]:[font-size:13px] [&_p]:[font-weight:500] max-[640px]:[border-radius:10px] max-[640px]:[&_img]:[aspect-ratio:1_/_1] max-[640px]:[&_h3]:[font-size:13px] max-[640px]:[&_p]:[font-size:11px] minting-diary-card"} key={story.id}>
              <img src={story.image} alt={story.imageAlt} loading="lazy" />
              <div className={"[display:flex] [min-height:172px] [flex-direction:column] [align-items:start] [padding:14px] max-[640px]:[min-height:190px] max-[640px]:[padding:10px] diary-card-content"}>
                <span className={"[color:var(--accent-light)] [font-size:10px] [letter-spacing:.12em] [text-transform:uppercase] max-[640px]:[font-size:9px] diary-category"}>{story.category}</span>
                <h3>{story.title}</h3>
                <p>{story.summary}</p>
                <Link className={"[display:inline-flex] [align-items:center] [gap:5px] [margin-top:auto] [padding-top:12px] [color:var(--accent-light)] [font-size:13px] [&:hover]:[color:#ffd39e] max-[640px]:[font-size:11px] diary-link"} to="/nft/$nftId" params={{ nftId: story.id }} aria-label={`Ler mais: ${story.title}`}>Ler mais... <ArrowRight size={14} aria-hidden="true" /></Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className={"[width:min(var(--content),_calc(100%_-_64px))] [margin-inline:auto] max-[900px]:[width:calc(100%_-_42px)] max-[640px]:[width:calc(100%_-_36px)] [padding:76px_0] [text-align:center] [&_h2]:[margin:12px_0] [&_p]:[color:var(--muted)] [&_p]:[font-size:14px] [&_p]:[font-weight:500] max-[640px]:[padding:48px_0] max-[640px]:[&_h2]:[font-size:19px] page-shell about-section"} id="about"><span className={"[color:var(--accent-light)] [font-size:10px] [letter-spacing:.17em] [text-transform:uppercase] eyebrow"}>Colecione com confiança</span><h2>Arte digital, feita para durar.</h2><p>Descubra criadores independentes e encontre uma peça que conte a sua história.</p></section>
    </main>
  )
}
