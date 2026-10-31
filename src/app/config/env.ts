// Centraliza os endereços e opções de execução usados pela infraestrutura.
export const appConfig = {
  mocksEnabled: import.meta.env.VITE_MOCKS !== 'false',
  apiBaseUrl: '/api',
  socketPath: '/socket.io',
} as const
