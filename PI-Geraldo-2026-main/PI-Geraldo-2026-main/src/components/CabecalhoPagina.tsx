import { Notificacoes } from './Notificacoes'

export function CabecalhoPagina({ titulo, subtitulo }: { titulo: string; subtitulo: string }) {
  return (
    <header className="mb-8 flex items-start justify-between gap-4 md:mb-14">
      <div>
        <h1 className="titulo text-4xl md:text-6xl">{titulo}</h1>
        <p className="mt-2 text-zinc-300 md:text-lg">{subtitulo}</p>
      </div>
      <div className="hidden md:block">
        <Notificacoes />
      </div>
    </header>
  )
}
