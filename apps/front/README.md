# Aglo — Frontend

Frontend Next.js do Aglo. A aplicação permite criar contagens com upload de
imagem, rodar a contagem automática de pessoas (P2Pnet) via backend e consultar
relatórios.

As telas são renderizadas no front, mas a persistência de relatórios, mídia e
processamento são feitos pelo backend Express em `apps/backend`.

## Pré-requisitos

- Node.js compatível com Next.js 15
- Backend rodando localmente, por padrão em `http://localhost:4000`

## Setup local

```bash
npm install
cp .env.example .env
npm run dev
```

Abra `http://localhost:3000`. Se a porta estiver ocupada, o Next.js escolhe a
próxima porta disponível e mostra a URL no terminal.

## Variáveis de ambiente

| Variável                   | Descrição                          |
| -------------------------- | ---------------------------------- |
| `NODE_ENV`                 | Ambiente da aplicação              |
| `BACKEND_API_BASE_URL`     | URL server-side da API do backend  |
| `NEXT_PUBLIC_API_BASE_URL` | Fallback público para a URL da API |

## Integração com o backend

O front usa rotas BFF em `src/app/api/*` que encaminham as chamadas ao backend:
`/api/contagem`, `/api/contagens` e `/api/p2pnet` são proxies finos para os
endpoints reais de reports e processamento.

A persistência principal não usa mais JSON local ou filesystem do Next.js. Dados
de relatório e mídia devem ser gravados e lidos pelo backend.

## Scripts

| Script        | Descrição                                  |
| ------------- | ------------------------------------------ |
| `npm run dev` | Inicia o servidor de desenvolvimento       |
| `npm run build` | Gera build de produção                   |
| `npm start`   | Inicia o build de produção                 |
| `npm run lint` | Executa o ESLint                          |

## Estrutura principal

- `src/app/`: rotas App Router, páginas e BFF routes.
- `src/components/`: componentes reutilizáveis de UI.
- `src/types/`: tipos compartilhados do fluxo de contagem.
