import axios from 'axios'
import { ApiError } from '../../domain/errors/ApiError'
import { appConfig } from '../../app/config/env'

// Configura o cliente HTTP compartilhado usado pelos repositórios.
export const httpClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: 8_000,
  headers: { 'Content-Type': 'application/json' },
})

// Converte erros Axios em erros de domínio e sinaliza sessões expiradas.
httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError<{ message?: string; code?: string }>(error)) {
      const message = error.response?.data?.message ?? error.message ?? 'Falha de comunicação com o serviço.'
      if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
        window.dispatchEvent(new Event('kurio:session-expired'))
      }
      return Promise.reject(new ApiError(message, error.response?.status ?? 0, error.response?.data?.code))
    }
    return Promise.reject(error)
  },
)
