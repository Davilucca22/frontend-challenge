export const formatEth = (value: string): string => `${value} ETH`
export const multiplyEth = (value: string, quantity: number): string => {
  const [whole, fraction = ''] = value.split('.')
  const unit = 1_000_000_000_000_000_000n
  const result = (BigInt(whole) * unit + BigInt(fraction.padEnd(18, '0').slice(0, 18))) * BigInt(quantity)
  const decimals = (result % unit).toString().padStart(18, '0').replace(/0+$/, '')
  return decimals ? `${result / unit}.${decimals}` : `${result / unit}.00`
}
export const formatDate = (value: string): string => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
export const errorMessage = (error: unknown, fallback = 'Não foi possível concluir. Tente novamente.'): string =>
  error instanceof Error ? error.message : fallback
