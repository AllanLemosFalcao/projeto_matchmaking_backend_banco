import { useEffect, useRef, useState, type FormEvent } from 'react'
import { io } from 'socket.io-client'
import { Link, useParams } from 'react-router'
import { CabecalhoPagina } from '../components/CabecalhoPagina'
import { FotoPerfil } from '../components/FotoPerfil'
import { IconeEnviar, IconeVoltar } from '../components/icones'
import { Cartao } from '../components/ui'
import { useAuth } from '../contexts/auth'
import * as api from '../services/api'
import type { Match, Mensagem, Perfil } from '../types'
import { formatarHora } from '../utils/formatar'
import { subtitulo } from '../utils/perfil'

// Conexão com o backend via WebSocket
const socket = io('http://localhost:3000');

export function Conversas() {
  const { matchId } = useParams()
  const { usuario } = useAuth()
  const [conversas, setConversas] = useState<Array<{ match: Match; outro: Perfil }> | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [texto, setTexto] = useState('')
  const fim = useRef<HTMLDivElement>(null)

  // Recarrega ao trocar de conversa: um match novo (ex.: aceito pelo sino) ainda não está na lista
  useEffect(() => {
    if (usuario) api.listarMatches(usuario.id).then(setConversas)
  }, [usuario, matchId])

  // ==========================================
  // LÓGICA ATUALIZADA: WebSocket em Tempo Real
  // ==========================================
  useEffect(() => {
    if (!matchId) return
    let atual = true
    
    // 1. Busca o histórico de mensagens salvas no banco
    api.listarMensagens(matchId).then((m) => atual && setMensagens(m))

    // 2. Avisa ao backend que o usuário abriu esta conversa específica (entra na "sala")
    socket.emit('entrar_conversa', matchId)

    // 3. Fica escutando novas mensagens disparadas pelo backend
    const lidarComNovaMensagem = (novaMsg: Mensagem) => {
      setMensagens((msgsAntigas) => {
        // Evita duplicar a mensagem na tela para a pessoa que acabou de enviar
        if (msgsAntigas.some(m => m.id === novaMsg.id)) return msgsAntigas
        return [...msgsAntigas, novaMsg]
      })
    }

    socket.on('nova_mensagem', lidarComNovaMensagem)

    return () => {
      atual = false
      // 4. Desconecta o ouvinte ao sair da tela para evitar vazamento de memória
      socket.off('nova_mensagem', lidarComNovaMensagem)
    }
  }, [matchId])

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  if (!usuario) return null
  const aberta = conversas?.find((c) => c.match.id === matchId)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!usuario || !matchId || !texto.trim()) return
    
    // Salva o texto e limpa o input imediatamente para dar uma sensação de rapidez (UX)
    const textoEnviado = texto.trim()
    setTexto('') 

    // Dispara para o banco de dados
    const msg = await api.enviarMensagem(matchId, usuario.id, textoEnviado)
    
    // Adiciona na tela apenas se o WebSocket JÁ NÃO TIVER inserido a mesma mensagem milissegundos antes
    setMensagens((m) => {
      if (m.some((existente) => existente.id === msg.id)) return m
      return [...m, msg]
    })
  }

  return (
    <>
      <CabecalhoPagina titulo="Conversas" subtitulo="Converse com as conexões que deram match com você." />

      <Cartao className="grid h-[calc(100dvh-16rem)] min-h-[28rem] overflow-hidden md:h-[calc(100dvh-20rem)] md:grid-cols-[minmax(0,22rem)_1fr]">
        {/* Lista de conversas — no celular só aparece quando nenhuma está aberta */}
        <aside className={`overflow-y-auto border-borda/70 md:block md:border-r ${matchId ? 'hidden' : ''}`}>
          {conversas?.length === 0 && (
            <p className="p-6 text-suave">
              Nenhuma conversa ainda. As conversas aparecem quando um interesse é correspondido.
            </p>
          )}
          <ul>
            {conversas?.map(({ match, outro }) => (
              <li key={match.id}>
                <Link
                  to={`/conversas/${match.id}`}
                  className={`flex items-center gap-3 px-5 py-4 transition hover:bg-white/5 ${
                    match.id === matchId ? 'bg-white/10' : ''
                  }`}
                >
                  <FotoPerfil perfil={outro} tamanho="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{outro.nome}</p>
                    <p className="truncate text-sm text-suave">{subtitulo(outro)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <section className={`min-h-0 flex-col ${matchId ? 'flex' : 'hidden md:flex'}`}>
          {aberta && (
            <header className="flex items-center gap-3 border-b border-borda/70 px-5 py-3">
              <Link to="/conversas" className="md:hidden" aria-label="Voltar">
                <IconeVoltar />
              </Link>
              <FotoPerfil perfil={aberta.outro} tamanho="sm" />
              <p className="font-medium">{aberta.outro.nome}</p>
            </header>
          )}

          <div className="flex-1 space-y-2 overflow-y-auto p-5">
            {!matchId && <p className="grid h-full place-items-center text-suave">Selecione uma conversa.</p>}
            {matchId && mensagens.length === 0 && (
              <p className="grid h-full place-items-center text-center text-suave">
                Vocês deram match! Mande a primeira mensagem.
              </p>
            )}
            {mensagens.map((m) => {
              const minha = m.autorId === usuario.id
              return (
                <div
                  key={m.id}
                  className={`w-fit max-w-[80%] rounded-2xl px-4 py-2 ${
                    minha ? 'ml-auto bg-(--acento) text-zinc-950' : 'bg-white/10'
                  }`}
                >
                  <p>{m.texto}</p>
                  <p className={`text-right text-[10px] ${minha ? 'text-zinc-800' : 'text-suave'}`}>
                    {formatarHora(m.enviadaEm)}
                  </p>
                </div>
              )
            })}
            <div ref={fim} />
          </div>

          <form onSubmit={enviar} className="flex items-center gap-3 border-t border-borda/70 px-5 py-6 sm:px-11">
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escreva uma mensagem"
              disabled={!aberta}
              className="flex-1 rounded-lg border border-borda bg-zinc-900 px-5 py-3 outline-none placeholder:text-zinc-500 focus:border-(--acento) disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!aberta || !texto.trim()}
              aria-label="Enviar"
              className="grid size-12 shrink-0 place-items-center rounded-full bg-(--acento) text-zinc-950 disabled:opacity-40"
            >
              <IconeEnviar />
            </button>
          </form>
        </section>
      </Cartao>
    </>
  )
}