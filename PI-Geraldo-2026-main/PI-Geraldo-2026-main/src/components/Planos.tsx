import { Balao } from './Balao'

const planos = [
  {
    nome: 'Gratuito',
    preco: 'R$ 0',
    cor: 'text-lima',
    itens: ['Cadastro e perfil', 'Busca básica', 'Visualização de oportunidades', '3 interações'],
  },
  {
    nome: 'Premium',
    preco: 'R$ 49',
    sufixo: '/mês',
    cor: 'text-rosa',
    itens: [
      'Filtros avançados',
      'Perfil com mais visibilidade',
      'Interações ampliadas',
      'Recomendações personalizadas',
      'Métricas do perfil',
    ],
  },
]

/** Os dois balões de planos (apenas informativos por enquanto). */
export function Planos({ className = 'bg-fundo' }: { className?: string }) {
  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-16">
      {planos.map((p) => (
        <Balao key={p.nome} className={`${className} px-10 py-12 text-white sm:px-14`}>
          <p className={`titulo text-xl uppercase ${p.cor}`}>{p.nome}</p>
          <p className="titulo mt-1 text-5xl sm:text-6xl">
            {p.preco}
            {p.sufixo && <span className="ml-1 text-xl text-zinc-400">{p.sufixo}</span>}
          </p>
          <ul className="mt-6 list-disc space-y-2 pl-5 text-lg font-bold">
            {p.itens.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </Balao>
      ))}
    </div>
  )
}
