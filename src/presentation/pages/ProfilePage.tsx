import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { User } from '../../domain/entities/User'
import { httpClient } from '../../infrastructure/http/axios-client'
import { useAuth } from '../providers/AuthProvider'
import { RequireAuth } from '../components/RequireAuth'
import { Feedback } from '../components/Feedback'
import { errorMessage } from '../../shared/utils/format'

function ProfileContent() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const profileQuery = useQuery({ queryKey: ['profile', user?.id], queryFn: async () => (await httpClient.get<User>('/profile')).data })
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const updateProfile = useMutation({
    mutationFn: async (data: Partial<User>) => (await httpClient.put<User>('/profile', data)).data,
    onSuccess: async (profile) => {
      queryClient.setQueryData(['profile', user?.id], profile)
      queryClient.setQueryData(['auth', 'session'], profile)
      setNotice('Perfil atualizado.')
      setError('')
    },
    onError: (reason) => { setError(errorMessage(reason)); setNotice('') },
  })
  const updatePassword = useMutation({
    mutationFn: () => httpClient.put('/profile/password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }),
    onSuccess: () => {
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' })
      setNotice('Senha alterada com sucesso.')
      setError('')
    },
    onError: (reason) => { setError(errorMessage(reason)); setNotice('') },
  })
  if (profileQuery.isPending) return <p>Carregando perfil...</p>
  if (profileQuery.isError) return <Feedback>{errorMessage(profileQuery.error)}</Feedback>
  const profile = profileQuery.data
  const submitProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    updateProfile.mutate({
      name: String(form.get('name')),
      username: String(form.get('username')),
      email: String(form.get('email')),
      walletAlias: String(form.get('walletAlias')),
      ensName: String(form.get('ensName')),
      avatar: profile.avatar,
    })
  }
  const chooseAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 2_000_000) {
      setError('Selecione uma imagem de até 2 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => updateProfile.mutate({ ...profile, avatar: String(reader.result) })
    reader.onerror = () => setError('Não foi possível ler a imagem selecionada.')
    reader.readAsDataURL(file)
  }
  const submitPassword = (event: FormEvent) => {
    event.preventDefault()
    if (passwords.newPassword !== passwords.confirm) {
      setError('A confirmação da nova senha não confere.')
      return
    }
    updatePassword.mutate()
  }
  return (
    <div className="account-layout">
      <aside className="account-sidebar"><h2>Meu perfil</h2><Link className="active" to="/profile">Dados do perfil</Link><Link to="/wallets">Carteiras</Link><Link to="/cart">Carrinho</Link><button className="text-button" onClick={() => void queryClient.invalidateQueries({ queryKey: ['auth'] })}>Atualizar sessão</button></aside>
      <section className="account-content"><span className="eyebrow">Minha conta</span><h1>Perfil do colecionador</h1>{notice && <Feedback tone="success">{notice}</Feedback>}{error && <Feedback>{error}</Feedback>}
        <form className="profile-form" onSubmit={submitProfile}><div className="form-grid"><label>Nome de exibição *<input name="name" required defaultValue={profile.name} /></label><label>Nome de usuário *<input name="username" required defaultValue={profile.username} /></label><label>E-mail *<input name="email" type="email" required defaultValue={profile.email} /></label><label>Nome ENS<input name="ensName" defaultValue={profile.ensName} placeholder="nome.kurio.eth" /></label><label>Apelido da carteira<input name="walletAlias" defaultValue={profile.walletAlias} /></label><label>Avatar<input type="file" accept="image/*" onChange={chooseAvatar} /></label></div>
          <div className="avatar-preview">{profile.avatar ? <img src={profile.avatar} alt="Avatar atual" /> : <span aria-label="Avatar padrão">{profile.name.slice(0, 1).toUpperCase()}</span>}</div><button className="button" disabled={updateProfile.isPending}>Salvar perfil</button>
        </form>
        <form className="password-form" onSubmit={submitPassword}><h2>Alterar senha</h2><div className="form-grid"><label>Senha atual<input type="password" autoComplete="current-password" minLength={6} required value={passwords.currentPassword} onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))} /></label><label>Nova senha<input type="password" autoComplete="new-password" minLength={8} required value={passwords.newPassword} onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))} /></label><label>Confirmar nova senha<input type="password" autoComplete="new-password" minLength={8} required value={passwords.confirm} onChange={(event) => setPasswords((current) => ({ ...current, confirm: event.target.value }))} /></label></div><button className="button button-outline" disabled={updatePassword.isPending}>Atualizar senha</button></form>
      </section>
    </div>
  )
}

export function ProfilePage() {
  return <main className="page-shell account-page"><RequireAuth><ProfileContent /></RequireAuth></main>
}
