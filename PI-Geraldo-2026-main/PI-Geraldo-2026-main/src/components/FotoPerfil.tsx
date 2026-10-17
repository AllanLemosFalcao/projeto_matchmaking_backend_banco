import type { Perfil } from '../types'

const gradientes = [
  'from-violet-500 to-indigo-700',
  'from-rose-500 to-orange-500',
  'from-emerald-400 to-teal-700',
  'from-amber-300 to-orange-600',
  'from-sky-400 to-blue-700',
  'from-fuchsia-500 to-purple-800',
]

const tamanhos = {
  sm: 'size-10 text-sm',
  md: 'size-14 text-lg',
  lg: 'size-20 text-2xl',
  xl: 'size-36 text-5xl',
}

interface Props {
  perfil: Pick<Perfil, 'nome' | 'foto' | 'papel'>
  tamanho?: keyof typeof tamanhos
}

/** Startups aparecem com logo quadrado; investidores com foto redonda. */
export function FotoPerfil({ perfil, tamanho = 'md' }: Props) {
  const forma = perfil.papel === 'startup' ? 'rounded-2xl' : 'rounded-full'
  const classes = `${tamanhos[tamanho]} ${forma} shrink-0`

  if (perfil.foto) return <img src={perfil.foto} alt="" className={`${classes} object-cover`} />

  const iniciais = perfil.nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
  const gradiente = gradientes[[...perfil.nome].reduce((s, c) => s + c.charCodeAt(0), 0) % gradientes.length]

  return (
    <div
      className={`${classes} grid place-items-center bg-linear-to-br ${gradiente} titulo text-white`}
      aria-hidden
    >
      {iniciais}
    </div>
  )
}
