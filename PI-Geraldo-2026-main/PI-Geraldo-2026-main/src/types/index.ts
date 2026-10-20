import type { ESTAGIOS, SEGMENTOS } from '../constants'

export type Papel = 'startup' | 'investidor'
export type Segmento = (typeof SEGMENTOS)[number]
export type Estagio = (typeof ESTAGIOS)[number]

interface UsuarioBase {
  id: string
  nome: string
  email: string
  papel: Papel
  /** URL ou data URL da foto/logo */
  foto?: string
  localizacao: string
  score?: number 
}

export interface PerfilStartup extends UsuarioBase {
  papel: 'startup'
  descricao: string
  segmento: Segmento
  estagio: Estagio
  composicaoEquipe: string
  mercado: string
  modeloNegocio: string
  /** Valor que a startup busca captar (R$) */
  valorInvestimento: number
  /** Participação societária oferecida em troca do investimento (%) — exibida como "aderência" */
  participacaoOferecida: number
}

export interface PerfilInvestidor extends UsuarioBase {
  papel: 'investidor'
  tese: string
  segmentosInteresse: Segmento[]
  estagiosPreferidos: Estagio[]
  investimentoMinimo: number
  investimentoMaximo: number
}

export type Perfil = PerfilStartup | PerfilInvestidor

/** Distributes Omit over the union so each variant keeps its own fields. */
type SemId<T> = T extends unknown ? Omit<T, 'id'> : never
export type DadosCadastro = SemId<Perfil> & { 
  senha: string
  aceiteTermos?: boolean 
}

/** "deId registrou interesse em paraId". Interesse mútuo = match. */
export interface Interesse {
  deId: string
  paraId: string
  criadoEm: string
}

export interface Match {
  id: string
  usuarios: [string, string]
  criadoEm: string
}

export interface Mensagem {
  id: string
  matchId: string
  autorId: string
  texto: string
  enviadaEm: string
}

export interface FiltrosBusca {
  texto: string
  segmento: string
  localizacao: string
  estagio: string
}

export interface ResumoAtividade {
  interessesEnviados: number
  interessesRecebidos: number
  matches: number
}
