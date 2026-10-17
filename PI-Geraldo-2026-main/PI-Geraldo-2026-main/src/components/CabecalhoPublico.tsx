import { Link } from 'react-router'
import { Logo } from './Logo'

export function CabecalhoPublico() {
  return (
    <header className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-10">
      <Logo />
      <nav className="flex gap-3">
        <Link to="/login" className="rounded-full border border-borda px-5 py-2 hover:bg-white/5">
          Entrar
        </Link>
        <Link to="/cadastro" className="rounded-full bg-white px-5 py-2 text-zinc-950 hover:bg-zinc-200">
          Cadastrar
        </Link>
      </nav>
    </header>
  )
}
