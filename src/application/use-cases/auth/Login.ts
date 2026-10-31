import type { User } from '../../../domain/entities/User'
import type { AuthRepository } from '../../../domain/repositories/AuthRepository'

// Valida as credenciais básicas antes de delegar a autenticação ao repositório.
export class Login {
  constructor(private readonly repository: AuthRepository) {}

  execute(email: string, password: string): Promise<User> {
    // Impede chamadas ao serviço com campos claramente inválidos.
    if (!email.includes('@') || password.length < 6) {
      return Promise.reject(new Error('Informe um e-mail e uma senha válidos.'))
    }
    return this.repository.login(email, password)
  }
}
