import type { CSSProperties, ReactNode } from 'react'

/*
 * Cartão com os "recortes" triangulares do design (canto superior direito e
 * inferior esquerdo). O clip-path só remove os triângulos; os cantos
 * arredondados continuam vindo do border-radius.
 */
const recorte: CSSProperties = {
  clipPath: `polygon(
    0 0,
    calc(100% - 92px) 0, calc(100% - 62px) 22px, calc(100% - 60px) 0,
    100% 0, 100% 100%,
    76px 100%, 74px calc(100% - 26px), 46px 100%,
    0 100%
  )`,
}

export function Balao({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`rounded-[28px] ${className}`} style={recorte}>
      {children}
    </div>
  )
}
