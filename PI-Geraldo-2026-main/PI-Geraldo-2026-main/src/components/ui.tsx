import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

const variantes = {
  /** Cor de destaque do perfil logado (rosa ou lima) */
  acento: 'bg-(--acento) text-zinc-950 hover:bg-(--acento-hover)',
  rosa: 'bg-rosa text-white hover:bg-rosa-escuro',
  branco: 'bg-white text-zinc-950 hover:bg-zinc-200',
  contorno: 'border border-borda text-white hover:bg-white/5',
}

export function Botao({
  variante = 'acento',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: keyof typeof variantes }) {
  return (
    <button
      className={`rounded-full px-5 py-2.5 font-medium whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-50 ${variantes[variante]} ${className}`}
      {...props}
    />
  )
}

const campoClasses =
  'w-full rounded-lg border border-borda bg-transparent px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-(--acento)'

function Rotulo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-[15px] font-medium">{label}</span>
      {children}
    </label>
  )
}

export function Campo({
  label,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <Rotulo label={label}>
      <input className={`${campoClasses} ${className}`} {...props} />
    </Rotulo>
  )
}

export function AreaTexto({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <Rotulo label={label}>
      <textarea className={`${campoClasses} resize-none`} rows={3} {...props} />
    </Rotulo>
  )
}

export function Selecao({
  label,
  opcoes,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; opcoes: readonly string[] }) {
  return (
    <Rotulo label={label}>
      <select className={`${campoClasses} appearance-none bg-fundo`} {...props}>
        {opcoes.map((o) => (
          <option key={o}className="bg-zinc-900 text-white">{o}
          </option>
        ))}
      </select>
    </Rotulo>
  )
}
/** Grupo de chips de seleção múltipla (segmentos, estágios…) */
export function Chips<T extends string>({
  label,
  opcoes,
  selecionados,
  onChange,
}: {
  label: string
  opcoes: readonly T[]
  selecionados: T[]
  onChange: (valores: T[]) => void
}) {
  const alternar = (o: T) =>
    onChange(selecionados.includes(o) ? selecionados.filter((s) => s !== o) : [...selecionados, o])

  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 text-[15px] font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2.5">
        {opcoes.map((o) => {
          const ativo = selecionados.includes(o)
          return (
            <button
              key={o}
              type="button"
              aria-pressed={ativo}
              onClick={() => alternar(o)}
              className={`rounded-full border px-5 py-2 transition ${
                ativo ? 'border-(--acento) bg-(--acento) text-zinc-950' : 'border-borda hover:bg-white/5'
              }`}
            >
              {o}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-borda px-3.5 py-1 text-sm text-zinc-300">{children}</span>
}

export function Selo({ children }: { children: ReactNode }) {
  return (
    <span className="px-3 py-1 rounded-full bg-white/10 text-white text-sm font-medium border border-white/20 shadow-lg whitespace-nowrap">
      {children}
    </span>
  )
}

export function Cartao({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-3xl border-2 border-borda/70 ${className}`}>{children}</div>
}
