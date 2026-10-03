# Aglo — Backend

API REST em Node.js/Express do **Aglo**, responsável por integrar-se com serviços de Inteligência Artificial para realizar a contagem de pessoas em multidões.

A estrutura do projeto segue uma arquitetura modular e escalável em camadas (**Controller → Service → Repository**) utilizando **Express 5 + TypeScript + Prisma + Zod + Swagger**.

## 🏗️ Arquitetura

```
src/
├── config/          # Configurações (database, cors, env, swagger, zod)
├── controllers/     # Recebem requests e delegam para services
├── domain/
│   ├── DTOs/        # Schemas Zod de entrada/saída (validação + tipagem)
│   └── interfaces/  # Contratos (interfaces de repositories, models)
├── exceptions/      # Exceções de negócio (AlreadyExist, NotFound, etc.)
├── middleware/       # Error handler, log de requests, validação Zod
├── repositories/    # Acesso a dados via Prisma
├── routes/          # Definição de rotas e registries de Swagger
├── services/        # Regras de negócio
└── utils/           # Logger, response handler, HTTP status codes
```

### Fluxo de uma request

```
Request → Route → Middleware (log + validação) → Controller → Service → Repository → Database
```

## 🚀 Como rodar

### Pré-requisitos

- Node.js >= 22
- Docker e Docker Compose para o PostgreSQL local

### Instalação

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env
# Preencher as variáveis no .env

# Subir o PostgreSQL local
docker compose up -d postgres

# Exemplo de DATABASE_URL para o Postgres do docker-compose.yml:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aglo"

# Gerar client do Prisma
npx prisma generate

# Rodar migrations
npx prisma migrate dev

# Iniciar em desenvolvimento
npm run start:dev
```

### Variáveis de ambiente

| Variável                         | Descrição                                   |
| -------------------------------- | ------------------------------------------- |
| `PORT`                           | Porta do servidor principal                 |
| `MANAGEMENT_PORT`                | Porta do health check                       |
| `NODE_ENV`                       | Ambiente (`development`, `production`)      |
| `CORS_ALLOWED_ORIGINS`           | Origens permitidas (separadas por vírgula)  |
| `DATABASE_URL`                   | URL de conexão do PostgreSQL                |
| `POSTGRES_PORT`                  | Porta local usada pelo Docker Compose       |
| `POSTGRES_DB`                    | Nome do banco local do Docker Compose       |
| `POSTGRES_USER`                  | Usuário local do Docker Compose             |
| `POSTGRES_PASSWORD`              | Senha local do Docker Compose               |
| `AWS_ACCESS_KEY_ID`              | Access key do Object Storage Magalu/S3      |
| `AWS_SECRET_ACCESS_KEY`          | Secret key do Object Storage Magalu/S3      |
| `AWS_REGION`                     | Região do bucket Magalu Cloud               |
| `AWS_ENDPOINT_URL`               | Endpoint S3-compatível da Magalu Cloud      |
| `S3_BUCKET`                      | Nome do bucket já existente                 |
| `STORAGE_SIGNED_URL_TTL_SECONDS` | TTL das signed URLs de leitura, em segundos |
| `P2PNET_BASE_URL`                | URL base do serviço externo P2Pnet          |
| `P2PNET_TIMEOUT_MS`              | Timeout da chamada ao P2Pnet, em ms         |
| `P2PNET_DEFAULT_THRESHOLD`       | Threshold padrão enviado ao P2Pnet          |
| `P2PNET_DEFAULT_WEIGHT_PATH`     | Caminho dos pesos no serviço P2Pnet         |

### Credenciais do Magalu Cloud Object Storage

O bucket real usa Magalu Cloud Object Storage, compatível com S3. As
credenciais são fornecidas fora do repositório e devem ficar apenas no `.env`
local, nas variáveis `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY`. Não commite
credenciais reais.

## 📜 Scripts disponíveis

| Script                   | Descrição                         |
| ------------------------ | --------------------------------- |
| `npm run start:dev`      | Inicia com hot reload (tsx watch) |
| `npm run build`          | Compila TypeScript para `build/`  |
| `npm start`              | Inicia o build compilado          |
| `npm run start:prod`     | Alias para start em produção      |
| `npm run lint:check`     | Verifica erros de lint            |
| `npm run lint:fix`       | Corrige erros de lint             |
| `npm run prettier:check` | Verifica formatação               |
| `npm run prettier:fix`   | Formata o código                  |
| `npm run typecheck`      | Verifica tipos sem compilar       |

## 📚 Como criar uma nova entidade

Exemplo: criar a entidade **Product**.

### 1. Schema Prisma

```prisma
// prisma/schema.prisma
model Product {
  id    Int    @id @default(autoincrement())
  name  String
  price Float
}
```

```bash
npx prisma migrate dev --name add_product
```

### 2. DTOs (validação + tipagem)

```typescript
// src/domain/DTOs/product/InputCreateProductDTO.ts
import { z } from "zod";
import { registry } from "../../../config/zod/registry";

export const InputCreateProductDTOSchema = z.object({
  name: z.string().min(1).openapi({ description: "Nome do produto" }),
  price: z.number().positive().openapi({ description: "Preço do produto" }),
});

export type InputCreateProductDTO = z.infer<typeof InputCreateProductDTOSchema>;
registry.register("InputCreateProductDTO", InputCreateProductDTOSchema);
```

### 3. Interface do Repository

```typescript
// src/domain/interfaces/repository/IProductRepository.ts
import { InputCreateProductDTO } from "../../DTOs/product/InputCreateProductDTO";

export interface IProductRepository {
  create(input: InputCreateProductDTO): Promise<boolean>;
}
```

### 4. Repository (acesso a dados)

```typescript
// src/repositories/product.repository.ts
import { prisma } from "../config/database/prisma";
import { InputCreateProductDTO } from "../domain/DTOs/product/InputCreateProductDTO";
import { IProductRepository } from "../domain/interfaces/repository/IProductRepository";

export class ProductRepository implements IProductRepository {
  public async create(input: InputCreateProductDTO): Promise<boolean> {
    await prisma.product.create({ data: input });
    return true;
  }
}
```

### 5. Service (regra de negócio)

```typescript
// src/services/product/productCreate.service.ts
import { InputCreateProductDTO } from "../../domain/DTOs/product/InputCreateProductDTO";
import { IProductRepository } from "../../domain/interfaces/repository/IProductRepository";
import { ProductRepository } from "../../repositories/product.repository";

export class ProductCreateService {
  constructor(
    private productRepository: IProductRepository = new ProductRepository(),
  ) {}

  public async run(input: InputCreateProductDTO): Promise<boolean> {
    await this.productRepository.create(input);
    return true;
  }
}
```

### 6. Controller

```typescript
// src/controllers/product.controller.ts
import { Request, Response } from "express";
import { ProductCreateService } from "../services/product/productCreate.service";
import { ResponseHandler } from "../utils/responseHandler";
import { HttpStatus } from "../utils/httpStatus";
import { InputCreateProductDTO } from "../domain/DTOs/product/InputCreateProductDTO";

export class ProductController {
  private productCreateService = new ProductCreateService();

  public async save(
    req: Request<object, object, InputCreateProductDTO>,
    res: Response,
  ) {
    const response = await this.productCreateService.run(req.body);
    ResponseHandler.success(
      res,
      response,
      HttpStatus.CREATED,
      "Product created!",
    );
  }
}
```

### 7. Rotas e Registry do Swagger

#### Rota

```typescript
// src/routes/product/product.routes.ts
import { Request, Response, Router } from "express";
import { validate } from "../../middleware/validation";
import { InputCreateProductDTOSchema } from "../../domain/DTOs/product/InputCreateProductDTO";
import { ProductController } from "../../controllers/product.controller";
import { logRequest } from "../../middleware/log";

const productRoutes = Router();
const productController = new ProductController();

productRoutes.post(
  "/",
  logRequest("ProductCreateService"),
  validate(InputCreateProductDTOSchema),
  (req: Request, res: Response) => productController.save(req, res),
);

export default productRoutes;
```

#### Registry (Documentação OpenAPI)

```typescript
// src/routes/product/product.registry.ts
import { registry } from "../../config/zod/registry";
import { ApiResponseSchema } from "../../domain/DTOs/common/ApiResponse";
import { InputCreateProductDTOSchema } from "../../domain/DTOs/product/InputCreateProductDTO";
import { OutputCreateProductDTOSchema } from "../../domain/DTOs/product/OutputCreateProductDTO";

const V1_PREFIX = "/api/v1/products";

const CreateProductApiResponse = ApiResponseSchema(
  OutputCreateProductDTOSchema,
);

registry.register("CreateProductResponse", CreateProductApiResponse);

registry.registerPath({
  method: "post",
  path: V1_PREFIX,
  summary: "Create new product",
  tags: ["Products"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: InputCreateProductDTOSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Product created successfully",
      content: {
        "application/json": {
          schema: CreateProductApiResponse,
        },
      },
    },
  },
});
```

### 8. Registrar a rota e o Swagger

#### Registrar a Rota

```typescript
// src/routes/index.ts
import productRoutes from "./product/product.routes";

routes.use(`${V1_PREFIX}/products`, productRoutes);
```

#### Registrar no Swagger (Carregamento das definições)

```typescript
// src/config/swagger.ts
import "../routes/product/product.registry";
```

## 🐳 Docker

### Banco local

```bash
docker compose up -d postgres
docker compose ps
```

O serviço usa a imagem `postgres:16`, volume nomeado e porta configurável por
`POSTGRES_PORT` no `.env`.

### Aplicação

```bash
docker build -t aglo-backend .
docker run -p 3000:3000 -p 3001:3001 --env-file .env aglo-backend
```

## 📖 Swagger

Após iniciar o servidor, acesse: `http://localhost:{PORT}/api-docs`
