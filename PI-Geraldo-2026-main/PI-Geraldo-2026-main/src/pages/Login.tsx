import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router'
import { CabecalhoPublico } from '../components/CabecalhoPublico'
import { Botao, Campo, Cartao } from '../components/ui'
import { useAuth } from '../contexts/auth'

export function Login() {
  const { usuario, entrar } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  if (usuario) return <Navigate to="/dashboard" replace />

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await entrar(email, senha)
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-full">
      <CabecalhoPublico />
      <main className="px-5 py-12 sm:py-20">
        <Cartao className="mx-auto max-w-xl px-6 py-10 sm:px-12 sm:py-14">
          <h1 className="titulo text-5xl sm:text-6xl">Entrar</h1>
          <p className="mt-2 text-zinc-300">Bom te ver de novo! Acesse sua conta.</p>

          <form onSubmit={enviar} className="mt-10 space-y-5">
            <Campo
              label="E-mail"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Campo
              label="Senha"
              type="password"
              autoComplete="current-password"
              placeholder="Sua senha"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            {erro && <p className="text-sm text-rosa">{erro}</p>}
            <Botao type="submit" variante="branco" className="mt-4 w-full py-3.5 text-lg" disabled={carregando}>
              {carregando ? 'Entrando…' : 'Entrar'}
            </Botao>
          </form>

          <p className="mt-8 text-center text-zinc-300">
            Ainda não tem conta?{' '}
            <Link to="/cadastro" className="ml-1 font-semibold text-white hover:underline">
              Cadastre-se
            </Link>
          </p>

          {import.meta.env.DEV && (
            <p className="mt-8 rounded-xl bg-white/5 p-4 text-xs text-suave">
              Contas de teste (qualquer senha): <br />
              Investidor: larissa@caisup.com · Startup: contato@recifelearn.com.br
            </p>
          )}
        </Cartao>
      </main>
    </div>
  )
}
