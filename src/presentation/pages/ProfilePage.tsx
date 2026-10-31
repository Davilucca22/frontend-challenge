import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Activity, Download, Eye, EyeOff, Heart, LifeBuoy, LogOut, Tag, UserRound, WalletCards } from 'lucide-react'
import type { User } from '../../domain/entities/User'
import { httpClient } from '../../infrastructure/http/axios-client'
import { useAuth } from '../providers/AuthProvider'
import { RequireAuth } from '../components/RequireAuth'
import { Feedback } from '../components/Feedback'
import { FavoritesModal } from '../components/FavoritesModal'
import { errorMessage } from '../../shared/utils/format'

// Gerencia leitura e edição do perfil, avatar, senha e favoritos.
function ProfileContent() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const profileQuery = useQuery({ queryKey: ['profile', user?.id], queryFn: async () => (await httpClient.get<User>('/profile')).data })
  const avatarInput = useRef<HTMLInputElement>(null)
  const favoritesTriggerRef = useRef<HTMLElement | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [visiblePasswords, setVisiblePasswords] = useState({ currentPassword: false, newPassword: false, confirm: false })
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
  // Exibe estados de leitura antes de habilitar o formulário com os dados do perfil.
  if (profileQuery.isPending) return <p>Carregando perfil...</p>
  if (profileQuery.isError) return <Feedback>{errorMessage(profileQuery.error)}</Feedback>
  const profile = profileQuery.data
  const ensSuffixMatch = profile.ensName.match(/\.[a-z0-9-]+$/i)
  const ensSuffix = ensSuffixMatch?.[0] ?? '.eth'
  const submitProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    // A troca de senha só é enviada quando os três campos estão completos e conferem.
    const hasPasswordChange = Object.values(passwords).some(Boolean)
    if (hasPasswordChange && (!passwords.currentPassword || !passwords.newPassword || !passwords.confirm)) {
      setError('Preencha os três campos para alterar a senha.')
      setNotice('')
      return
    }
    if (hasPasswordChange && passwords.newPassword !== passwords.confirm) {
      setError('A confirmação da nova senha não confere.')
      setNotice('')
      return
    }
    try {
      await updateProfile.mutateAsync({
        name: String(form.get('name')),
        username: String(form.get('username')),
        email: String(form.get('email')),
        walletAlias: String(form.get('walletAlias')),
        ensName: String(form.get('ensName')).trim() ? `${String(form.get('ensName')).trim()}${String(form.get('ensSuffix'))}` : '',
        avatar: profile.avatar,
      })
      if (hasPasswordChange) await updatePassword.mutateAsync()
    } catch {
      // The mutations render their API errors through the shared form feedback.
    }
  }
  const chooseAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    // Restringe a seleção a imagens pequenas antes de convertê-las para pré-visualização.
    if (!file.type.startsWith('image/') || file.size > 2_000_000) {
      setError('Selecione uma imagem de até 2 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => updateProfile.mutate({ ...profile, avatar: String(reader.result) })
    reader.onerror = () => setError('Não foi possível ler a imagem selecionada.')
    reader.readAsDataURL(file)
  }
  return (
    <div className="mx-auto grid w-full max-w-[1100px] grid-cols-[220px_minmax(0,1fr)] items-start gap-8 max-[900px]:grid-cols-[190px_minmax(0,1fr)] max-[900px]:gap-6 max-[640px]:grid-cols-1 max-[640px]:gap-5 account-layout">
      <aside className="grid gap-0 bg-[#1b100b] px-0 py-2 account-sidebar">
        <h2 className="mb-1 border-b border-[#49301f] px-3 pb-2 text-base font-bold text-text">Meu perfil</h2>
        <Link className="flex items-center gap-2 border-l-[3px] border-accent px-3 py-2 text-sm font-medium text-accent-light" to="/profile"><UserRound aria-hidden="true" size={16} />Dados do perfil</Link>
        <Link className="flex items-center gap-2 border-l-[3px] border-transparent px-3 py-2 text-sm font-medium text-accent-light hover:text-[#ffd39e]" to="/wallets"><WalletCards aria-hidden="true" size={16} />Carteiras</Link>
        <span className="flex items-center gap-2 border-l-[3px] border-transparent px-3 py-2 text-sm font-medium text-accent-light"><Activity aria-hidden="true" size={16} />Atividade</span>
        <button aria-haspopup="dialog" aria-expanded={favoritesOpen} className="flex items-center gap-2 border-0 border-l-[3px] border-transparent bg-transparent px-3 py-2 text-left text-sm font-medium text-accent-light hover:text-[#ffd39e]" onClick={(event) => { favoritesTriggerRef.current = event.currentTarget; setFavoritesOpen(true) }} type="button"><Heart aria-hidden="true" size={16} />Lista de interesse</button>
        <span className="flex items-center gap-2 border-l-[3px] border-transparent px-3 py-2 text-sm font-medium text-accent-light"><Tag aria-hidden="true" size={16} />Ofertas</span>
        <span className="flex items-center gap-2 border-l-[3px] border-transparent px-3 py-2 text-sm font-medium text-accent-light"><Download aria-hidden="true" size={16} />Arquivos baixados</span>
        <span className="flex items-center gap-2 border-l-[3px] border-transparent px-3 py-2 text-sm font-medium text-accent-light"><LifeBuoy aria-hidden="true" size={16} />Suporte</span>
        <button className="mt-1 flex items-center gap-2 border-0 border-t border-[#49301f] bg-transparent px-3 py-2 text-left text-sm font-medium text-accent-light hover:text-[#ffd39e]" onClick={() => void logout().then(() => navigate({ to: '/' }))} type="button"><LogOut aria-hidden="true" size={16} />Sair</button>
      </aside>
      <section className="min-w-0 account-content">
        <h1 className="mb-6 text-2xl font-bold leading-tight text-text max-[640px]:text-xl">Perfil do colecionador</h1>
        {notice && <Feedback tone="success">{notice}</Feedback>}
        {error && <Feedback>{error}</Feedback>}
        <form className="grid grid-cols-2 items-start gap-x-4 gap-y-4 max-[640px]:grid-cols-1 profile-form" onSubmit={submitProfile}>
          <label className="grid gap-1.5 text-sm font-medium text-[#dfd1c1]">Nome de exibição *<input name="name" required defaultValue={profile.name} /></label>
          <label className="grid gap-1.5 text-sm font-medium text-[#dfd1c1]">Nome de usuário *<input name="username" required defaultValue={profile.username} /></label>
          <label className="grid gap-1.5 text-sm font-medium text-[#dfd1c1]">E-mail *<input name="email" type="email" required defaultValue={profile.email} /></label>
          <label className="grid gap-1.5 text-sm font-medium text-[#dfd1c1]">Nome ENS *<span className="flex gap-2"><select aria-label="Sufixo ENS" className="!w-20" defaultValue={ensSuffix} name="ensSuffix"><option>.eth</option><option>.xyz</option><option>.art</option>{!['.eth', '.xyz', '.art'].includes(ensSuffix) && <option>{ensSuffix}</option>}</select><input name="ensName" required defaultValue={profile.ensName.replace(/\.[a-z0-9-]+$/i, '')} /></span></label>
          <label className="grid gap-1.5 text-sm font-medium text-[#dfd1c1]">Apelido da carteira *<input name="walletAlias" required defaultValue={profile.walletAlias} /></label>
          <div className="grid gap-1.5 text-sm font-medium text-[#dfd1c1]">
            Avatar
            <div className="flex min-h-[39px] items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#382519] text-accent-light">{profile.avatar ? <img alt="Avatar atual" className="h-full w-full object-cover" src={profile.avatar} /> : <UserRound aria-label="Avatar padrão" size={18} />}</div>
              <input ref={avatarInput} className="hidden" type="file" accept="image/*" onChange={chooseAvatar} />
              <button className="min-h-[39px] rounded-md border border-accent bg-accent px-4 text-sm font-bold text-[#1b1009] hover:bg-accent-light" onClick={() => avatarInput.current?.click()} type="button">Alterar</button>
              <button className="border-0 bg-transparent p-0 text-sm text-text hover:text-accent-light" onClick={() => updateProfile.mutate({ ...profile, avatar: '' })} type="button">Remover</button>
            </div>
          </div>
          <div className="col-start-1 grid gap-3 pt-1 max-[640px]:col-auto profile-password-section">
            <h2 className="mb-0 text-base font-bold text-text">Alterar senha</h2>
            {([
              ['currentPassword', 'Senha atual', 'current-password'],
              ['newPassword', 'Nova senha', 'new-password'],
              ['confirm', 'Confirmar nova senha', 'new-password'],
            ] as const).map(([field, label, autocomplete]) => (
              <label className="grid gap-1.5 text-sm font-medium text-[#dfd1c1]" key={field}>
                {label}
                <span className="relative">
                  <input className="!pr-10" autoComplete={autocomplete} minLength={field === 'currentPassword' ? 6 : 8} type={visiblePasswords[field] ? 'text' : 'password'} value={passwords[field]} onChange={(event) => setPasswords((current) => ({ ...current, [field]: event.target.value }))} />
                  <button aria-label={`${visiblePasswords[field] ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`} className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border-0 bg-transparent p-0 text-accent-light hover:bg-panel-2" onClick={() => setVisiblePasswords((current) => ({ ...current, [field]: !current[field] }))} type="button">{visiblePasswords[field] ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </span>
              </label>
            ))}
          </div>
          <button className="col-start-1 min-h-[42px] w-fit rounded-md border border-accent bg-accent px-5 text-sm font-bold text-[#1b1009] transition hover:bg-accent-light disabled:opacity-50" disabled={updateProfile.isPending || updatePassword.isPending} type="submit">Salvar</button>
        </form>
      </section>
      {user && favoritesOpen && <FavoritesModal userId={user.id} returnFocusRef={favoritesTriggerRef} onClose={() => setFavoritesOpen(false)} />}
    </div>
  )
}

export function ProfilePage() {
  return <main className="min-h-[calc(100vh-72px)] w-full px-8 pt-[23px] max-[640px]:min-h-[calc(100dvh-64px)] max-[640px]:px-[18px] max-[640px]:py-6 account-page"><RequireAuth><ProfileContent /></RequireAuth></main>
}
