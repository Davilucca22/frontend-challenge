export function Feedback({ children, tone = 'error' }: { children: string; tone?: 'error' | 'success' | 'info' }) {
  return <p className={`feedback feedback-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</p>
}
