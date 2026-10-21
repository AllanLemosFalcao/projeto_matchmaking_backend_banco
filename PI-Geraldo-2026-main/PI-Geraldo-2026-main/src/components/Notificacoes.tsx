import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/auth'
import * as api from '../services/api'
import type { Perfil } from '../types'
import { FotoPerfil } from './FotoPerfil'
import { IconeSino } from './icones'

export function Notificacoes() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [pendentes, setPendentes] = useState<Perfil[]>([])
  const [aberto, setAberto] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (usuario) api.interessesPendentes(usuario.id).then(setPendentes)
  }, [usuario, aberto])

  useEffect(() => {
    if (!aberto) return
    const fechar = (e: MouseEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('click', fechar)
    return () => document.removeEventListener('click', fechar)
  }, [aberto])

  async function corresponder(outro: Perfil) {
    if (!usuario) return
    const match = await api.aceitarPendente(outro.id) // Atualizado para usar o endpoint de aceitar
    setAberto(false)
    if (match) navigate(`/conversas/${match.id}`)
  }

  // NOVA FUNÇÃO: Recusar
  async function recusar(outroId: string) {
    await api.recusarPendente(outroId)
    // Remove instantaneamente da lista sem precisar recarregar a tela
    setPendentes(prev => prev.filter(p => p.id !== outroId))
  }

  return (
    <div ref={raiz} className="relative">
      <button
        onClick={() => setAberto((a) => !a)}
        aria-label={`Notificações${pendentes.length ? ` (${pendentes.length} novas)` : ''}`}
        className="relative grid size-11 place-items-center rounded-full hover:bg-white/5"
      >
        <IconeSino width={30} height={30} />
        {pendentes.length > 0 && <span className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-white" />}
      </button>

      {aberto && (
        <div className="absolute right-0 z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-borda bg-superficie p-2 shadow-2xl">
          {pendentes.length === 0 ? (
            <p className="p-4 text-sm text-suave">Nenhuma notificação nova.</p>
          ) : (
            pendentes.map((p) => (
              <div key={p.id} className="flex flex-col gap-3 rounded-xl p-3 border-b border-borda/50 last:border-0">
                <div className="flex items-center gap-3">
                  <FotoPerfil perfil={p} tamanho="sm" />
                  <p className="flex-1 text-sm">
                    <strong>{p.nome}</strong> tem interesse em você.
                  </p>
                </div>
                
                {/* NOVOS BOTÕES: Lado a Lado */}
                <div className="flex gap-2 justify-end mt-1">
                  <button
                    onClick={() => recusar(p.id)}
                    className="rounded-full border border-borda bg-transparent px-4 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/5 transition"
                  >
                    Recusar
                  </button>
                  <button
                    onClick={() => corresponder(p)}
                    className="rounded-full bg-(--acento) px-4 py-1.5 text-xs font-semibold text-zinc-950 transition hover:brightness-110"
                  >
                    Aceitar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}