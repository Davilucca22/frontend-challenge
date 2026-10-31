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
    <main className={"[min-height:67vh] [display:grid] [place-items:center] [padding-block:55px] max-[640px]:[width:100%] max-[640px]:[min-height:calc(100dvh_-_40px)] max-[640px]:[padding:clamp(72px,_15vh,_105px)_24px_36px] max-[640px]:[align-items:start] max-[640px]:[justify-items:center] [width:min(var(--content),_calc(100%_-_64px))] [margin-inline:auto] max-[900px]:[width:calc(100%_-_42px)] max-[640px]:[width:calc(100%_-_36px)] max-[640px]:[&_.auth-brand]:[margin-bottom:72px] max-[640px]:[&_.auth-card_h1]:[margin-bottom:24px] max-[640px]:[&_.stack-form]:[gap:9px] max-[640px]:[&_.auth-submit]:[margin-top:21px] max-[640px]:[&_.auth-social]:[margin-top:27px] max-[640px]:[&_.auth-switch]:[margin-top:30px] auth-page page-shell register-page"}>
      <section className={"[width:min(100%,_440px)] [padding:35px] [border:1px_solid_#392519] [border-radius:8px] [background:#20140e] [&_>_.eyebrow]:[display:block] [&_>_.eyebrow]:[text-align:center] [&_h1]:[margin:6px_0] [&_h1]:[text-align:center] [&_h1]:[font-size:23px] [&_>_p]:[text-align:center] [&_>_p]:[font-size:14px] max-[640px]:[width:min(100%,_340px)] max-[640px]:[padding:0] max-[640px]:[border:0] max-[640px]:[background:transparent] max-[640px]:[box-shadow:none] max-[640px]:[&_>_.eyebrow]:[display:none] max-[640px]:[&_>_.muted]:[display:none] max-[640px]:[&_h1]:[margin:0_0_22px] max-[640px]:[&_h1]:[text-align:center] max-[640px]:[&_h1]:[font-size:15px] auth-card"}>
        <Link className={"[font-size:16px] [font-weight:800] [letter-spacing:.17em] [display:block] [margin-bottom:25px] [text-align:center] [font-size:22px] max-[640px]:[display:block] max-[640px]:[margin-bottom:58px] max-[640px]:[text-align:center] max-[640px]:[font-size:24px] max-[640px]:[letter-spacing:.16em] auth-brand"} to="/">KURIO</Link><span className={"[color:var(--accent-light)] [font-size:10px] [letter-spacing:.17em] [text-transform:uppercase] eyebrow"}>Faça parte da comunidade</span><h1>Criar perfil de colecionador</h1><p className={"[color:var(--muted)] muted"}>Seus dados são simulados e usados apenas nesta demonstração.</p>
        <form className={"[display:grid] [gap:15px] [margin-top:25px] [&_label]:[display:grid] [&_label]:[gap:6px] [&_label]:[color:#dfd1c1] [&_label]:[font-size:14px] [&_input]:[min-height:42px] max-[640px]:[gap:9px] max-[640px]:[margin-top:0] max-[640px]:[&_>_label]:[gap:0] max-[640px]:[&_>_label]:[color:transparent] max-[640px]:[&_>_label]:[font-size:0] max-[640px]:[&_>_label_input]:[min-height:39px] max-[640px]:[&_>_label_input]:[padding:0_11px] max-[640px]:[&_>_label_input]:[font-size:14px] max-[640px]:[&_>_label_select]:[min-height:39px] max-[640px]:[&_>_label_select]:[padding:0_11px] max-[640px]:[&_>_label_select]:[font-size:14px] max-[640px]:[&_>_label_input::placeholder]:[color:#b89c7a] max-[640px]:[&_>_label.password-field]:[position:relative] max-[640px]:[&_>_label.password-field]:[display:block] stack-form"} onSubmit={submit}>
          <label>Nome de usuário<input placeholder="Nome de usuário" required autoComplete="username" value={fields.username} onChange={(event) => { change('username', event.target.value); change('name', event.target.value) }} /></label>
          <label>E-mail<input placeholder="Digite seu e-mail" required type="email" autoComplete="email" value={fields.email} onChange={(event) => change('email', event.target.value)} /></label>
          <label className={"[position:relative] [display:block] [&_input]:[padding-right:42px] max-[640px]:[&_input]:[min-height:39px] max-[640px]:[&_input]:[padding-right:40px] max-[640px]:[&_input]:[font-size:14px] password-field"}>Senha<input placeholder="Senha" required type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={fields.password} onChange={(event) => change('password', event.target.value)} /><button type="button" className={"[position:absolute] [right:7px] [top:5px] [width:32px] [height:31px] [display:grid] [place-items:center] [color:var(--muted)] [background:transparent] [border:0] [cursor:pointer] max-[640px]:[top:4px] max-[640px]:[right:4px] max-[640px]:[width:31px] max-[640px]:[height:31px] password-toggle"} aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></label>
          <label className={"[position:relative] [display:block] [&_input]:[padding-right:42px] max-[640px]:[&_input]:[min-height:39px] max-[640px]:[&_input]:[padding-right:40px] max-[640px]:[&_input]:[font-size:14px] password-field"}>Confirmar senha<input placeholder="Confirmar senha" required type={showConfirm ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={fields.confirm} onChange={(event) => change('confirm', event.target.value)} /><button type="button" className={"[position:absolute] [right:7px] [top:5px] [width:32px] [height:31px] [display:grid] [place-items:center] [color:var(--muted)] [background:transparent] [border:0] [cursor:pointer] max-[640px]:[top:4px] max-[640px]:[right:4px] max-[640px]:[width:31px] max-[640px]:[height:31px] password-toggle"} aria-label={showConfirm ? 'Ocultar confirmação' : 'Exibir confirmação'} onClick={() => setShowConfirm((value) => !value)}>{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button></label>
          {error && <Feedback>{error}</Feedback>}<button className={"[min-height:42px] [padding:0_20px] [display:inline-flex] [justify-content:center] [align-items:center] [gap:9px] [border:1px_solid_var(--accent)] [border-radius:6px] [color:#1b1009] [background:var(--accent)] [font-weight:700] [font-size:14px] [cursor:pointer] [transition:background_.15s,_transform_.15s] [&:hover]:[color:#1b1009] [&:hover]:[background:var(--accent-light)] [&:hover]:[transform:translateY(-1px)] [&:disabled]:[transform:none] [&:disabled]:[cursor:not-allowed] [&:disabled]:[opacity:.52] [&.disabled]:[transform:none] [&.disabled]:[cursor:not-allowed] [&.disabled]:[opacity:.52] [width:100%] [min-height:45px] [margin-top:5px] max-[640px]:[min-height:44px] max-[640px]:[margin-top:31px] max-[640px]:[border-radius:7px] button auth-submit"} disabled={loading}>{loading ? 'Criando...' : 'Criar perfil'}</button>
        </form>
        {notice && <Feedback tone="info">{notice}</Feedback>}
        <div className={"[display:grid] [gap:8px] [margin-top:24px] [&_>_span]:[display:flex] [&_>_span]:[align-items:center] [&_>_span]:[gap:9px] [&_>_span]:[color:var(--muted)] [&_>_span]:[font-size:14px] [&_>_span::before]:[height:1px] [&_>_span::before]:[flex:1] [&_>_span::before]:[background:#422a1b] [&_>_span::before]:[content:\"\"] [&_>_span::after]:[height:1px] [&_>_span::after]:[flex:1] [&_>_span::after]:[background:#422a1b] [&_>_span::after]:[content:\"\"] [&_button]:[min-height:36px] [&_button]:[display:flex] [&_button]:[align-items:center] [&_button]:[justify-content:center] [&_button]:[gap:10px] [&_button]:[border:1px_solid_#49301f] [&_button]:[border-radius:4px] [&_button]:[color:var(--muted)] [&_button]:[background:transparent] [&_button]:[font-size:14px] [&_button]:[cursor:pointer] [&_button:hover]:[border-color:var(--accent)] [&_button:hover]:[color:var(--text)] max-[640px]:[gap:8px] max-[640px]:[margin-top:29px] max-[640px]:[&_>_span]:[justify-content:center] max-[640px]:[&_>_span]:[font-size:14px] max-[640px]:[&_button]:[min-height:33px] max-[640px]:[&_button]:[font-size:14px] auth-social"}><span>Ou continue com</span><button type="button" onClick={() => setNotice('O cadastro com Google não está disponível nesta demonstração.')}><b className={"[color:#4285f4] [font:700_16px_Arial,_sans-serif] google-mark"}>G</b>Continuar com Google</button><button type="button" onClick={() => setNotice('O cadastro com Facebook não está disponível nesta demonstração.')}><b className={"[color:#4267b2] [font:700_18px_Arial,_sans-serif] facebook-mark"}>f</b>Continuar com Facebook</button></div>
        <p className={"[margin:20px_0_0] [&_a]:[color:var(--accent-light)] max-[640px]:[margin-top:31px] max-[640px]:[text-align:center] max-[640px]:[font-size:14px] max-[640px]:[&_a]:[color:var(--accent-light)] auth-switch"}>Já tem uma conta? <Link to="/login" search={{ redirect: '/' }}>Entrar</Link></p>
      </section>
    </main>
  )
}
