import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Pencil, Plus, WalletCards } from 'lucide-react'
import type { Wallet } from '../../domain/entities/User'
import { httpClient } from '../../infrastructure/http/axios-client'
import { useAuth } from '../providers/AuthProvider'
import { RequireAuth } from '../components/RequireAuth'
import { Feedback } from '../components/Feedback'
import { errorMessage } from '../../shared/utils/format'

const emptyWallet: Omit<Wallet, 'id'> = { name: '', alias: '', address: '', network: 'Ethereum', type: 'MetaMask', email: '', ens: '', primary: false }

function WalletsContent() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Wallet | null>(null)
  const [form, setForm] = useState<Omit<Wallet, 'id'>>(emptyWallet)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const walletsQuery = useQuery({ queryKey: ['wallets', user?.id], queryFn: async () => (await httpClient.get<Wallet[]>('/wallets')).data })
  const saveMutation = useMutation({
    mutationFn: async () => editing
      ? (await httpClient.put<Wallet[]>(`/wallets/${editing.id}`, { ...form, id: editing.id })).data
      : (await httpClient.post<Wallet[]>('/wallets', form)).data,
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
    setEditing(wallet)
    setForm({ name: wallet.name, alias: wallet.alias, address: wallet.address, network: wallet.network, type: wallet.type, email: wallet.email, ens: wallet.ens, primary: wallet.primary })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  return (
    <div className="account-layout">
      <aside className="account-sidebar"><h2>Meu perfil</h2><Link to="/profile">Dados do perfil</Link><Link className="active" to="/wallets">Carteiras</Link><Link to="/cart">Carrinho</Link></aside>
      <section className="account-content"><span className="eyebrow">Conta e pagamento</span><h1>Minhas carteiras</h1><p className="muted">Carteiras fictícias para simular a seleção de rede no checkout.</p>{notice && <Feedback tone="success">{notice}</Feedback>}{error && <Feedback>{error}</Feedback>}
        <div className="wallet-list">{walletsQuery.data?.map((wallet) => <article className="saved-wallet" key={wallet.id}><WalletCards size={20} /><div><b>{wallet.alias || wallet.name} {wallet.primary && <span className="verified">Principal</span>}</b><span>{wallet.address}</span><small>{wallet.network} · {wallet.type}</small></div><button className="icon-button" aria-label={`Editar carteira ${wallet.alias}`} onClick={() => selectEdit(wallet)}><Pencil size={15} /></button></article>)}</div>
        <form className="wallet-form" onSubmit={submit}><div className="wallet-form-heading"><h2>{editing ? 'Editar carteira' : 'Adicionar carteira'}</h2><button className="text-button" type="button" onClick={() => { setEditing(null); setForm(emptyWallet) }}><Plus size={14} /> Nova</button></div>
          <div className="form-grid"><label>Nome de exibição *<input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label><label>Apelido da carteira *<input required value={form.alias} onChange={(event) => setForm((current) => ({ ...current, alias: event.target.value }))} /></label><label>Rede *<select value={form.network} onChange={(event) => setForm((current) => ({ ...current, network: event.target.value }))}><option>Ethereum</option><option>Polygon</option><option>Solana</option></select></label><label>Tipo de carteira *<select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}><option>MetaMask</option><option>WalletConnect</option><option>Coinbase Wallet</option></select></label><label>Endereço da carteira *<input required value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="0x..." /></label><label>Nome do perfil<input value={form.ens} onChange={(event) => setForm((current) => ({ ...current, ens: event.target.value }))} /></label><label>E-mail *<input required type="email" value={form.email || user?.email || ''} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></label><label>Nome ENS<input value={form.ens} onChange={(event) => setForm((current) => ({ ...current, ens: event.target.value }))} /></label><label className="check-label"><input type="checkbox" checked={form.primary} onChange={(event) => setForm((current) => ({ ...current, primary: event.target.checked }))} /> Definir como principal</label></div>
          <button className="button" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Salvando...' : editing ? 'Salvar alterações' : 'Salvar carteira'}</button>
        </form>
      </section>
    </div>
  )
}

export function WalletsPage() {
  return <main className="page-shell account-page"><RequireAuth><WalletsContent /></RequireAuth></main>
}
