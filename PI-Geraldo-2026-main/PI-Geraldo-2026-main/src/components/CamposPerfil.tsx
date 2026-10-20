import type { InputHTMLAttributes } from 'react'
import { ESTAGIOS, SEGMENTOS } from '../constants'
import type { Estagio, PerfilInvestidor, PerfilStartup, Segmento } from '../types'
import { formatarReais } from '../utils/formatar'
import { AreaTexto, Campo, Chips, Selecao } from './ui'

type DadosStartup = Omit<PerfilStartup, 'id' | 'email' | 'papel'>
type DadosInvestidor = Omit<PerfilInvestidor, 'id' | 'email' | 'papel'>

/** Campo de valor em reais: mostra "R$ 250.000" e guarda o número. */
function CampoMoeda({
  label,
  valor,
  onValor,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  label: string
  valor: number
  onValor: (v: number) => void
}) {
  return (
    <Campo
      label={label}
      inputMode="numeric"
      value={valor ? formatarReais(valor) : ''}
      onChange={(e) => onValor(Number(e.target.value.replace(/\D/g, '')))}
      {...props}
    />
  )
}

export function CamposStartup({
  dados,
  mudar,
}: {
  dados: DadosStartup
  mudar: (campos: Partial<DadosStartup>) => void
}) {
  return (
    <>
      <AreaTexto
        label="Descrição curta"
        placeholder="O que sua startup resolve e para quem?"
        required
        value={dados.descricao}
        onChange={(e) => mudar({ descricao: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-4">
        <Selecao
          label="Segmento"
          opcoes={SEGMENTOS}
          value={dados.segmento}
          onChange={(e) => mudar({ segmento: e.target.value as Segmento })}
        />
        <Selecao
          label="Estágio"
          opcoes={ESTAGIOS}
          value={dados.estagio}
          onChange={(e) => mudar({ estagio: e.target.value as Estagio })}
        />
      </div>
      <Campo
        label="Localização"
        placeholder="Ex.: Porto Digital"
        required
        value={dados.localizacao}
        onChange={(e) => mudar({ localizacao: e.target.value })}
      />
      <AreaTexto
        label="Composição da equipe"
        placeholder="Ex.: 3 fundadores + 2 colaboradores"
        rows={2}
        value={dados.composicaoEquipe}
        onChange={(e) => mudar({ composicaoEquipe: e.target.value })}
      />
      <Campo
        label="Mercado de atuação"
        placeholder="Quem é o seu cliente?"
        value={dados.mercado}
        onChange={(e) => mudar({ mercado: e.target.value })}
      />
      <Campo
        label="Modelo de negócio"
        placeholder="Ex.: SaaS / Assinatura"
        value={dados.modeloNegocio}
        onChange={(e) => mudar({ modeloNegocio: e.target.value })}
      />
      <div className="grid grid-cols-[1fr_auto] gap-4">
        <CampoMoeda
          label="Valor de investimento pretendido (R$)"
          placeholder="Ex.: R$ 300.000"
          required
          valor={dados.valorInvestimento}
          onValor={(v) => mudar({ valorInvestimento: v })}
        />
        <Campo
          label="Participação (%)"
          type="number"
          min={0}
          max={100}
          step={0.5}
          placeholder="Ex.: 10"
          required
          className="w-32"
          value={dados.participacaoOferecida || ''}
          onChange={(e) => mudar({ participacaoOferecida: Number(e.target.value) })}
        />
      </div>
    </>
  )
}

export function CamposInvestidor({
  dados,
  mudar,
}: {
  dados: DadosInvestidor
  mudar: (campos: Partial<DadosInvestidor>) => void
}) {
  return (
    <>
      <AreaTexto
        label="Tese de investimento"
        placeholder="O que você busca em uma startup?"
        required
        value={dados.tese || ''}
        onChange={(e) => mudar({ tese: e.target.value })}
      />
      <Chips
        label="Segmentos de interesse"
        opcoes={SEGMENTOS}
        selecionados={dados.segmentosInteresse || []} // Fallback de segurança adicionado aqui
        onChange={(v) => mudar({ segmentosInteresse: v })}
      />
      <Chips
        label="Estágios preferidos"
        opcoes={ESTAGIOS}
        selecionados={dados.estagiosPreferidos || []} // Fallback de segurança adicionado aqui
        onChange={(v) => mudar({ estagiosPreferidos: v })}
      />
      <div className="grid grid-cols-2 gap-4">
        <CampoMoeda
          label="Investimento mínimo (R$)"
          placeholder="Ex.: R$ 50.000"
          valor={dados.investimentoMinimo || 0}
          onValor={(v) => mudar({ investimentoMinimo: v })}
        />
        <CampoMoeda
          label="Investimento máximo (R$)"
          placeholder="Ex.: R$ 500.000"
          valor={dados.investimentoMaximo || 0}
          onValor={(v) => mudar({ investimentoMaximo: v })}
        />
      </div>
      <Campo
        label="Localização"
        placeholder="Ex.: Porto Digital"
        required
        value={dados.localizacao || ''}
        onChange={(e) => mudar({ localizacao: e.target.value })}
      />
    </>
  )
}
