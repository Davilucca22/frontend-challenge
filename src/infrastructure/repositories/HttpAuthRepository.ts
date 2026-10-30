import type { User } from '../../domain/entities/User'
import type { AuthRepository } from '../../domain/repositories/AuthRepository'
import { httpClient } from '../http/axios-client'

export class HttpAuthRepository implements AuthRepository {
  async login(email: string, password: string): Promise<User> {
    const { data } = await httpClient.post<User>('/auth/login', { email, password })
    return data
  }

  async register(name: string, username: string, email: string, password: string): Promise<User> {
    const { data } = await httpClient.post<User>('/auth/register', { name, username, email, password })
    return data
  }

  async session(): Promise<User | null> {
    const { data } = await httpClient.get<User | null>('/auth/session')
    return data
  }

  async logout(): Promise<void> {
    await httpClient.post('/auth/logout')
  }
}
