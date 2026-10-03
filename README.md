# Aglo

Contagem automática de pessoas em fotos de multidões.

O usuário cadastra o evento, envia a foto e o Aglo estima quantas pessoas
aparecem nela. O resultado fica salvo em um relatório, com a imagem anotada,
que pode ser consultado, editado e excluído depois.

## Estrutura

| Pasta             | Serviço                                                |
| ----------------- | ------------------------------------------------------ |
| `apps/front`      | Interface web (Next.js)                                |
| `apps/backend`    | API, banco de dados e armazenamento (Express + Prisma) |
| `services/p2pnet` | Serviço de inferência do modelo (FastAPI + PyTorch)    |

## Rodando localmente

Pré-requisitos: Node.js 24 com Corepack (pnpm), Python 3.11+ e PostgreSQL.

```bash
# Serviço de inferência (porta 8001)
cd services/p2pnet
python -m venv .venv
.venv/Scripts/pip install --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt
cp .env.example .env
.venv/Scripts/python -m uvicorn app.main:app --port 8001

# Backend (porta 4000)
cd apps/backend
corepack pnpm install
corepack pnpm rebuild @prisma/engines prisma esbuild
cp .env.example .env
corepack pnpm exec prisma migrate deploy
corepack pnpm start:dev

# Front (porta 3000)
cd apps/front
corepack pnpm install
cp .env.example .env
corepack pnpm dev
```

Preencha cada `.env` a partir do `.env.example` da pasta. O backend precisa do
banco PostgreSQL, de um storage compatível com S3 e do endereço do serviço de
inferência; o front precisa do endereço do backend.

Para testar sem um S3 real, qualquer S3 local serve, por exemplo
`moto_server -p 9000`, com `AWS_ENDPOINT_URL=http://127.0.0.1:9000` e o bucket
criado antes do primeiro upload.

Faça backup do banco antes de aplicar migrations em um banco com dados.

## Deploy

Cada serviço tem seu `Dockerfile`, e a infraestrutura de destino fica
responsável por construir e publicar as imagens:

```bash
docker build -t aglo-front   --build-arg NODE_VERSION=24.14.0 --build-arg APP_ENV_FILE=envs/prd.env apps/front
docker build -t aglo-backend apps/backend
docker build -t aglo-p2pnet  services/p2pnet
```

O front lê as variáveis públicas no build, a partir do arquivo indicado em
`APP_ENV_FILE` (`apps/front/envs/dev.env`, `hml.env` ou `prd.env`). Antes do
primeiro deploy, ajuste as URLs da API nesses arquivos. O backend e o serviço de
inferência recebem a configuração por variáveis de ambiente em tempo de
execução.
