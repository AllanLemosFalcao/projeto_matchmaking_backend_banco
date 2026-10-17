import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/** Avisa quando há nova versão do app ou quando ele já funciona offline. */
export function AtualizacaoPWA() {
  const {
    needRefresh: [precisaAtualizar, setPrecisaAtualizar],
    offlineReady: [prontoOffline, setProntoOffline],
    updateServiceWorker,
  } = useRegisterSW()

  // O aviso de "pronto offline" é só informativo: some sozinho
  useEffect(() => {
    if (!prontoOffline) return
    const t = setTimeout(() => setProntoOffline(false), 4000)
    return () => clearTimeout(t)
  }, [prontoOffline, setProntoOffline])

  if (!precisaAtualizar && !prontoOffline) return null

  const fechar = () => {
    setPrecisaAtualizar(false)
    setProntoOffline(false)
  }

  return (
    <div
      className="fixed inset-x-4 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-xl border border-borda bg-superficie p-4 text-sm text-white shadow-lg"
      style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}
    >
      <p className="flex-1">
        {precisaAtualizar ? 'Nova versão disponível.' : 'App pronto para uso offline.'}
      </p>
      {precisaAtualizar && (
        <button className="font-semibold text-lima" onClick={() => updateServiceWorker()}>
          Atualizar
        </button>
      )}
      <button className="text-suave" onClick={fechar} aria-label="Fechar">
        ✕
      </button>
    </div>
  )
}
