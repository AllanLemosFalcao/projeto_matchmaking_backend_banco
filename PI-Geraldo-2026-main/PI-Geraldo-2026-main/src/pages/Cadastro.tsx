import { useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import { Balao } from '../components/Balao'
import { CabecalhoPublico } from '../components/CabecalhoPublico'
import { CamposInvestidor, CamposStartup } from '../components/CamposPerfil'
import { Botao, Campo, Cartao } from '../components/ui'
import { useAuth } from '../contexts/auth'
import type { DadosCadastro, Papel } from '../types'

const vazio: Record<Papel, DadosCadastro> = {
  startup: {
    papel: 'startup',
    nome: '',
    email: '',
    senha: '',
    localizacao: '',
    descricao: '',
    segmento: 'Fintech',
    estagio: 'Ideação',
    composicaoEquipe: '',
    mercado: '',
    modeloNegocio: '',
    valorInvestimento: 0,
    participacaoOferecida: 0,
    aceiteTermos: false,
  },
  investidor: {
    papel: 'investidor',
    nome: '',
    email: '',
    senha: '',
    localizacao: '',
    tese: '',
    segmentosInteresse: [],
    estagiosPreferidos: [],
    investimentoMinimo: 0,
    investimentoMaximo: 0,
    aceiteTermos: false,
  },
}

function Progresso({ etapa }: { etapa: 1 | 2 }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-5" aria-label={`Etapa ${etapa} de 2`}>
      <span className="h-1.5 rounded-full bg-(--acento)" />
      <span className={`h-1.5 rounded-full ${etapa === 2 ? 'bg-(--acento)' : 'bg-white/15'}`} />
    </div>
  )
}

export function Cadastro() {
  const { usuario, cadastrar } = useAuth()
  const [params, setParams] = useSearchParams()
  const papelUrl = params.get('papel')
  const papel: Papel | null = papelUrl === 'startup' || papelUrl === 'investidor' ? papelUrl : null

  const [dados, setDados] = useState<DadosCadastro | null>(papel ? vazio[papel] : null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  if (usuario) return <Navigate to="/dashboard" replace />

  const escolher = (p: Papel | null) => {
    setParams(p ? { papel: p } : {})
    setDados(p ? vazio[p] : null)
  }
  const mudar = (campos: Partial<DadosCadastro>) => setDados((d) => ({ ...d, ...campos }) as DadosCadastro)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!dados) return

    if (!dados.aceiteTermos) {
      setErro('Você precisa aceitar os Termos de Uso e a Política de Privacidade (LGPD) para se cadastrar.')
      return
    }

    if (dados.papel === 'investidor' && dados.segmentosInteresse.length === 0) {
      setErro('Escolha pelo menos um segmento de interesse.')
      return
    }
    setErro('')
    setCarregando(true)
    try {
      await cadastrar(dados)
    } catch (err) {
      setErro((err as Error).message)
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-full">
      <CabecalhoPublico />
      <main className="px-5 py-12 sm:py-20" data-papel={dados?.papel ?? 'investidor'}>
        <Cartao className="mx-auto max-w-2xl px-6 py-10 sm:px-12 sm:py-14">
          <h1 className="titulo text-5xl sm:text-6xl">Criar conta</h1>

          {!dados ? (
            <>
              <p className="mt-2 text-zinc-300">Primeiro, como você quer usar o caisUp?</p>
              <Progresso etapa={1} />
              <div className="mt-10 grid gap-5 sm:grid-cols-2">
                <button type="button" onClick={() => escolher('investidor')} className="text-left">
                  <Balao className="h-full bg-rosa px-8 py-8 text-zinc-950 transition hover:brightness-110">
                    <p className="text-2xl font-bold">
                      sou <span className="titulo">INVESTIDOR</span>
                    </p>
                    <p className="mt-3">Descubra negócios alinhados ao que você procura.</p>
                  </Balao>
                </button>
                <button type="button" onClick={() => escolher('startup')} className="text-left">
                  <Balao className="h-full bg-lima px-8 py-8 text-zinc-950 transition hover:brightness-110">
                    <p className="text-2xl font-bold">
                      sou <span className="titulo">STARTUP</span>
                    </p>
                    <p className="mt-3">Encontre quem pode levar sua ideia mais longe.</p>
                  </Balao>
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-zinc-300">
                {dados.papel === 'startup'
                  ? 'Agora, conte mais sobre sua startup.'
                  : 'Agora, conte mais sobre sua tese de investimento.'}
              </p>
              <Progresso etapa={2} />

              <form onSubmit={enviar} className="mt-10 space-y-6">
                <Campo
                  label={dados.papel === 'startup' ? 'Nome da startup' : 'Nome'}
                  placeholder={dados.papel === 'startup' ? 'Ex.: MaréFintech' : 'Seu nome'}
                  required
                  value={dados.nome}
                  onChange={(e) => mudar({ nome: e.target.value })}
                />
                <Campo
                  label="E-mail"
                  type="email"
                  autoComplete="email"
                  placeholder={dados.papel === 'startup' ? 'contato@suastartup.com' : 'voce@gmail.com'}
                  required
                  value={dados.email}
                  onChange={(e) => mudar({ email: e.target.value })}
                />
                <Campo
                  label="Senha"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Crie uma senha"
                  minLength={6}
                  required
                  value={dados.senha}
                  onChange={(e) => mudar({ senha: e.target.value })}
                />

                {dados.papel === 'startup' ? (
                  <CamposStartup dados={dados} mudar={mudar} />
                ) : (
                  <CamposInvestidor dados={dados} mudar={mudar} />
                )}

                {/* ======= CHECKBOX DE ACEITE LGPD AQUI ======= */}
                <label className="flex items-start gap-3 text-sm text-zinc-300 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    required
                    checked={dados.aceiteTermos || false}
                    onChange={(e) => mudar({ aceiteTermos: e.target.checked })}
                    className="mt-1 size-4 rounded border-borda bg-zinc-900 text-(--acento) focus:ring-0 cursor-pointer"
                  />
                  <span>
                    Li e concordo com os{' '}
                    <a href="#" className="underline hover:text-white" onClick={(e) => e.preventDefault()}>
                      Termos de Uso
                    </a>{' '}
                    e a{' '}
                    <a href="#" className="underline hover:text-white" onClick={(e) => e.preventDefault()}>
                      Política de Privacidade (LGPD)
                    </a>.
                  </span>
                </label>
                {/* =========================================== */}

                {erro && <p className="text-sm text-rosa">{erro}</p>}

                {/* DIV DOS BOTÕES */}
                <div className="flex gap-4 pt-4">
                  <Botao type="button" variante="contorno" className="px-10" onClick={() => escolher(null)}>
                    Voltar
                  </Botao>
                  <Botao type="submit" className="flex-1 py-3.5 text-lg" disabled={carregando}>
                    {carregando ? 'Criando…' : 'Criar minha conta'}
                  </Botao>
                </div>
              </form>
            </>
          )}

          <p className="mt-8 text-center text-zinc-300">
            Já tem conta?
            <Link to="/login" className="ml-3 font-semibold text-white hover:underline">
              Entrar
            </Link>
          </p>
        </Cartao>
      </main>
    </div>
  )
}
