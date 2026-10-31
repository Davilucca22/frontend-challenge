import { useState, type FormEvent } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../providers/AuthProvider'
import { Feedback } from '../components/Feedback'
import { errorMessage } from '../../shared/utils/format'
import { router } from '../routes'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

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
    <main className={"[min-height:67vh] [display:grid] [place-items:center] [padding-block:55px] max-[640px]:[width:100%] max-[640px]:[min-height:calc(100dvh_-_40px)] max-[640px]:[padding:clamp(72px,_15vh,_105px)_24px_36px] max-[640px]:[align-items:start] max-[640px]:[justify-items:center] [width:min(var(--content),_calc(100%_-_64px))] [margin-inline:auto] max-[900px]:[width:calc(100%_-_42px)] max-[640px]:[width:calc(100%_-_36px)] auth-page page-shell"}>
      <section className={"[width:min(100%,_440px)] [padding:35px] [border:1px_solid_#392519] [border-radius:8px] [background:#20140e] [&_>_.eyebrow]:[display:block] [&_>_.eyebrow]:[text-align:center] [&_h1]:[margin:6px_0] [&_h1]:[text-align:center] [&_h1]:[font-size:23px] [&_>_p]:[text-align:center] [&_>_p]:[font-size:14px] max-[640px]:[width:min(100%,_340px)] max-[640px]:[padding:0] max-[640px]:[border:0] max-[640px]:[background:transparent] max-[640px]:[box-shadow:none] max-[640px]:[&_>_.eyebrow]:[display:none] max-[640px]:[&_>_.muted]:[display:none] max-[640px]:[&_h1]:[margin:0_0_22px] max-[640px]:[&_h1]:[text-align:center] max-[640px]:[&_h1]:[font-size:15px] auth-card"}>
        <Link className={"[font-size:16px] [font-weight:800] [letter-spacing:.17em] [display:block] [margin-bottom:25px] [text-align:center] [font-size:22px] max-[640px]:[display:block] max-[640px]:[margin-bottom:58px] max-[640px]:[text-align:center] max-[640px]:[font-size:24px] max-[640px]:[letter-spacing:.16em] auth-brand"} to="/">KURIO</Link><span className={"[color:var(--accent-light)] [font-size:10px] [letter-spacing:.17em] [text-transform:uppercase] eyebrow"}>Bem-vindo de volta</span><h1>Entrar</h1><p className={"[color:var(--muted)] muted"}>Acesse sua conta para continuar colecionando.</p>
        <form className={"[display:grid] [gap:15px] [margin-top:25px] [&_label]:[display:grid] [&_label]:[gap:6px] [&_label]:[color:#dfd1c1] [&_label]:[font-size:14px] [&_input]:[min-height:42px] max-[640px]:[gap:9px] max-[640px]:[margin-top:0] max-[640px]:[&_>_label]:[gap:0] max-[640px]:[&_>_label]:[color:transparent] max-[640px]:[&_>_label]:[font-size:0] max-[640px]:[&_>_label_input]:[min-height:39px] max-[640px]:[&_>_label_input]:[padding:0_11px] max-[640px]:[&_>_label_input]:[font-size:14px] max-[640px]:[&_>_label_select]:[min-height:39px] max-[640px]:[&_>_label_select]:[padding:0_11px] max-[640px]:[&_>_label_select]:[font-size:14px] max-[640px]:[&_>_label_input::placeholder]:[color:#b89c7a] max-[640px]:[&_>_label.password-field]:[position:relative] max-[640px]:[&_>_label.password-field]:[display:block] stack-form"} onSubmit={submit}>
          <Label>E-mail<Input autoComplete="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="contato@email.com" /></Label>
          <Label className={"[position:relative] [display:block] [&_input]:[padding-right:42px] max-[640px]:[&_input]:[min-height:39px] max-[640px]:[&_input]:[padding-right:40px] max-[640px]:[&_input]:[font-size:14px] password-field"}><span className={"[position:absolute] [width:1px] [height:1px] [padding:0] [margin:-1px] [overflow:hidden] [clip:rect(0,_0,_0,_0)] [white-space:nowrap] [border:0] sr-only"}>Senha</span><Input id="login-password" autoComplete="current-password" type={showPassword ? 'text' : 'password'} required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha" /><button type="button" className={"[position:absolute] [right:7px] [top:5px] [width:32px] [height:31px] [display:grid] [place-items:center] [color:var(--muted)] [background:transparent] [border:0] [cursor:pointer] max-[640px]:[top:4px] max-[640px]:[right:4px] max-[640px]:[width:31px] max-[640px]:[height:31px] password-toggle"} aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></Label>
          <button className={"[justify-self:end] [padding:0] [border:0] [color:var(--accent-light)] [background:transparent] [font-size:14px] [cursor:pointer] max-[640px]:[margin-top:0] max-[640px]:[font-size:14px] auth-forgot"} type="button" onClick={() => setNotice('A recuperação de senha não está disponível nesta demonstração.')}>Esqueceu a senha?</button>
          {error && <Feedback>{error}</Feedback>}<Button className="w-full min-h-[45px] mt-[5px] max-[640px]:mt-[31px] max-[640px]:min-h-[44px] max-[640px]:rounded-[7px] auth-submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</Button>
        </form>
        {notice && <Feedback tone="info">{notice}</Feedback>}
        <div className={"[display:grid] [gap:8px] [margin-top:24px] [&_>_span]:[display:flex] [&_>_span]:[align-items:center] [&_>_span]:[gap:9px] [&_>_span]:[color:var(--muted)] [&_>_span]:[font-size:14px] [&_>_span::before]:[height:1px] [&_>_span::before]:[flex:1] [&_>_span::before]:[background:#422a1b] [&_>_span::before]:[content:\"\"] [&_>_span::after]:[height:1px] [&_>_span::after]:[flex:1] [&_>_span::after]:[background:#422a1b] [&_>_span::after]:[content:\"\"] [&_button]:[min-height:36px] [&_button]:[display:flex] [&_button]:[align-items:center] [&_button]:[justify-content:center] [&_button]:[gap:10px] [&_button]:[border:1px_solid_#49301f] [&_button]:[border-radius:4px] [&_button]:[color:var(--muted)] [&_button]:[background:transparent] [&_button]:[font-size:14px] [&_button]:[cursor:pointer] [&_button:hover]:[border-color:var(--accent)] [&_button:hover]:[color:var(--text)] max-[640px]:[gap:8px] max-[640px]:[margin-top:29px] max-[640px]:[&_>_span]:[justify-content:center] max-[640px]:[&_>_span]:[font-size:14px] max-[640px]:[&_button]:[min-height:33px] max-[640px]:[&_button]:[font-size:14px] auth-social"}><span>Ou continue com</span><button type="button" onClick={() => setNotice('O login com Google não está disponível nesta demonstração.')}><b className={"[color:#4285f4] [font:700_16px_Arial,_sans-serif] google-mark"}>G</b>Continuar com Google</button><button type="button" onClick={() => setNotice('O login com Facebook não está disponível nesta demonstração.')}><b className={"[color:#4267b2] [font:700_18px_Arial,_sans-serif] facebook-mark"}>f</b>Continuar com Facebook</button></div>
        <div className={"[display:grid] [gap:3px] [margin-top:18px] [padding:12px] [color:var(--muted)] [background:#291a12] [font-size:14px] [&_b]:[color:var(--text)] [&_.text-button]:[justify-self:start] [&_.text-button]:[margin-top:3px] max-[640px]:[display:none] auth-demo"}><b>Conta de demonstração</b><span>comprador@kurio.art</span><span>Senha: kurio123</span><button className={"[padding:4px] [background:transparent] [border:0] [color:var(--accent-light)] [cursor:pointer] [display:inline-flex] [align-items:center] [gap:6px] [font-size:14px] [&:hover]:[color:#ffd39e] [&:hover]:[text-decoration:underline] text-button"} type="button" onClick={() => { setEmail('comprador@kurio.art'); setPassword('kurio123') }}>Usar credenciais de demonstração</button></div>
        <p className={"[margin:20px_0_0] [&_a]:[color:var(--accent-light)] max-[640px]:[margin-top:31px] max-[640px]:[text-align:center] max-[640px]:[font-size:14px] max-[640px]:[&_a]:[color:var(--accent-light)] auth-switch"}>Novo na Kurio? <Link to="/register">Criar conta</Link></p>
      </section>
    </main>
  )
}
