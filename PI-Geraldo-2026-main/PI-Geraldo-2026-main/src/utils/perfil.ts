import type { Perfil } from '../types'
import { formatarReais } from '../utils/formatar'

/** Linha secundária curta de um perfil: "Edtech - Validação" ou a faixa de investimento. */
export function subtitulo(perfil: Perfil) {
  return perfil.papel === 'startup'
    ? `${perfil.segmento} - ${perfil.estagio}`
    : perfil.segmentosInteresse.slice(0, 3).join(', ')
}

export function destaque(perfil: Perfil) {
  return perfil.papel === 'startup'
    ? `${perfil.participacaoOferecida}% aderência`
    : `${formatarReais(perfil.investimentoMinimo)} – ${formatarReais(perfil.investimentoMaximo)}`
}
