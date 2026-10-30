import type { User } from '../entities/User'

export interface AuthRepository {
  login(email: string, password: string): Promise<User>
  register(name: string, username: string, email: string, password: string): Promise<User>
  session(): Promise<User | null>
  logout(): Promise<void>
}
