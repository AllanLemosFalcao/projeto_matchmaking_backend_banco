import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { CabecalhoPagina } from '../components/CabecalhoPagina'
import { CamposInvestidor, CamposStartup } from '../components/CamposPerfil'
import { FotoPerfil } from '../components/FotoPerfil'
import { Botao, Campo, Cartao } from '../components/ui'
import { useAuth } from '../contexts/auth'
import type { Perfil as TPerfil } from '../types'

const TAMANHO_FOTO = 400 // px — reduzida antes de salvar para não pesar no armazenamento

/** Lê a imagem escolhida e devolve uma versão quadrada reduzida em data URL. */
function redimensionar(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const lado = Math.min(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = TAMANHO_FOTO
      canvas
        .getContext('2d')!
        .drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, TAMANHO_FOTO, TAMANHO_FOTO)
      URL.revokeObjectURL(img.src)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(arquivo)
  })
}

export function Perfil() {
  const { usuario, atualizar } = useAuth()
  const [dados, setDados] = useState<TPerfil | null>(usuario)
  const [status, setStatus] = useState<'' | 'salvando' | 'salvo'>('')
  const inputFoto = useRef<HTMLInputElement>(null)

  if (!dados) return null

  const mudar = (campos: Partial<TPerfil>) => {
    setDados((d) => ({ ...d, ...campos }) as TPerfil)
    setStatus('')
  }

  async function escolherFoto(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (arquivo) mudar({ foto: await redimensionar(arquivo) })
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!dados) return
    setStatus('salvando')
    await atualizar(dados)
    setStatus('salvo')
  }

  return (
    <>
      <CabecalhoPagina titulo="Meu perfil" subtitulo="Mantenha suas informações atualizadas para melhores conexões." />

      <Cartao className="mx-auto max-w-2xl px-6 py-10 sm:px-14 sm:py-14">
        <form onSubmit={salvar} className="space-y-6">
          <div className="flex flex-wrap items-center gap-6 sm:gap-8">
            {/* No design a foto do perfil é sempre redonda, inclusive o logo da startup */}
            <div className="overflow-hidden rounded-full bg-white">
              <FotoPerfil perfil={{ ...dados, papel: 'investidor' }} tamanho="xl" />
            </div>
            <div className="space-y-3">
              <Botao type="button" variante="contorno" onClick={() => inputFoto.current?.click()}>
                Enviar nova foto
              </Botao>
              <p className="text-sm leading-relaxed text-suave">
                Recomendamos no mínimo 800×800 px.
                <br />
                Formatos aceitos: JPG ou PNG.
              </p>
              <input
                ref={inputFoto}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={escolherFoto}
              />
            </div>
          </div>

          <Campo label="Nome" required value={dados.nome} onChange={(e) => mudar({ nome: e.target.value })} />

          {dados.papel === 'startup' ? (
            <CamposStartup dados={dados} mudar={mudar} />
          ) : (
            <CamposInvestidor dados={dados} mudar={mudar} />
          )}

          <div className="flex flex-col items-center gap-3 pt-6">
            <Botao type="submit" className="w-full max-w-sm py-3.5 text-lg" disabled={status === 'salvando'}>
              {status === 'salvando' ? 'Salvando…' : 'Salvar alterações'}
            </Botao>
            {status === 'salvo' && <p className="text-sm text-(--acento)">Alterações salvas!</p>}
          </div>
        </form>
      </Cartao>
    </>
  )
}
