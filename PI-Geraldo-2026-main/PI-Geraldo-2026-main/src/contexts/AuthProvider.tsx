import { useState, type ReactNode } from 'react'
import * as api from '../services/api'
import type { DadosCadastro, Perfil } from '../types'
import { AuthContext } from './auth'

const CHAVE = 'usuario'

function carregarUsuario(): Perfil | null {
  try {
    const salvo = localStorage.getItem(CHAVE)
    return salvo ? (JSON.parse(salvo) as Perfil) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Perfil | null>(carregarUsuario)

  function salvar(perfil: Perfil | null) {
    setUsuario(perfil)
    if (perfil) localStorage.setItem(CHAVE, JSON.stringify(perfil))
    else localStorage.removeItem(CHAVE)
  }

  const value = {
    usuario,
    entrar: async (email: string, senha: string) => salvar(await api.login(email, senha)),
    cadastrar: async (dados: DadosCadastro) => salvar(await api.cadastrar(dados)),
    atualizar: async (perfil: Perfil) => salvar(await api.atualizarPerfil(perfil)),
    sair: () => salvar(null),
  }

  return <AuthContext value={value}>{children}</AuthContext>
}
