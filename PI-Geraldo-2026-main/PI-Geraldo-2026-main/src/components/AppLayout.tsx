import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../contexts/auth'
import { FotoPerfil } from './FotoPerfil'
import { IconeBusca, IconeConversas, IconeDashboard, IconePerfil, IconePlanos, IconeSair } from './icones'
import { Logo } from './Logo'
import { Notificacoes } from './Notificacoes'

const itens = [
  { to: '/dashboard', label: 'Dashboard', Icone: IconeDashboard },
  { to: '/buscar', label: 'Buscar', Icone: IconeBusca },
  { to: '/perfil', label: 'Perfil', Icone: IconePerfil },
  { to: '/conversas', label: 'Conversas', Icone: IconeConversas },
  { to: '/planos', label: 'Planos', Icone: IconePlanos },
]

export function AppLayout() {
  const { usuario, sair } = useAuth()
  if (!usuario) return null

  return (
    <div data-papel={usuario.papel} className="flex h-full">
      {/* Menu lateral (desktop) */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-white/10 px-9 py-14 md:flex">
        <Logo para="/dashboard" className="ml-3 text-[40px]" />
        <nav className="mt-14 space-y-2">
          {itens.map(({ to, label, Icone }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3.5 py-2 text-lg ${
                  isActive ? 'bg-white text-zinc-950' : 'hover:bg-white/5'
                }`
              }
            >
              <Icone />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/15 pt-5">
          <div className="flex items-center gap-3 rounded-xl border border-borda p-2.5">
            <FotoPerfil perfil={usuario} tamanho="sm" />
            <div className="min-w-0">
              <p className="truncate">{usuario.nome}</p>
              <p className="text-sm text-suave capitalize">{usuario.papel}</p>
            </div>
          </div>
          <button onClick={sair} className="mt-4 flex items-center gap-3 px-4 py-2 text-lg hover:text-zinc-300">
            <IconeSair />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior (mobile) */}
        <header
          className="flex items-center justify-between border-b border-white/10 px-5 py-3 md:hidden"
          style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
        >
          <Logo para="/dashboard" className="text-2xl" />
          <Notificacoes />
        </header>

        <main className="flex-1 overflow-y-auto px-5 py-8 md:px-16 md:py-14">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>

        {/* Navegação inferior (mobile) */}
        <nav
          className="flex border-t border-white/10 md:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {itens.map(({ to, label, Icone }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] ${
                  isActive ? 'text-(--acento)' : 'text-suave'
                }`
              }
            >
              <Icone width={20} height={20} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
