import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Cartao, Selo } from '../components/ui'
import * as api from '../services/api'
import type { Perfil, PerfilStartup, PerfilInvestidor } from '../types'
import { formatarReais } from '../utils/formatar'
import { destaque } from '../utils/perfil'

export function VisualizarPerfil() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!id) return
    api.buscarPerfilPorId(id).then((dados) => {
      setPerfil(dados)
      setCarregando(false)
    }).catch(() => setCarregando(false))
  }, [id])

  if (carregando) return <p className="text-zinc-400 p-8">Carregando detalhes do perfil...</p>
  if (!perfil) return <p className="text-rosa p-8">Perfil não encontrado.</p>

  const isStartup = perfil.papel === 'startup'
  const pStartup = perfil as PerfilStartup
  const pInvestidor = perfil as PerfilInvestidor

  // Lógica para gerar o Avatar com a letra inicial (igual ao seu Figma)
  const inicial = perfil.nome ? perfil.nome.charAt(0).toUpperCase() : '?'
  const corFundoAvatar = isStartup ? 'bg-blue-500' : 'bg-emerald-500'

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <button 
        onClick={() => navigate(-1)} 
        className="mb-8 flex items-center gap-2 text-zinc-400 hover:text-white transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Voltar
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Detalhes do Perfil</h1>
        <p className="text-zinc-400">Analise as informações completas da conta.</p>
      </div>

      <Cartao className="p-8 sm:p-10">
        <div className="flex flex-col sm:flex-row items-start gap-6 border-b border-white/10 pb-8">
          
          {/* Avatar da Empresa / Investidor */}
          {perfil.foto ? (
            <img src={perfil.foto} alt={perfil.nome} className="w-24 h-24 rounded-2xl object-cover" />
          ) : (
            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-bold text-white ${corFundoAvatar}`}>
              {inicial}
            </div>
          )}
          
          <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold">{perfil.nome}</h2>
            
            {/* Tags de Segmentos e Localização */}
            <div className="flex flex-wrap gap-2">
              {isStartup ? (
                <>
                  <span className="px-3 py-1 rounded-full border border-white/10 text-sm text-zinc-300">{pStartup.segmento}</span>
                  <span className="px-3 py-1 rounded-full border border-white/10 text-sm text-zinc-300">{pStartup.estagio}</span>
                </>
              ) : (
                pInvestidor.segmentosInteresse.map(s => (
                  <span key={s} className="px-3 py-1 rounded-full border border-white/10 text-sm text-zinc-300">{s}</span>
                ))
              )}
              <span className="px-3 py-1 rounded-full border border-white/10 text-sm text-zinc-300">{perfil.localizacao}</span>
            </div>

            <div className="inline-block mt-2">
               <Selo>{destaque(perfil)}</Selo>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-10 pt-8">
          {/* Coluna Esquerda - Texto */}
          <div className="space-y-8">
             <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {isStartup ? "O que resolvemos" : "Tese de Investimento"}
                </h3>
                <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {isStartup ? pStartup.descricao : pInvestidor.tese}
                </p>
             </div>

             {isStartup && pStartup.composicaoEquipe && (
               <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Nossa Equipe</h3>
                  <p className="text-zinc-300">{pStartup.composicaoEquipe}</p>
               </div>
             )}
          </div>

          {/* Coluna Direita - Dados de Negócio */}
          <div className="space-y-6 bg-white/5 rounded-2xl p-6 sm:p-8">
             {isStartup ? (
                <>
                  {pStartup.mercado && (
                    <div>
                      <h4 className="text-xs text-zinc-500 uppercase tracking-wider">Mercado Alvo</h4>
                      <p className="text-lg text-white mt-1">{pStartup.mercado}</p>
                    </div>
                  )}
                  {pStartup.modeloNegocio && (
                    <div>
                      <h4 className="text-xs text-zinc-500 uppercase tracking-wider">Modelo de Negócio</h4>
                      <p className="text-lg text-white mt-1">{pStartup.modeloNegocio}</p>
                    </div>
                  )}
                  <div className="pt-4 border-t border-white/10">
                    <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Busca captar</h4>
                    <p className="text-3xl font-bold text-lima">{formatarReais(pStartup.valorInvestimento)}</p>
                    <p className="text-sm text-zinc-400 mt-1">Cede {pStartup.participacaoOferecida}% de equity</p>
                  </div>
                </>
             ) : (
                <>
                  <div>
                    <h4 className="text-xs text-zinc-500 uppercase tracking-wider">Estágios preferidos</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {pInvestidor.estagiosPreferidos.map(e => (
                          <span key={e} className="px-2 py-1 bg-white/10 rounded text-sm text-zinc-300">{e}</span>
                        ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Ticket de Investimento</h4>
                    <p className="text-2xl font-bold text-rosa">
                       {formatarReais(pInvestidor.investimentoMinimo)} <br/>
                       <span className="text-lg text-zinc-500 font-normal">até</span> <br/>
                       {formatarReais(pInvestidor.investimentoMaximo)}
                    </p>
                  </div>
                </>
             )}
          </div>
        </div>
      </Cartao>
    </div>
  )
}