import type { Perfil } from '../types'
import { formatarReais } from '../utils/formatar'

/** Linha secundária curta de um perfil: "Edtech - Validação" ou a faixa de investimento. */
export function subtitulo(perfil: Perfil) {
  return perfil.papel === 'startup'
    ? `${perfil.segmento} - ${perfil.estagio}`
    : perfil.segmentosInteresse.slice(0, 3).join(', ')
}

/**
 * O Destaque visual do card. 
 * Para Startups, mostra a fatia da empresa oferecida (Equity).
 * Para Investidores, mostra a faixa de capital que aportam.
 */
export function destaque(perfil: Perfil) {
  return perfil.papel === 'startup'
    ? `${perfil.participacaoOferecida}% de Equity` 
    : `${formatarReais(perfil.investimentoMinimo)} – ${formatarReais(perfil.investimentoMaximo)}`
}

/**
 * Renderiza o selo de compatibilidade (Match) baseado no score que vem do Backend.
 */
export function compatibilidadeVisual(score?: number) {
  // Ajuste: Verifica se é estritamente undefined ou null, para não ocultar quando for 0
  if (score === undefined || score === null) return null;
  
  // Adiciona um valor base para evitar que apareça 0% (sensação ruim no UX)
  const percentual = Math.min(score + 30, 100);
  
  if (percentual >= 80) return `🔥 ${percentual}%  aderência`;
  if (percentual >= 50) return `👍 ${percentual}%  aderência`;
  return `${percentual}% aderência`;
}