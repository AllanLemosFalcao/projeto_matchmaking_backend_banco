import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { CabecalhoPagina } from '../components/CabecalhoPagina'
import { FotoPerfil } from '../components/FotoPerfil'
import { Botao, Cartao, Selo, Tag } from '../components/ui'
import { ESTAGIOS, SEGMENTOS } from '../constants'
import { useAuth } from '../contexts/auth'
import * as api from '../services/api'
import type { FiltrosBusca, Perfil } from '../types'
import { formatarReais } from '../utils/formatar'
import { destaque, compatibilidadeVisual } from '../utils/perfil'

const filtroClasses =
  'w-full min-w-0 rounded-xl border border-borda bg-transparent px-3 py-3 text-sm text-white outline-none focus:border-(--acento) sm:px-5 sm:py-4 sm:text-base'

function Filtro({
  valor,
  onChange,
  todos,
  opcoes,
}: {
  valor: string
  onChange: (v: string) => void
  todos: string
  opcoes: readonly string[]
}) {
  return (
    <select
      aria-label={todos}
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      className={`${filtroClasses} appearance-none bg-fundo`}
    >
      <option value="" className="bg-zinc-900 text-white">{todos}</option>
      {opcoes.map((o) => (
        <option key={o} className="bg-zinc-900 text-white">{o}</option>
      ))}
    </select>
  )
}

export function Buscar() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [filtros, setFiltros] = useState<FiltrosBusca>({ texto: '', segmento: '', localizacao: '', estagio: '' })
  const [resultados, setResultados] = useState<Perfil[] | null>(null)
  const [locais, setLocais] = useState<string[]>([])
  
  // Estados de conexão
  const [enviados, setEnviados] = useState<Set<string>>(new Set())
  const [recebidos, setRecebidos] = useState<Set<string>>(new Set()) // Interesses que outros enviaram pra mim
  const [matches, setMatches] = useState<Record<string, string>>({})
  const [carregandoAcao, setCarregandoAcao] = useState<string | null>(null)

  useEffect(() => {
    if (!usuario) return
    api.listarLocalizacoes(usuario.papel).then(setLocais)
    
    // Busca interesses enviados
    api.interessesEnviados(usuario.id).then((ids) => setEnviados(new Set(ids)))
    
    // Busca interesses recebidos (pendentes)
    api.interessesPendentes(usuario.id).then((lista) => setRecebidos(new Set(lista.map(p => p.id))))
    
    // Busca matches
    api
      .listarMatches(usuario.id)
      .then((lista) => setMatches(Object.fromEntries(lista.map(({ match, outro }) => [outro.id, match.id]))))
  }, [usuario])

  useEffect(() => {
    if (!usuario) return
    let atual = true
    api.buscar(usuario, filtros).then((r) => atual && setResultados(r))
    return () => { atual = false }
  }, [usuario, filtros])

  if (!usuario) return null
  const buscaStartups = usuario.papel === 'investidor'
  const mudar = (campos: Partial<FiltrosBusca>) => setFiltros((f) => ({ ...f, ...campos }))

  async function registrar(alvo: Perfil) {
    if (!usuario) return
    setCarregandoAcao(alvo.id)
    try {
      setEnviados((s) => new Set(s).add(alvo.id))
      const match = await api.registrarInteresse(usuario.id, alvo.id)
      if (match) setMatches((m) => ({ ...m, [alvo.id]: match.id }))
    } finally {
      setCarregandoAcao(null)
    }
  }

  async function aceitar(alvoId: string) {
    setCarregandoAcao(alvoId)
    try {
      const match = await api.aceitarPendente(alvoId)
      if (match) {
        setMatches((m) => ({ ...m, [alvoId]: match.id }))
        setRecebidos((prev) => {
          const next = new Set(prev)
          next.delete(alvoId)
          return next
        })
      }
    } finally {
      setCarregandoAcao(null)
    }
  }

  return (
    <>
      <CabecalhoPagina
        titulo={buscaStartups ? 'Buscar startups' : 'Buscar investidores'}
        subtitulo="Filtre por critérios relevantes e registre interesse em quem fizer sentido"
      />

      <Cartao className="grid gap-2 p-3 sm:grid-cols-3 sm:gap-5 sm:p-6 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <input
          type="search"
          placeholder="Buscar por nome ou descrição."
          value={filtros.texto}
          onChange={(e) => mudar({ texto: e.target.value })}
          className={`${filtroClasses} bg-zinc-900 placeholder:text-zinc-300 sm:col-span-3 lg:col-span-1`}
        />
        <Filtro valor={filtros.segmento} onChange={(v) => mudar({ segmento: v })} todos="Todos os segmentos" opcoes={SEGMENTOS} />
        <Filtro valor={filtros.localizacao} onChange={(v) => mudar({ localizacao: v })} todos="Todos os locais" opcoes={locais} />
        <Filtro valor={filtros.estagio} onChange={(v) => mudar({ estagio: v })} todos="Todos os estágios" opcoes={ESTAGIOS} />
      </Cartao>

      <div className="mt-8 space-y-6">
        {resultados === null && <p className="text-suave">Carregando…</p>}
        {resultados?.length === 0 && <p className="text-suave">Nenhum resultado com esses filtros.</p>}

        {resultados?.map((p) => {
          const matchId = matches[p.id]
          const isRecebido = recebidos.has(p.id)
          const isEnviado = enviados.has(p.id)

          return (
            <Cartao key={p.id} className="flex flex-col gap-6 p-6 sm:flex-row sm:p-11">
              
              <button 
                type="button"
                onClick={() => navigate(`/perfil/${p.id}`)}
                className="shrink-0 transition hover:opacity-80 focus:outline-none"
                aria-label={`Ver perfil de ${p.nome}`}
              >
                <FotoPerfil perfil={p} tamanho="md" />
              </button>

              <div className="min-w-0 flex-1 space-y-4">
                
                {/* Título com as Badges de Status ao lado */}
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold">{p.nome}</h2>
                  {matchId ? (
                    <span className="rounded-full bg-lima/20 text-lima px-3 py-1 text-xs font-bold border border-lima/30">🔥 Match</span>
                  ) : isRecebido ? (
                    <span className="rounded-full bg-(--acento)/20 text-(--acento) px-3 py-1 text-xs font-bold border border-(--acento)/30">👀 Quer conectar</span>
                  ) : isEnviado ? (
                    <span className="rounded-full bg-white/10 text-suave px-3 py-1 text-xs font-bold border border-white/20">⏳ Pendente</span>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {p.papel === 'startup' ? (
                    <>
                      <Tag>{p.segmento}</Tag>
                      <Tag>{p.estagio}</Tag>
                    </>
                  ) : (
                    p.segmentosInteresse.slice(0, 3).map((s) => <Tag key={s}>{s}</Tag>)
                  )}
                  <Tag>{p.localizacao}</Tag>
                </div>
                <p className="max-w-2xl text-lg text-zinc-300">{p.papel === 'startup' ? p.descricao : p.tese}</p>
                <p className="text-lg font-semibold text-zinc-300">
                  {p.papel === 'startup'
                    ? `Busca ${formatarReais(p.valorInvestimento)}`
                    : `Investe ${destaque(p)}`}
                </p>
              </div>

              {/* === COLUNA DA DIREITA === */}
              <div className="flex flex-col items-end justify-start gap-4 mt-4 sm:mt-0 w-full sm:w-auto">
                <div className="flex flex-wrap justify-end gap-2">
                  {p.score !== undefined && compatibilidadeVisual(p.score) && (
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white text-sm font-medium border border-white/20 shadow-lg">
                      {compatibilidadeVisual(p.score)}
                    </span>
                  )}
                  {p.papel === 'startup' && <Selo>{destaque(p)}</Selo>}
                </div>
                
                <div className="flex flex-col gap-3 w-full sm:w-auto mt-auto">
                  <Botao variante="contorno" onClick={() => navigate(`/perfil/${p.id}`)}>
                    Ver perfil
                  </Botao>
                  {matchId ? (
                    <Botao variante="branco" onClick={() => navigate(`/conversas/${matchId}`)}>
                      Ir para conversa
                    </Botao>
                  ) : isRecebido ? (
                    <Botao onClick={() => aceitar(p.id)} disabled={carregandoAcao === p.id}>
                      {carregandoAcao === p.id ? 'Aceitando...' : 'Aceitar e Conectar'}
                    </Botao>
                  ) : isEnviado ? (
                    <Botao variante="contorno" disabled>
                      Interesse registrado
                    </Botao>
                  ) : (
                    <Botao variante={buscaStartups ? 'rosa' : 'acento'} onClick={() => registrar(p)} disabled={carregandoAcao === p.id}>
                      {carregandoAcao === p.id ? 'Registrando...' : 'Registrar interesse'}
                    </Botao>
                  )}
                </div>
              </div>
            </Cartao>
          )
        })}
      </div>
    </>
  )
}