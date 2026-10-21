import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { CabecalhoPagina } from '../components/CabecalhoPagina'
import { FotoPerfil } from '../components/FotoPerfil'
import { Botao, Cartao, Tag } from '../components/ui'
import { useAuth } from '../contexts/auth'
import * as api from '../services/api'
import type { Perfil } from '../types'
import { destaque, subtitulo } from '../utils/perfil'

export function VisualizarPerfil() {
  const { id } = useParams()
  const { usuario } = useAuth()
  const navigate = useNavigate()
  
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Status de conexão
  const [matchId, setMatchId] = useState<string | null>(null)
  const [enviouInteresse, setEnviouInteresse] = useState(false)
  const [recebeuInteresse, setRecebeuInteresse] = useState(false)
  const [carregandoAcao, setCarregandoAcao] = useState(false)

  useEffect(() => {
    if (!id || !usuario) return

    async function carregarDados() {
      try {
        const p = await api.buscarPerfilPorId(id!)
        setPerfil(p)

        const matches = await api.listarMatches(usuario!.id)
        const matchExistente = matches.find(m => m.outro.id === id)
        if (matchExistente) {
          setMatchId(matchExistente.match.id)
        }

        const enviados = await api.interessesEnviados(usuario!.id)
        if (enviados.includes(id!)) {
          setEnviouInteresse(true)
        }

        const pendentes = await api.interessesPendentes(usuario!.id)
        if (pendentes.some(p => p.id === id)) {
          setRecebeuInteresse(true)
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error)
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [id, usuario])

  if (loading) return <p className="p-6 text-suave">Carregando perfil...</p>
  if (!perfil) return <p className="p-6 text-suave">Perfil não encontrado.</p>

  const ehMeuProprioPerfil = usuario?.id === perfil.id

  async function registrar() {
    if (!usuario || !perfil) return
    setCarregandoAcao(true)
    try {
      const match = await api.registrarInteresse(usuario.id, perfil.id)
      if (match) {
        setMatchId(match.id)
      } else {
        setEnviouInteresse(true)
      }
    } finally {
      setCarregandoAcao(false)
    }
  }

  async function aceitar() {
    if (!usuario || !perfil) return
    setCarregandoAcao(true)
    try {
      const match = await api.aceitarPendente(perfil.id)
      if (match) setMatchId(match.id)
    } finally {
      setCarregandoAcao(false)
    }
  }

  async function recusar() {
    if (!usuario || !perfil) return
    setCarregandoAcao(true)
    try {
      await api.recusarPendente(perfil.id)
      setRecebeuInteresse(false)
    } finally {
      setCarregandoAcao(false)
    }
  }

  return (
    <>
      <CabecalhoPagina titulo="Visão Geral" subtitulo={`Conheça mais sobre ${perfil.nome}`} />

      <Cartao className="flex flex-col gap-8 p-6 sm:p-12">
        {/* CABEÇALHO DO PERFIL E STATUS */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-borda/50 pb-8">
          <div className="flex items-center gap-5">
            <FotoPerfil perfil={perfil} tamanho="xl" />
            <div>
              <h2 className="text-3xl font-bold">{perfil.nome}</h2>
              <p className="text-xl text-zinc-300 mt-1">{subtitulo(perfil)}</p>
              <div className="mt-3">
                <Tag>{perfil.localizacao}</Tag>
              </div>
            </div>
          </div>

          {/* BOTÕES DE AÇÃO / INDICADORES DE VÍNCULO */}
          {!ehMeuProprioPerfil && (
            <div className="flex flex-col gap-3 w-full sm:w-auto">
              {matchId ? (
                <>
                  <span className="text-lima text-sm font-semibold text-center sm:text-right">Vocês são um Match! 🎉</span>
                  <Botao variante="branco" onClick={() => navigate(`/conversas/${matchId}`)}>
                    Ir para conversa
                  </Botao>
                </>
              ) : recebeuInteresse ? (
                <>
                  <span className="text-(--acento) text-sm font-semibold text-center sm:text-right">Tem interesse em você! 👀</span>
                  <div className="flex gap-2">
                    <Botao variante="contorno" onClick={recusar} disabled={carregandoAcao}>
                      Recusar
                    </Botao>
                    <Botao onClick={aceitar} disabled={carregandoAcao}>
                      {carregandoAcao ? 'Aceitando...' : 'Aceitar e Conectar'}
                    </Botao>
                  </div>
                </>
              ) : enviouInteresse ? (
                <>
                  <span className="text-suave text-sm text-center sm:text-right">Aguardando resposta ⏳</span>
                  <Botao variante="contorno" disabled>
                    Interesse registrado
                  </Botao>
                </>
              ) : (
                <Botao onClick={registrar} disabled={carregandoAcao}>
                  {carregandoAcao ? 'Registrando...' : 'Registrar interesse'}
                </Botao>
              )}
            </div>
          )}
        </div> {/* <-- Esta era a div que estava faltando no seu código */}

        {/* DETALHES DO PERFIL */}
        <div className="space-y-8 text-lg">
          {perfil.papel === 'startup' ? (
            <>
              <section>
                <h3 className="font-semibold text-zinc-400 mb-2">Sobre a Startup</h3>
                <p>{perfil.descricao}</p>
              </section>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-zinc-400 mb-1">Mercado</h3>
                  <p>{perfil.mercado || 'Não informado'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-400 mb-1">Modelo de Negócio</h3>
                  <p>{perfil.modeloNegocio || 'Não informado'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-400 mb-1">Equipe</h3>
                  <p>{perfil.composicaoEquipe || 'Não informado'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-400 mb-1">Investimento Buscado</h3>
                  <p className="font-bold text-(--acento)">{destaque(perfil)}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <section>
                <h3 className="font-semibold text-zinc-400 mb-2">Tese de Investimento</h3>
                <p>{perfil.tese}</p>
              </section>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-zinc-400 mb-2">Segmentos de Interesse</h3>
                  <div className="flex flex-wrap gap-2">
                    {perfil.segmentosInteresse?.map(s => <Tag key={s}>{s}</Tag>)}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-400 mb-2">Estágios Preferidos</h3>
                  <div className="flex flex-wrap gap-2">
                    {perfil.estagiosPreferidos?.map(e => <Tag key={e}>{e}</Tag>)}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <h3 className="font-semibold text-zinc-400 mb-1">Ticket Médio (Faixa de Investimento)</h3>
                  <p className="font-bold text-(--acento)">{destaque(perfil)}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </Cartao>
    </>
  )
}