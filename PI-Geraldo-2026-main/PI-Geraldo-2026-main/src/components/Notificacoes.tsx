import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/auth'
import * as api from '../services/api'
import type { Perfil } from '../types'
import { FotoPerfil } from './FotoPerfil'
import { IconeSino } from './icones'

/** Sino com os interesses recebidos que ainda não foram correspondidos. */
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
    const match = await api.registrarInteresse(usuario.id, outro.id)
    setAberto(false)
    if (match) navigate(`/conversas/${match.id}`)
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
              <div key={p.id} className="flex items-center gap-3 rounded-xl p-3">
                <FotoPerfil perfil={p} tamanho="sm" />
                <p className="flex-1 text-sm">
                  <strong>{p.nome}</strong> registrou interesse em você.
                </p>
                <button
                  onClick={() => corresponder(p)}
                  className="rounded-full bg-(--acento) px-3 py-1.5 text-xs font-semibold text-zinc-950"
                >
                  Aceitar
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
