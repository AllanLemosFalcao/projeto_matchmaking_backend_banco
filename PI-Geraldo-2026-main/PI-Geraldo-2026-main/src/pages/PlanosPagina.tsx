import { CabecalhoPagina } from '../components/CabecalhoPagina'
import { Planos } from '../components/Planos'

export function PlanosPagina() {
  return (
    <>
      <CabecalhoPagina titulo="Planos" subtitulo="Comece grátis, cresça quando quiser." />
      <Planos className="bg-superficie" />
    </>
  )
}
