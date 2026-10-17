import { createContext, useContext } from 'react'
import type { DadosCadastro, Perfil } from '../types'

export interface AuthContextValue {
  usuario: Perfil | null
  entrar: (email: string, senha: string) => Promise<void>
  cadastrar: (dados: DadosCadastro) => Promise<void>
  atualizar: (perfil: Perfil) => Promise<void>
  sair: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
