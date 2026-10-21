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
import { destaque, subtitulo, compatibilidadeVisual } from '../utils/perfil'

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
      <div className="hidden sm:flex items-center gap-2">
        {perfil.score !== undefined && compatibilidadeVisual(perfil.score) && (
          <span className="px-3 py-1 rounded-full bg-white/10 text-white text-sm font-medium border border-white/20 shadow-lg whitespace-nowrap">
            {compatibilidadeVisual(perfil.score)}
          </span>
        )}
        <Selo>{destaque(perfil)}</Selo>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [resumo, setResumo] = useState<ResumoAtividade | null>(null)
  const [detalhes, setDetalhes] = useState<any>(null)
  const [recomendados, setRecomendados] = useState<Perfil[]>([])
  const [matches, setMatches] = useState<Array<{ match: Match; outro: Perfil }>>([])
  
  // Controle do Modal
  const [modalAberto, setModalAberto] = useState<'enviados' | 'recebidos' | 'matches' | null>(null)
  const [mostrarHistorico, setMostrarHistorico] = useState(false)

  useEffect(() => {
    if (!usuario) return
    api.resumoAtividade(usuario.id).then(setResumo)
    api.detalhesDashboard(usuario.id).then(setDetalhes) // Nova chamada!
    api.recomendacoes(usuario).then(setRecomendados)
    api.listarMatches(usuario.id).then(setMatches)
  }, [usuario])

  if (!usuario) return null

  const pendentes = resumo?.interessesRecebidos || 0
  const temPendente = pendentes > 0

  const cards = [
    { 
      id: 'enviados',
      valor: resumo?.interessesEnviados, 
      label: 'Interesses enviados', 
      cor: 'bg-rosa text-zinc-950' 
    },
    { 
      id: 'recebidos',
      valor: resumo?.interessesRecebidos, 
      label: temPendente ? 'Ações pendentes' : 'Interesses recebidos', 
      // Removida a condicional do fundo vermelho, mantendo a cor verde lima (original)
      cor: 'bg-lima text-zinc-950',
      alerta: temPendente ? `Você tem ${pendentes} oportunidade(s) aguardando sua resposta.` : null
    },
    { 
      id: 'matches',
      valor: resumo?.matches, 
      label: 'Matches', 
      cor: 'bg-linear-to-b from-rosa from-30% to-lima text-zinc-950' 
    },
  ]

  // Renderizador da lista dentro do modal
  const renderListaMini = (lista: any[], tituloVazio: string) => {
    if (!lista || lista.length === 0) return <p className="text-suave text-sm py-4">{tituloVazio}</p>
    return (
      <ul className="space-y-3 mt-3">
        {lista.map(item => (
          <li key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition">
            <Link to={`/perfil/${item.id}`} className="flex items-center gap-3 flex-1 min-w-0">
              <FotoPerfil perfil={item as any} tamanho="sm" />
              <p className="truncate text-white font-medium">{item.nome}</p>
            </Link>
            <span className={`text-xs px-2 py-1 rounded-full border ${
              item.status === 'pendente' ? 'border-zinc-500 text-zinc-400' :
              item.status === 'aceito' || item.status === 'ativo' ? 'border-lima text-lima' :
              'border-rosa text-rosa'
            }`}>
              {item.status.toUpperCase()}
            </span>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <>
      <CabecalhoPagina titulo={`Olá, ${usuario.nome}`} subtitulo="Aqui está o resumo da sua atividade." />

      {/* CARDS CLICÁVEIS */}
      <div className="mx-auto grid max-w-4xl grid-cols-3 gap-3 sm:gap-8">
        {cards.map((c) => (
          <div 
            key={c.id} // Corrigido para usar o ID imutável
            onClick={() => { setModalAberto(c.id as any); setMostrarHistorico(false); }}
            // Diminuímos o px-10 para px-6 (ou px-5) para dar mais espaço interno ao texto
            className={`flex flex-col justify-center rounded-3xl p-4 sm:px-6 sm:py-9 transition-all cursor-pointer hover:scale-105 hover:shadow-2xl ${c.cor}`}
          >
            <p className="titulo text-4xl sm:text-6xl">{c.valor ?? '–'}</p>
            
            {/* Adicionado o whitespace-nowrap e tracking-tight para a fonte caber perfeitamente na mesma linha */}
            <p className="mt-2 text-sm font-semibold sm:mt-4 sm:text-lg lg:text-xl tracking-tight whitespace-nowrap">
              {c.label}
            </p>
            
            {c.alerta && (
              <p className="mt-2 text-xs sm:text-sm font-medium opacity-90 leading-tight">
                {c.alerta}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* MODAL DE INTERAÇÕES */}
      {modalAberto && detalhes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-superficie border border-borda rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            
            <div className="p-6 border-b border-borda flex justify-between items-center bg-zinc-900/50">
              <h3 className="titulo text-2xl text-white capitalize">{modalAberto}</h3>
              <button onClick={() => setModalAberto(null)} className="text-suave hover:text-white text-2xl">✕</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <h4 className="text-zinc-300 font-semibold uppercase text-sm tracking-wider">Interações Ativas</h4>
              {renderListaMini(detalhes[modalAberto].ativos, 'Nenhuma interação ativa no momento.')}

              <div className="mt-8">
                <button 
                  onClick={() => setMostrarHistorico(!mostrarHistorico)}
                  className="w-full flex justify-between items-center py-3 text-zinc-300 font-semibold border-t border-borda hover:text-white transition"
                >
                  <span className="uppercase text-sm tracking-wider">Histórico de Interações</span>
                  <span>{mostrarHistorico ? '▲' : '▼'}</span>
                </button>
                
                {mostrarHistorico && (
                  <div className="mt-2 animate-in slide-in-from-top-2 duration-200">
                    {renderListaMini(detalhes[modalAberto].historico, 'Nenhum histórico registrado.')}
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}

      <Onda className="mt-12 h-8 text-white sm:h-14" />
      
      {/* Secoes Recomendados e Matches mantidas originais... */}
      <Secao titulo={usuario.papel === 'investidor' ? 'Oportunidades recomendadas' : 'Investidores recomendados'} link="/buscar">
        <Cartao className="px-5 py-6 sm:px-12 sm:py-10">
          {recomendados.length === 0 ? (
            <p className="text-zinc-300">Complete seu perfil para receber recomendações.</p>
          ) : (
            <ul className="space-y-6">
              {recomendados.map((p) => (
                <li key={p.id}>
                  <Link to={`/perfil/${p.id}`} className="block rounded-xl transition hover:opacity-80">
                    <ItemPerfil perfil={p} />
                  </Link>
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