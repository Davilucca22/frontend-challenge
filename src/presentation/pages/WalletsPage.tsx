import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Pencil, Plus, WalletCards } from 'lucide-react'
import type { Wallet } from '../../domain/entities/User'
import { httpClient } from '../../infrastructure/http/axios-client'
import { useAuth } from '../providers/AuthProvider'
import { RequireAuth } from '../components/RequireAuth'
import { Feedback } from '../components/Feedback'
import { Skeleton } from '../components/Loading'
import { Checkbox } from '../../components/ui/checkbox'
import { errorMessage } from '../../shared/utils/format'

const emptyWallet: Omit<Wallet, 'id'> = { name: '', alias: '', address: '', network: 'Ethereum', type: 'MetaMask', email: '', ens: '', primary: false }

// Lista carteiras salvas e oferece formulário de criação e edição.
function WalletsContent() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Wallet | null>(null)
  const [form, setForm] = useState<Omit<Wallet, 'id'>>(emptyWallet)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const walletsQuery = useQuery({ queryKey: ['wallets', user?.id], queryFn: async () => (await httpClient.get<Wallet[]>('/wallets')).data })
  // Usa o mesmo endpoint para salvar carteiras novas ou substituir uma existente.
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, email: form.email || user?.email || '' }
      return editing
        ? (await httpClient.put<Wallet[]>(`/wallets/${editing.id}`, { ...payload, id: editing.id })).data
        : (await httpClient.post<Wallet[]>('/wallets', payload)).data
    },
    onSuccess: async (wallets) => {
      queryClient.setQueryData(['wallets', user?.id], wallets)
      setForm(emptyWallet)
      setEditing(null)
      setNotice('Carteira salva.')
      setError('')
    },
    onError: (reason) => { setError(errorMessage(reason)); setNotice('') },
  })
  const submit = (event: FormEvent) => { event.preventDefault(); saveMutation.mutate() }
  const selectEdit = (wallet: Wallet) => {
    // Preenche o formulário com a carteira escolhida e leva o formulário à vista.
    setEditing(wallet)
    setForm({ name: wallet.name, alias: wallet.alias, address: wallet.address, network: wallet.network, type: wallet.type, email: wallet.email, ens: wallet.ens, primary: wallet.primary })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  return (
    <div className={"[display:grid] [grid-template-columns:220px_minmax(0,_1fr)] [gap:32px] [align-items:start] max-[640px]:[grid-template-columns:1fr] max-[640px]:[gap:18px] account-layout"}>
      <aside className={"[display:grid] [gap:4px] [padding:17px] [background:var(--panel)] [border-radius:5px] [&_h2]:[padding-bottom:9px] [&_h2]:[border-bottom:1px_solid_#53351f] [&_h2]:[font-size:14px] [&_a]:[padding:8px_5px] [&_a]:[text-align:left] [&_a]:[color:var(--muted)] [&_a]:[font-size:15px] [&_.text-button]:[padding:8px_5px] [&_.text-button]:[text-align:left] [&_.text-button]:[color:var(--muted)] [&_.text-button]:[font-size:14px] [&_a.active]:[color:var(--accent-light)] [&_a:hover]:[color:var(--accent-light)] [&_a.active]:[border-left:2px_solid_var(--accent)] [&_a.active]:[padding-left:9px] max-[640px]:[grid-template-columns:repeat(3,_1fr)] max-[640px]:[padding:11px] max-[640px]:[&_h2]:[grid-column:1_/_-1] max-[640px]:[&_a]:[font-size:15px] max-[640px]:[&_.text-button]:[display:none] account-sidebar"}><h2>Meu perfil</h2><Link to="/profile">Dados do perfil</Link><Link className={"active"} to="/wallets">Carteiras</Link><Link to="/cart">Carrinho</Link></aside>
      <section className={"[&_h1]:[margin:5px_0_25px] [&_h1]:[font-size:24px] max-[640px]:[&_h1]:[font-size:21px] max-[640px]:[&_h1]:[margin-bottom:19px] account-content"}><span className={"[color:var(--accent-light)] [font-size:10px] [letter-spacing:.17em] [text-transform:uppercase] eyebrow"}>Conta e pagamento</span><h1>Minhas carteiras</h1><p className={"[color:var(--muted)] muted"}>Carteiras fictícias para simular a seleção de rede no checkout.</p>{notice && <Feedback tone="success">{notice}</Feedback>}{error && <Feedback>{error}</Feedback>}
        <div className={"[display:grid] [gap:8px] [margin:18px_0_28px] wallet-list"}>{walletsQuery.isPending ? <><Skeleton className={"[height:68px] wallet-skeleton"} /><Skeleton className={"[height:68px] wallet-skeleton"} /></> : walletsQuery.isError ? <Feedback>{errorMessage(walletsQuery.error)}</Feedback> : walletsQuery.data?.length ? walletsQuery.data.map((wallet) => <article className={"[display:flex] [align-items:center] [gap:13px] [padding:13px] [background:var(--panel)] [border:1px_solid_#49301f] [border-radius:5px] [&_>_div]:[display:grid] [&_>_div]:[flex:1] [&_>_div]:[gap:3px] [&_>_div]:[min-width:0] [&_span]:[overflow:hidden] [&_span]:[color:var(--muted)] [&_span]:[font-size:14px] [&_span]:[text-overflow:ellipsis] [&_span]:[white-space:nowrap] [&_small]:[overflow:hidden] [&_small]:[color:var(--muted)] [&_small]:[font-size:14px] [&_small]:[text-overflow:ellipsis] [&_small]:[white-space:nowrap] saved-wallet"} key={wallet.id}><WalletCards size={20} /><div><b>{wallet.alias || wallet.name} {wallet.primary && <span className={"[color:var(--accent-light)] [font-size:14px] verified"}>Principal</span>}</b><span>{wallet.address}</span><small>{wallet.network} · {wallet.type}</small></div><button className={"[min-width:34px] [min-height:34px] [display:inline-flex] [align-items:center] [justify-content:center] [color:var(--muted)] [background:transparent] [border:0] [border-radius:50%] [cursor:pointer] [position:relative] [&:hover]:[background:#382317] [&:hover]:[color:var(--accent-light)] [&.large]:[width:42px] [&.large]:[height:42px] [&.large]:[border:1px_solid_var(--border)] icon-button"} aria-label={`Editar carteira ${wallet.alias}`} onClick={() => selectEdit(wallet)}><Pencil size={15} /></button></article>) : <Feedback tone="info">Nenhuma carteira cadastrada ainda. Use o formulário abaixo para adicionar uma.</Feedback>}</div>
        <form className={"[&_label]:[display:grid] [&_label]:[gap:6px] [&_label]:[color:#dfd1c1] [&_label]:[font-size:14px] [display:grid] [gap:18px] [&_h2]:[font-size:16px] [padding-top:20px] [border-top:1px_solid_#51321f] max-[640px]:[&_.form-grid]:[grid-template-columns:1fr] wallet-form"} onSubmit={submit}><div className={"[display:flex] [align-items:center] [justify-content:space-between] wallet-form-heading"}><h2>{editing ? 'Editar carteira' : 'Adicionar carteira'}</h2><button className={"[padding:4px] [background:transparent] [border:0] [color:var(--accent-light)] [cursor:pointer] [display:inline-flex] [align-items:center] [gap:6px] [font-size:14px] [&:hover]:[color:#ffd39e] [&:hover]:[text-decoration:underline] text-button"} type="button" onClick={() => { setEditing(null); setForm(emptyWallet) }}><Plus size={14} /> Nova</button></div>
          <div className={"[&_label]:[display:grid] [&_label]:[gap:6px] [&_label]:[color:#dfd1c1] [&_label]:[font-size:14px] [display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:14px] max-[640px]:[grid-template-columns:1fr] max-[640px]:[gap:12px] form-grid"}><label>Nome de exibição *<input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label><label>Apelido da carteira *<input required value={form.alias} onChange={(event) => setForm((current) => ({ ...current, alias: event.target.value }))} /></label><label>Rede *<select value={form.network} onChange={(event) => setForm((current) => ({ ...current, network: event.target.value }))}><option>Ethereum</option><option>Polygon</option><option>Solana</option></select></label><label>Tipo de carteira *<select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}><option>MetaMask</option><option>WalletConnect</option><option>Coinbase Wallet</option></select></label><label>Endereço da carteira *<input required value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="0x..." /></label><label>E-mail *<input required type="email" value={form.email || user?.email || ''} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></label><label>Nome ENS<input value={form.ens} onChange={(event) => setForm((current) => ({ ...current, ens: event.target.value }))} /></label><label className={"[display:flex] [align-items:center] [gap:9px] [font-size:14px] check-label"}><Checkbox checked={form.primary} onCheckedChange={(checked) => setForm((current) => ({ ...current, primary: checked === true }))} /> Definir como principal</label></div>
          <button className={"[min-height:42px] [padding:0_20px] [display:inline-flex] [justify-content:center] [align-items:center] [gap:9px] [border:1px_solid_var(--accent)] [border-radius:6px] [color:#1b1009] [background:var(--accent)] [font-weight:700] [font-size:14px] [cursor:pointer] [transition:background_.15s,_transform_.15s] [&:hover]:[color:#1b1009] [&:hover]:[background:var(--accent-light)] [&:hover]:[transform:translateY(-1px)] [&:disabled]:[transform:none] [&:disabled]:[cursor:not-allowed] [&:disabled]:[opacity:.52] [&.disabled]:[transform:none] [&.disabled]:[cursor:not-allowed] [&.disabled]:[opacity:.52] button"} disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Salvando...' : editing ? 'Salvar alterações' : 'Salvar carteira'}</button>
        </form>
      </section>
    </div>
  )
}

export function WalletsPage() {
  return <main className={"[width:min(var(--content),_calc(100%_-_64px))] [margin-inline:auto] max-[900px]:[width:calc(100%_-_42px)] max-[640px]:[width:calc(100%_-_36px)] [padding-block:44px_75px] [min-height:55vh] page-shell account-page"}><RequireAuth><WalletsContent /></RequireAuth></main>
}
