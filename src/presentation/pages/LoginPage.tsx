import { useState, type FormEvent } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../providers/AuthProvider'
import { Feedback } from '../components/Feedback'
import { errorMessage } from '../../shared/utils/format'
import { router } from '../routes'

export function LoginPage() {
  const { login } = useAuth()
  const search = useSearch({ from: '/login' })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      const redirect = search.redirect.startsWith('/') ? search.redirect : '/'
      router.history.push(redirect)
    } catch (reason) {
      setError(errorMessage(reason, 'Não foi possível entrar.'))
    } finally {
      setLoading(false)
    }
  }
  return (
    <main className="auth-page page-shell">
      <section className="auth-card">
        <Link className="auth-brand" to="/">KURIO</Link><span className="eyebrow">Bem-vindo de volta</span><h1>Entrar</h1><p className="muted">Acesse sua conta para continuar colecionando.</p>
        <form className="stack-form" onSubmit={submit}>
          <label>E-mail<input autoComplete="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="contato@email.com" /></label>
          <label className="password-field"><span className="sr-only">Senha</span><input id="login-password" autoComplete="current-password" type={showPassword ? 'text' : 'password'} required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha" /><button type="button" className="password-toggle" aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></label>
          <button className="auth-forgot" type="button" onClick={() => setNotice('A recuperação de senha não está disponível nesta demonstração.')}>Esqueceu a senha?</button>
          {error && <Feedback>{error}</Feedback>}<button className="button auth-submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
        </form>
        {notice && <Feedback tone="info">{notice}</Feedback>}
        <div className="auth-social"><span>Ou continue com</span><button type="button" onClick={() => setNotice('O login com Google não está disponível nesta demonstração.')}><b className="google-mark">G</b>Continuar com Google</button><button type="button" onClick={() => setNotice('O login com Facebook não está disponível nesta demonstração.')}><b className="facebook-mark">f</b>Continuar com Facebook</button></div>
        <div className="auth-demo"><b>Conta de demonstração</b><span>comprador@kurio.art</span><span>Senha: kurio123</span><button className="text-button" type="button" onClick={() => { setEmail('comprador@kurio.art'); setPassword('kurio123') }}>Usar credenciais de demonstração</button></div>
        <p className="auth-switch">Novo na Kurio? <Link to="/register">Criar conta</Link></p>
      </section>
    </main>
  )
}
