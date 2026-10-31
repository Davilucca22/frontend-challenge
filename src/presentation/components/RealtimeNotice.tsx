import { Radio } from 'lucide-react'
import { useRealtime } from '../providers/RealtimeProvider'

export function RealtimeNotice() {
  const { notice, connected } = useRealtime()
  return (
    <>
      {notice && <div className={"[position:fixed] [z-index:10] [top:82px] [right:18px] [max-width:min(390px,_calc(100%_-_36px))] [padding:12px_16px] [border:1px_solid_var(--accent)] [border-radius:6px] [color:var(--text)] [background:#352116] [box-shadow:0_12px_40px_#0008] max-[640px]:[top:64px] max-[640px]:[right:10px] max-[640px]:[font-size:14px] realtime-notice"} role="status">{notice}</div>}
      <span className={"[display:none] [position:fixed] [right:12px] [bottom:12px] [z-index:8] [align-items:center] [gap:5px] [padding:5px_8px] [border:1px_solid_#51321f] [border-radius:20px] [color:var(--muted)] [background:#20140e] [font-size:14px] [letter-spacing:.07em] min-[900px]:[display:inline-flex] connection-indicator"} title={connected ? 'Atualizações em tempo real conectadas' : 'Reconectando atualizações'} aria-label={connected ? 'Tempo real conectado' : 'Tempo real desconectado'}><Radio size={12} />{connected ? 'AO VIVO' : 'CONECTANDO'}</span>
    </>
  )
}
