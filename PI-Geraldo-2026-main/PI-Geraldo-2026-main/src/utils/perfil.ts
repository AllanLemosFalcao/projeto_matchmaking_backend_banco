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
    ? `Cede ${perfil.participacaoOferecida}%` 
    : `${formatarReais(perfil.investimentoMinimo)} – ${formatarReais(perfil.investimentoMaximo)}`
}

/**
 * Função utilitária futura:
 * Quando o Backend enviar a propriedade 'score' real do algoritmo de Matchmaking, 
 * podemos usar esta função para renderizar um selo de "90% Match".
 */
export function compatibilidadeVisual(score?: number) {
  if (!score) return null;
  const percentual = Math.min(score + 20, 100);
  if (percentual >= 80) return `🔥 ${percentual}% Match`;
  if (percentual >= 50) return `👍 ${percentual}% Match`;
  return `${percentual}% Match`;
}