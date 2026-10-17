import { Link } from 'react-router'

export function NaoEncontrada() {
  return (
    <div className="grid h-full place-items-center p-6 text-center">
      <div className="space-y-3">
        <p className="titulo text-8xl text-rosa">404</p>
        <p className="text-zinc-300">Página não encontrada.</p>
        <Link to="/" className="font-semibold text-lima hover:underline">
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
