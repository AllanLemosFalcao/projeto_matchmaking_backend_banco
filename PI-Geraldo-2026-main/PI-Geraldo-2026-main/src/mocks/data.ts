import type { Interesse, Match, Mensagem, Perfil } from '../types'

export interface BancoMock {
  perfis: Perfil[]
  interesses: Interesse[]
  matches: Match[]
  mensagens: Mensagem[]
}

const inicial: BancoMock = {
  perfis: [
    {
      id: 'i1',
      papel: 'investidor',
      nome: 'Larissa Borba',
      email: 'larissa@caisup.com',
      localizacao: 'Recife',
      tese: 'Busco founders técnicos resolvendo dores reais de MPEs e do varejo popular no Nordeste, com tração inicial comprovada.',
      segmentosInteresse: ['Fintech', 'SaaS B2B', 'E-commerce', 'Edtech'],
      estagiosPreferidos: ['Validação', 'MVP', 'Tração inicial'],
      investimentoMinimo: 100_000,
      investimentoMaximo: 600_000,
    },
    {
      id: 'i2',
      papel: 'investidor',
      nome: 'Semente Capital',
      email: 'deals@sementecap.com',
      localizacao: 'Porto Digital',
      tese: 'Fundo pre-seed focado em agro, clima e alimentação no Nordeste.',
      segmentosInteresse: ['Agtech', 'Foodtech', 'Impacto Social'],
      estagiosPreferidos: ['Ideação', 'Validação', 'MVP'],
      investimentoMinimo: 50_000,
      investimentoMaximo: 300_000,
    },
    {
      id: 'i3',
      papel: 'investidor',
      nome: 'Porto Ventures',
      email: 'contato@portoventures.vc',
      localizacao: 'Recife',
      tese: 'Investimos em SaaS e fintechs com receita recorrente e time completo.',
      segmentosInteresse: ['Fintech', 'SaaS B2B', 'Logtech'],
      estagiosPreferidos: ['Tração inicial', 'Crescimento / Scale'],
      investimentoMinimo: 500_000,
      investimentoMaximo: 3_000_000,
    },
    {
      id: 's1',
      papel: 'startup',
      nome: 'RecifeLearn',
      email: 'contato@recifelearn.com.br',
      localizacao: 'Recife',
      descricao: 'Plataforma de trilhas de capacitação técnica para jovens de escolas públicas do Recife.',
      segmento: 'Edtech',
      estagio: 'Validação',
      composicaoEquipe: '4 fundadores',
      mercado: 'Jovens 16-24 anos em escolas públicas',
      modeloNegocio: 'SaaS / Assinatura',
      valorInvestimento: 250_000,
      participacaoOferecida: 50,
    },
    {
      id: 's2',
      papel: 'startup',
      nome: 'MaréFintech',
      email: 'oi@marefintech.com',
      localizacao: 'Recife',
      descricao: 'Conta digital e crédito para pequenos comerciantes do Nordeste com atendimento via Whatsapp.',
      segmento: 'Fintech',
      estagio: 'Tração inicial',
      composicaoEquipe: '3 fundadores + 5 colaboradores',
      mercado: 'Pequenos comerciantes do Nordeste',
      modeloNegocio: 'Taxa por transação',
      valorInvestimento: 800_000,
      participacaoOferecida: 40,
    },
    {
      id: 's3',
      papel: 'startup',
      nome: 'CanaVerde',
      email: 'time@canaverde.agr.br',
      localizacao: 'Caruaru',
      descricao: 'Monitoramento de lavouras de cana com sensores de baixo custo.',
      segmento: 'Agtech',
      estagio: 'MVP',
      composicaoEquipe: '2 fundadores',
      mercado: 'Pequenos produtores de cana-de-açúcar',
      modeloNegocio: 'Hardware + assinatura',
      valorInvestimento: 300_000,
      participacaoOferecida: 20,
    },
    {
      id: 's4',
      papel: 'startup',
      nome: 'Clubasque',
      email: 'ola@clubasque.com',
      localizacao: 'Olinda',
      descricao: 'Clube de assinatura de refeições regionais preparadas por cozinheiras locais.',
      segmento: 'Foodtech',
      estagio: 'Ideação',
      composicaoEquipe: '2 fundadoras',
      mercado: 'Famílias de classe média da RMR',
      modeloNegocio: 'Assinatura mensal',
      valorInvestimento: 120_000,
      participacaoOferecida: 8,
    },
  ],
  interesses: [
    // Startups que já demonstraram interesse na Larissa
    { deId: 's2', paraId: 'i1', criadoEm: '2026-10-08T12:00:00Z' },
    { deId: 's3', paraId: 'i1', criadoEm: '2026-10-09T15:30:00Z' },
    { deId: 's1', paraId: 'i3', criadoEm: '2026-10-10T09:00:00Z' },
  ],
  matches: [],
  mensagens: [],
}

/*
 * Os dados ficam salvos no localStorage para que cadastros, interesses e
 * conversas sobrevivam ao recarregar a página durante as apresentações.
 * Para voltar ao estado inicial: localStorage.removeItem('caisup-mock-db').
 */
const CHAVE = 'caisup-mock-db'

function carregar(): BancoMock {
  try {
    const salvo = localStorage.getItem(CHAVE)
    if (salvo) return JSON.parse(salvo) as BancoMock
  } catch {
    // dados corrompidos: volta ao inicial
  }
  return structuredClone(inicial)
}

export const db = carregar()

export function salvarDb() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(db))
  } catch {
    // armazenamento cheio/bloqueado: segue só em memória
  }
}
