import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../providers/AuthProvider'
import { Feedback } from '../components/Feedback'
import { errorMessage } from '../../shared/utils/format'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [fields, setFields] = useState({ name: '', username: '', email: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const change = (key: keyof typeof fields, value: string) => setFields((current) => ({ ...current, [key]: value }))
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (fields.password !== fields.confirm) {
      setError('As senhas não conferem.')
      return
    }
    setLoading(true)
    try {
      await register(fields.name, fields.username, fields.email, fields.password)
      await navigate({ to: '/profile' })
    } catch (reason) {
      setError(errorMessage(reason, 'Não foi possível criar a conta.'))
    } finally {
      setLoading(false)
    }
  }
  return (
    <main className="auth-page page-shell register-page">
      <section className="auth-card">
        <Link className="auth-brand" to="/">KURIO</Link><span className="eyebrow">Faça parte da comunidade</span><h1>Criar perfil de colecionador</h1><p className="muted">Seus dados são simulados e usados apenas nesta demonstração.</p>
        <form className="stack-form" onSubmit={submit}>
          <label>Nome de usuário<input placeholder="Nome de usuário" required autoComplete="username" value={fields.username} onChange={(event) => { change('username', event.target.value); change('name', event.target.value) }} /></label>
          <label>E-mail<input placeholder="Digite seu e-mail" required type="email" autoComplete="email" value={fields.email} onChange={(event) => change('email', event.target.value)} /></label>
          <label className="password-field">Senha<input placeholder="Senha" required type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={fields.password} onChange={(event) => change('password', event.target.value)} /><button type="button" className="password-toggle" aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></label>
          <label className="password-field">Confirmar senha<input placeholder="Confirmar senha" required type={showConfirm ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={fields.confirm} onChange={(event) => change('confirm', event.target.value)} /><button type="button" className="password-toggle" aria-label={showConfirm ? 'Ocultar confirmação' : 'Exibir confirmação'} onClick={() => setShowConfirm((value) => !value)}>{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button></label>
          {error && <Feedback>{error}</Feedback>}<button className="button auth-submit" disabled={loading}>{loading ? 'Criando...' : 'Criar perfil'}</button>
        </form>
        {notice && <Feedback tone="info">{notice}</Feedback>}
        <div className="auth-social"><span>Ou continue com</span><button type="button" onClick={() => setNotice('O cadastro com Google não está disponível nesta demonstração.')}><b className="google-mark">G</b>Continuar com Google</button><button type="button" onClick={() => setNotice('O cadastro com Facebook não está disponível nesta demonstração.')}><b className="facebook-mark">f</b>Continuar com Facebook</button></div>
        <p className="auth-switch">Já tem uma conta? <Link to="/login" search={{ redirect: '/' }}>Entrar</Link></p>
      </section>
    </main>
  )
}
