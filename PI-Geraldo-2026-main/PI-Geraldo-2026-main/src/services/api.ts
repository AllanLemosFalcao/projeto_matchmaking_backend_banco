/**
 * Camada de acesso a dados.
 *
 * Enquanto o back-end não está pronto, todas as funções usam os dados de
 * `src/mocks`. Quando a API existir, basta trocar a implementação de cada
 * função por uma chamada `http(...)` mantendo as mesmas assinaturas — as
 * páginas não precisam mudar.
 */
import { db, salvarDb } from '../mocks/data'
import type {
  DadosCadastro,
  FiltrosBusca,
  Match,
  Mensagem,
  Perfil,
  PerfilInvestidor,
  PerfilStartup,
  ResumoAtividade,
} from '../types'

export const API_URL = import.meta.env.VITE_API_URL ?? ''

// Helper para quando a API real estiver disponível.
export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) throw new Error(`Erro ${res.status} em ${path}`)
  return res.json() as Promise<T>
}

const esperar = (ms = 250) => new Promise((r) => setTimeout(r, ms))
const novoId = () => crypto.randomUUID()
const perfilPorId = (id: string) => db.perfis.find((p) => p.id === id)

// ---------- Autenticação ----------

export async function login(email: string, senha: string): Promise<Perfil> {
  await esperar()
  const perfil = db.perfis.find((p) => p.email.toLowerCase() === email.toLowerCase())
  if (!perfil || !senha) throw new Error('E-mail ou senha inválidos')
  return perfil
}

export async function cadastrar(dados: DadosCadastro): Promise<Perfil> {
  await esperar()
  if (db.perfis.some((p) => p.email.toLowerCase() === dados.email.toLowerCase())) {
    throw new Error('Este e-mail já está cadastrado')
  }
  // O mock não guarda senha (qualquer senha entra); a API real vai validar.
  const perfil: Perfil & { senha?: string } = { ...dados, id: novoId() }
  delete perfil.senha
  db.perfis.push(perfil)
  salvarDb()
  return perfil
}

export async function atualizarPerfil(perfil: Perfil): Promise<Perfil> {
  await esperar()
  const i = db.perfis.findIndex((p) => p.id === perfil.id)
  if (i >= 0) db.perfis[i] = perfil
  salvarDb()
  return perfil
}

// ---------- Busca ----------

/** Investidores buscam startups e vice-versa. */
export async function buscar(usuario: Perfil, filtros: FiltrosBusca): Promise<Perfil[]> {
  await esperar()
  const texto = filtros.texto.trim().toLowerCase()
  const alvo = usuario.papel === 'investidor' ? 'startup' : 'investidor'

  return db.perfis.filter((p) => {
    if (p.papel !== alvo) return false
    if (filtros.localizacao && p.localizacao !== filtros.localizacao) return false
    if (p.papel === 'startup') {
      if (filtros.segmento && p.segmento !== filtros.segmento) return false
      if (filtros.estagio && p.estagio !== filtros.estagio) return false
      if (texto && !`${p.nome} ${p.descricao}`.toLowerCase().includes(texto)) return false
    } else {
      if (filtros.segmento && !p.segmentosInteresse.includes(filtros.segmento as never)) return false
      if (filtros.estagio && !p.estagiosPreferidos.includes(filtros.estagio as never)) return false
      if (texto && !`${p.nome} ${p.tese}`.toLowerCase().includes(texto)) return false
    }
    return true
  })
}

/** Localizações existentes, para o filtro "Todos os locais". */
export async function listarLocalizacoes(papel: Perfil['papel']): Promise<string[]> {
  await esperar(50)
  const alvo = papel === 'investidor' ? 'startup' : 'investidor'
  return [...new Set(db.perfis.filter((p) => p.papel === alvo).map((p) => p.localizacao))].sort()
}

/** Recomendações simples por afinidade de segmento/estágio/valor. */
export async function recomendacoes(usuario: Perfil, limite = 4): Promise<Perfil[]> {
  await esperar()
  const pontuar = (inv: PerfilInvestidor, st: PerfilStartup) =>
    Number(inv.segmentosInteresse.includes(st.segmento)) * 2 +
    Number(inv.estagiosPreferidos.includes(st.estagio)) +
    Number(st.valorInvestimento >= inv.investimentoMinimo && st.valorInvestimento <= inv.investimentoMaximo)

  const candidatos = db.perfis
    .filter((p) => p.papel !== usuario.papel)
    .map((p) => ({
      perfil: p,
      pontos:
        usuario.papel === 'investidor'
          ? pontuar(usuario, p as PerfilStartup)
          : pontuar(p as PerfilInvestidor, usuario),
    }))
    .filter((c) => c.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos)

  return candidatos.slice(0, limite).map((c) => c.perfil)
}

// ---------- Interesses e matches ----------

/** Registra interesse. Se o outro lado já tinha registrado, cria e retorna o match. */
export async function registrarInteresse(deId: string, paraId: string): Promise<Match | null> {
  await esperar(150)
  if (!db.interesses.some((i) => i.deId === deId && i.paraId === paraId)) {
    db.interesses.push({ deId, paraId, criadoEm: new Date().toISOString() })
  }
  let match: Match | null = null
  const reciproco = db.interesses.some((i) => i.deId === paraId && i.paraId === deId)
  if (reciproco && !db.matches.some((m) => m.usuarios.includes(deId) && m.usuarios.includes(paraId))) {
    match = { id: novoId(), usuarios: [deId, paraId], criadoEm: new Date().toISOString() }
    db.matches.push(match)
  }
  salvarDb()
  return match
}

/** IDs em quem o usuário já registrou interesse. */
export async function interessesEnviados(usuarioId: string): Promise<string[]> {
  await esperar(50)
  return db.interesses.filter((i) => i.deId === usuarioId).map((i) => i.paraId)
}

/** Perfis que registraram interesse no usuário e ainda não viraram match. */
export async function interessesPendentes(usuarioId: string): Promise<Perfil[]> {
  await esperar(100)
  const enviados = new Set(db.interesses.filter((i) => i.deId === usuarioId).map((i) => i.paraId))
  return db.interesses
    .filter((i) => i.paraId === usuarioId && !enviados.has(i.deId))
    .map((i) => perfilPorId(i.deId))
    .filter((p): p is Perfil => !!p)
}

export async function resumoAtividade(usuarioId: string): Promise<ResumoAtividade> {
  await esperar(100)
  return {
    interessesEnviados: db.interesses.filter((i) => i.deId === usuarioId).length,
    interessesRecebidos: db.interesses.filter((i) => i.paraId === usuarioId).length,
    matches: db.matches.filter((m) => m.usuarios.includes(usuarioId)).length,
  }
}

export async function listarMatches(usuarioId: string): Promise<Array<{ match: Match; outro: Perfil }>> {
  await esperar()
  return db.matches
    .filter((m) => m.usuarios.includes(usuarioId))
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    .map((match) => ({ match, outro: perfilPorId(match.usuarios.find((id) => id !== usuarioId)!)! }))
}

// ---------- Conversas ----------

export async function listarMensagens(matchId: string): Promise<Mensagem[]> {
  await esperar(100)
  return db.mensagens.filter((m) => m.matchId === matchId)
}

export async function enviarMensagem(matchId: string, autorId: string, texto: string): Promise<Mensagem> {
  await esperar(100)
  const msg: Mensagem = { id: novoId(), matchId, autorId, texto, enviadaEm: new Date().toISOString() }
  db.mensagens.push(msg)
  salvarDb()
  return msg
}
