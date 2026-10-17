# caisUp — Front-end (PWA)

"O cais que conecta startups a investidores." Startups e investidores se encontram pela busca,
registram interesse um no outro e, quando o interesse é mútuo, viram **match** e podem conversar.

Stack: React 19 + TypeScript + Vite, React Router, Tailwind CSS v4, fonte Google Sans Flex e `vite-plugin-pwa`.
As telas de referência do Figma estão em `design/`.

## Rodando

```bash
npm install
npm run dev       # desenvolvimento (http://localhost:5173)
npm run build     # build de produção em dist/
npm run preview   # serve o build (teste a instalação do PWA aqui)
npm run lint
```

Contas de teste (qualquer senha):

| Perfil     | E-mail                     |
| ---------- | -------------------------- |
| Investidor | larissa@caisup.com         |
| Startup    | contato@recifelearn.com.br |

## Estrutura

```
src/
  components/   componentes reutilizáveis (layout, campos, balões, ícones, notificações, aviso do PWA)
  constants.ts  listas de segmentos e estágios
  contexts/     autenticação (AuthProvider + hook useAuth)
  mocks/        dados falsos usados enquanto o back-end não está pronto
  pages/        uma página por rota
  services/     api.ts — ÚNICO ponto de acesso a dados
  types/        tipos do domínio (Perfil, Interesse, Match, Mensagem…)
  utils/        formatação de moeda/datas e textos de perfil
  routes.tsx    definição das rotas
```

## Integração com o back-end

Todas as páginas falam apenas com `src/services/api.ts`. Hoje as funções leem/escrevem nos mocks,
que ficam salvos no `localStorage` do navegador (para zerar: `localStorage.removeItem('caisup-mock-db')`).

A "% aderência" mostrada nos cards é a **participação societária** que a startup oferece
(`participacaoOferecida` em `PerfilStartup`).

Para integrar:

1. Copie `.env.example` para `.env` e preencha `VITE_API_URL`.
2. Troque o corpo de cada função em `api.ts` por uma chamada ao helper `http()`, mantendo a mesma assinatura.

## PWA

- Manifest, service worker e ícones são gerados pelo `vite-plugin-pwa` (configuração em `vite.config.ts`).
- Os ícones são gerados automaticamente a partir de `public/logo.svg` — troque esse arquivo para mudar o ícone do app.
- Quando uma nova versão é publicada, o app mostra um aviso "Nova versão disponível".
