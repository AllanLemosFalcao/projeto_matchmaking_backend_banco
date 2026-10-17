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
import { destaque } from '../utils/perfil'

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
      <option value="">{todos}</option>
      {opcoes.map((o) => (
        <option key={o}>{o}</option>
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
  const [enviados, setEnviados] = useState<Set<string>>(new Set())
  /** id do outro perfil -> id do match */
  const [matches, setMatches] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!usuario) return
    api.listarLocalizacoes(usuario.papel).then(setLocais)
    api.interessesEnviados(usuario.id).then((ids) => setEnviados(new Set(ids)))
    api
      .listarMatches(usuario.id)
      .then((lista) => setMatches(Object.fromEntries(lista.map(({ match, outro }) => [outro.id, match.id]))))
  }, [usuario])

  useEffect(() => {
    if (!usuario) return
    let atual = true
    api.buscar(usuario, filtros).then((r) => atual && setResultados(r))
    return () => {
      atual = false
    }
  }, [usuario, filtros])

  if (!usuario) return null
  const buscaStartups = usuario.papel === 'investidor'
  const mudar = (campos: Partial<FiltrosBusca>) => setFiltros((f) => ({ ...f, ...campos }))

  async function registrar(alvo: Perfil) {
    if (!usuario) return
    setEnviados((s) => new Set(s).add(alvo.id))
    const match = await api.registrarInteresse(usuario.id, alvo.id)
    if (match) setMatches((m) => ({ ...m, [alvo.id]: match.id }))
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
        <Filtro
          valor={filtros.segmento}
          onChange={(v) => mudar({ segmento: v })}
          todos="Todos os segmentos"
          opcoes={SEGMENTOS}
        />
        <Filtro
          valor={filtros.localizacao}
          onChange={(v) => mudar({ localizacao: v })}
          todos="Todos os locais"
          opcoes={locais}
        />
        <Filtro
          valor={filtros.estagio}
          onChange={(v) => mudar({ estagio: v })}
          todos="Todos os estágios"
          opcoes={ESTAGIOS}
        />
      </Cartao>

      <div className="mt-8 space-y-6">
        {resultados === null && <p className="text-suave">Carregando…</p>}
        {resultados?.length === 0 && <p className="text-suave">Nenhum resultado com esses filtros.</p>}

        {resultados?.map((p) => {
          const matchId = matches[p.id]
          return (
            <Cartao key={p.id} className="flex flex-col gap-6 p-6 sm:flex-row sm:p-11">
              <FotoPerfil perfil={p} tamanho="md" />

              <div className="min-w-0 flex-1 space-y-4">
                <h2 className="text-2xl font-semibold">{p.nome}</h2>
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

              <div className="flex flex-row-reverse items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-start">
                {p.papel === 'startup' && <Selo>{destaque(p)}</Selo>}
                {matchId ? (
                  <Botao variante="branco" onClick={() => navigate(`/conversas/${matchId}`)}>
                    Ir para conversa
                  </Botao>
                ) : enviados.has(p.id) ? (
                  <Botao variante="contorno" disabled>
                    Interesse registrado
                  </Botao>
                ) : (
                  <Botao variante={buscaStartups ? 'rosa' : 'acento'} onClick={() => registrar(p)}>
                    Registrar interesse
                  </Botao>
                )}
              </div>
            </Cartao>
          )
        })}
      </div>
    </>
  )
}
