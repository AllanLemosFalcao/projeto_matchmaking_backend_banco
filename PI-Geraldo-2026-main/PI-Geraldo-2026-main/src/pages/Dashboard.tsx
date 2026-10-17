import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { CabecalhoPagina } from '../components/CabecalhoPagina'
import { FotoPerfil } from '../components/FotoPerfil'
import { IconeBusca } from '../components/icones'
import { Onda } from '../components/Onda'
import { Botao, Cartao, Selo } from '../components/ui'
import { useAuth } from '../contexts/auth'
import * as api from '../services/api'
import type { Match, Perfil, ResumoAtividade } from '../types'
import { destaque, subtitulo } from '../utils/perfil'

function Secao({ titulo, link, children }: { titulo: string; link: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <div className="mb-5 flex items-baseline justify-between gap-4 px-1">
        <h2 className="text-xl font-semibold sm:text-2xl">{titulo}</h2>
        <Link to={link} className="whitespace-nowrap hover:underline sm:text-lg">
          Ver todas
        </Link>
      </div>
      {children}
    </section>
  )
}

function ItemPerfil({ perfil }: { perfil: Perfil }) {
  return (
    <div className="flex items-center gap-4">
      <FotoPerfil perfil={perfil} tamanho="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg">{perfil.nome}</p>
        <p className="truncate text-zinc-300">{subtitulo(perfil)}</p>
      </div>
      <span className="hidden sm:block">
        <Selo>{destaque(perfil)}</Selo>
      </span>
    </div>
  )
}

export function Dashboard() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [resumo, setResumo] = useState<ResumoAtividade | null>(null)
  const [recomendados, setRecomendados] = useState<Perfil[]>([])
  const [matches, setMatches] = useState<Array<{ match: Match; outro: Perfil }>>([])

  useEffect(() => {
    if (!usuario) return
    api.resumoAtividade(usuario.id).then(setResumo)
    api.recomendacoes(usuario).then(setRecomendados)
    api.listarMatches(usuario.id).then(setMatches)
  }, [usuario])

  if (!usuario) return null

  const cards = [
    { valor: resumo?.interessesEnviados, label: 'Interesses enviados', cor: 'bg-rosa' },
    { valor: resumo?.interessesRecebidos, label: 'Interesses recebidos', cor: 'bg-lima' },
    { valor: resumo?.matches, label: 'Matches', cor: 'bg-linear-to-b from-rosa from-30% to-lima' },
  ]

  return (
    <>
      <CabecalhoPagina titulo={`Olá, ${usuario.nome}`} subtitulo="Aqui está o resumo da sua atividade." />

      <div className="mx-auto grid max-w-4xl grid-cols-3 gap-3 sm:gap-8">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-3xl p-4 text-zinc-950 sm:px-10 sm:py-9 ${c.cor}`}>
            <p className="titulo text-4xl sm:text-6xl">{c.valor ?? '–'}</p>
            <p className="mt-2 text-sm sm:mt-4 sm:text-xl">{c.label}</p>
          </div>
        ))}
      </div>

      <Onda className="mt-12 h-8 text-white sm:h-14" />

      <Secao
        titulo={usuario.papel === 'investidor' ? 'Oportunidades recomendadas' : 'Investidores recomendados'}
        link="/buscar"
      >
        <Cartao className="px-5 py-6 sm:px-12 sm:py-10">
          {recomendados.length === 0 ? (
            <p className="text-zinc-300">Complete seu perfil para receber recomendações.</p>
          ) : (
            <ul className="space-y-6">
              {recomendados.map((p) => (
                <li key={p.id}>
                  <ItemPerfil perfil={p} />
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </Secao>

      <Secao titulo="Matches recentes" link="/conversas">
        <Cartao className="px-5 py-6 sm:px-12 sm:py-10">
          {matches.length === 0 ? (
            <div className="flex flex-col items-center gap-6 py-6 text-center">
              <IconeBusca width={64} height={64} className="text-zinc-500" strokeWidth={1.4} />
              <p className="mt-8 text-lg">Você ainda não tem matches. Explore a busca para registrar interesse.</p>
              <Botao variante="branco" className="-mt-4 px-8" onClick={() => navigate('/buscar')}>
                Buscar oportunidades
              </Botao>
            </div>
          ) : (
            <ul className="space-y-6">
              {matches.slice(0, 4).map(({ match, outro }) => (
                <li key={match.id}>
                  <Link to={`/conversas/${match.id}`} className="block rounded-xl hover:bg-white/5">
                    <ItemPerfil perfil={outro} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </Secao>
    </>
  )
}
