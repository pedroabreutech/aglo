# Aglo

Contagem automática de pessoas em fotos de multidões com o modelo P2Pnet.

| Pasta             | Serviço                                  |
| ----------------- | ---------------------------------------- |
| `apps/front`      | Next.js 15 (telas e rotas BFF)           |
| `apps/backend`    | Express 5 + Prisma (API, banco, storage) |
| `services/p2pnet` | FastAPI + PyTorch (inferência P2Pnet)    |

## Contagem

O usuário cadastra o evento, envia a foto e escolhe um dos dois modos:

- **Automática (`automatic`)**: pontos detectados pelo P2Pnet mais um reforço em
  zonas densas (cada ponto com 5 ou mais vizinhos num raio de 4% do menor lado
  da imagem recebe pontos extras). Indicada para multidões muito aglomeradas.
- **Automática conservadora (`automatic_conservative`)**: apenas os pontos do
  P2Pnet. Indicada para cenas de baixa ou média densidade.

O limiar de confiança do P2Pnet (5% a 95%) é ajustável na tela de análise. O
backend calcula a contagem, gera a imagem anotada e salva tudo no relatório.

O local do evento é informado como texto. O sistema não usa Google Maps:
o mapchecking (polígonos no mapa com densidade por área), o mapa de
pré-visualização do local, o modo combinado e o índice de concordância foram
removidos. As colunas `locationLat`/`locationLng` continuam no banco, opcionais,
para preservar os dados antigos. A migration
`20261003120000_automatic_counting_only` converte os relatórios existentes:

- combinados passam a usar a variante automática que tinham e a contagem
  automática já calculada;
- relatórios só de mapchecking voltam para o status `ready`, sem contagem, para
  serem reprocessados;
- a tabela `ReportArea` e a coluna `confidenceScore` são apagadas.

Faça backup do banco antes de aplicar essa migration em um banco com dados.

## Acesso

O sistema não tem login: qualquer pessoa que acesse o front pode criar,
processar, editar e excluir relatórios, e a API do backend também é aberta.
Se o sistema for exposto na internet, restrinja o acesso na infraestrutura
(rede interna, VPN ou autenticação no proxy/ingress). A migration
`20261003150000_remove_authentication` apaga a tabela `User` e a coluna
`Report.createdBy`.

## Rodando localmente

Pré-requisitos: Node.js 24 com Corepack (pnpm), Python 3.11+ e PostgreSQL.

```bash
# P2Pnet (porta 8001 por padrão)
cd services/p2pnet
python -m venv .venv
.venv/Scripts/pip install --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt
cp .env.example .env   # ajuste PORT=8001 e MODEL_WEIGHT_PATH=./SHTechA.pth
.venv/Scripts/python -m uvicorn app.main:app --port 8001

# Backend (porta 4000)
cd apps/backend
corepack pnpm install
corepack pnpm rebuild @prisma/engines prisma esbuild
cp .env.example .env   # DATABASE_URL, credenciais S3 e P2PNET_BASE_URL
corepack pnpm exec prisma migrate deploy
corepack pnpm start:dev

# Front (porta 3000)
cd apps/front
corepack pnpm install
cp .env.example .env   # BACKEND_API_BASE_URL apontando para o backend
corepack pnpm dev
```

O backend precisa de um storage compatível com S3. Para testar sem credenciais
reais, qualquer S3 local serve, por exemplo `moto_server -p 9000`, com
`AWS_ENDPOINT_URL=http://127.0.0.1:9000` e o bucket criado antes do primeiro
upload.

## Deploy

O repositório não tem pipeline de CI/CD. Cada serviço tem seu `Dockerfile`, e a
infraestrutura de destino fica responsável por construir e publicar as imagens:

```bash
docker build -t aglo-front   --build-arg NODE_VERSION=24.14.0 --build-arg APP_ENV_FILE=envs/prd.env apps/front
docker build -t aglo-backend apps/backend
docker build -t aglo-p2pnet  services/p2pnet
```

O front lê as variáveis públicas no build, a partir do arquivo indicado em
`APP_ENV_FILE` (`apps/front/envs/dev.env`, `hml.env` ou `prd.env`). Antes do
primeiro deploy, ajuste as URLs da API nesses arquivos (hoje com endereços
`*.aglo.example.com`). O backend e o P2Pnet recebem a configuração por variáveis
de ambiente em tempo de execução; veja os `.env.example` de cada pasta.
