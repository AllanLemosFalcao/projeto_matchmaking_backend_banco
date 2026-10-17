import { Link, Navigate } from 'react-router'
import { Balao } from '../components/Balao'
import { CabecalhoPublico } from '../components/CabecalhoPublico'
import { Onda } from '../components/Onda'
import { Planos } from '../components/Planos'
import { useAuth } from '../contexts/auth'

function Ilustracao() {
  return (
    <svg viewBox="0 0 580 520" className="w-full max-w-md" aria-hidden>
      <circle cx="175" cy="57" r="57" fill="var(--color-rosa)" />
      <rect x="0" y="110" width="364" height="48" rx="10" fill="var(--color-lima)" />
      <rect x="28" y="150" width="32" height="170" fill="var(--color-lima)" />
      <rect x="165" y="150" width="32" height="170" fill="var(--color-lima)" />
      <rect x="300" y="150" width="32" height="170" fill="var(--color-lima)" />
      <circle cx="398" cy="258" r="52" fill="var(--color-lima)" />
      <rect x="220" y="306" width="354" height="48" rx="10" fill="var(--color-rosa)" />
      <rect x="250" y="346" width="32" height="170" fill="var(--color-rosa)" />
      <rect x="380" y="346" width="32" height="170" fill="var(--color-rosa)" />
      <rect x="512" y="346" width="32" height="170" fill="var(--color-rosa)" />
    </svg>
  )
}

export function Landing() {
  const { usuario } = useAuth()
  if (usuario) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-full overflow-x-hidden">
      <CabecalhoPublico />

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pt-16 pb-24 sm:px-10 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <h1 className="titulo text-5xl leading-[1.05] sm:text-7xl">
            O cais que <br />
            <span className="sm:whitespace-nowrap">
              conecta <span className="text-lima">STARTUPS</span>
            </span>{' '}
            <br className="hidden sm:block" />a <span className="text-rosa">INVESTIDORES</span>
          </h1>
          <p className="mt-12 max-w-lg text-lg text-suave sm:mt-24">
            Encontre investidores, mentores e conexões estratégicas para transformar sua startup em negócio.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Link to="/cadastro?papel=investidor" className="transition hover:-translate-y-1">
              <Balao className="h-full bg-rosa px-9 py-8 text-zinc-950">
                <p className="text-2xl font-bold">
                  sou <span className="titulo">INVESTIDOR</span>
                </p>
                <p className="mt-3">Descubra negócios alinhados ao que você procura.</p>
              </Balao>
            </Link>
            <Link to="/cadastro?papel=startup" className="transition hover:-translate-y-1">
              <Balao className="h-full bg-lima px-9 py-8 text-zinc-950">
                <p className="text-2xl font-bold">
                  sou <span className="titulo">STARTUP</span>
                </p>
                <p className="mt-3">Encontre quem pode levar sua ideia mais longe.</p>
              </Balao>
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center gap-16 lg:items-end">
          <Ilustracao />
          <p className="titulo max-w-sm text-xl text-suave uppercase">
            Um ponto de encontro para quem está construindo o futuro.
          </p>
        </div>
      </section>

      <Onda className="h-12 text-white sm:h-20" />
      <section className="bg-white px-5 pt-12 pb-24 text-zinc-900 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="titulo text-3xl uppercase sm:text-4xl">
            Comece grátis, cresça <br /> quando quiser
          </h2>
          <div className="mt-14">
            <Planos />
          </div>
        </div>
      </section>
    </div>
  )
}
