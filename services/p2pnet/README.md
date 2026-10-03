# Aglo — P2PNet

Serviço de inferência de IA para contagem de multidões, usado pelo
**Aglo**. Recebe uma imagem e devolve a
contagem estimada de pessoas, os pontos detectados e uma versão anotada da
imagem (com marcações sobre cada pessoa detectada).

Usa o modelo público **P2PNet** ("Rethinking Counting and Localization in
Crowds: A Purely Point-Based Framework", Tencent Youtu Research), com o
peso pré-treinado no dataset ShanghaiTech Parte A.

## Onde este serviço se encaixa

O Aglo é composto por três aplicações, cada uma em
uma pasta do monorepo, que conversam entre si por HTTP:

```
apps/front   →   apps/backend    →   services/p2pnet (este serviço)
 (Next.js)       (Node/Express)       (Python/FastAPI)
```

- O **front** nunca chama este serviço diretamente.
- O **backend** é quem chama `POST /predict` deste serviço, de forma
  síncrona, ao processar um relatório (`POST /reports/:id/process` no
  backend).
- Este serviço não tem banco de dados, não tem autenticação própria, não
  guarda histórico — é sem estado (*stateless*): recebe uma imagem, devolve
  um resultado, esquece.

## Stack

- Python 3.11+
- FastAPI (servidor HTTP)
- PyTorch (CPU) + torchvision
- Pillow (processamento/anotação de imagem)

## Rodando localmente

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/Mac

pip install -r requirements.txt
```

Coloque o peso do modelo em `weights/SHTechA.pth` (não versionado — ver
`.gitignore`). O peso oficial pode ser obtido a partir do repositório
público do modelo (ver seção "Créditos" abaixo).

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Confirme que subiu certo:

```bash
curl http://127.0.0.1:8001/health
# {"status":"ok"}
```

Documentação interativa da API (gerada automaticamente pelo FastAPI):
`http://127.0.0.1:8001/docs`.

## Variáveis de ambiente

| Variável             | Default                    | Descrição                                      |
| -------------------- | --------------------------- | ------------------------------------------------ |
| `PORT`               | `8001`                      | Porta do servidor.                                |
| `MODEL_WEIGHT_PATH`  | `./weights/SHTechA.pth`     | Caminho do peso do modelo.                        |
| `DEFAULT_THRESHOLD`  | `0.5`                       | Limiar de confiança padrão para considerar um ponto como pessoa detectada. |
| `DEVICE`             | `cpu`                       | Dispositivo de inferência (`cpu`; GPU não configurado neste ciclo). |
| `LOG_LEVEL`          | `INFO`                      | Nível de logs (`DEBUG`, `INFO`, `WARNING`, `ERROR`). |
| `P2PNET_HEARTBEAT_SECONDS` | `60`                | Intervalo do heartbeat de uso de memória no log (desativado no Windows). |
| `MAX_INFERENCE_SIDE` | `2048`                      | Lado maior usado na inferência; imagens maiores são reduzidas. |
| `INFERENCE_TILE_SIZE` | `1024`                     | Tamanho dos blocos processados pela rede (múltiplo de 128; `0` desativa). |

## Logs e diagnóstico

O serviço escreve logs estruturados no `stderr`, coletados pelo Docker. Com
`LOG_LEVEL=DEBUG` o P2PNet registra o ciclo de request, dimensões
e redimensionamento de imagem, duração da inferência, carregamento do peso e
heartbeat de memória. Conteúdo de imagens, pesos e variáveis sensíveis não são
registrados.

```bash
docker logs -f <container-do-p2pnet>
```

Exceções de aplicação passam a incluir traceback. Para encerramentos forçados
como OOM/SIGKILL, não há traceback possível; o último heartbeat e o estado de
reinício do container delimitam o momento da falha. Os logs locais têm rotação
de 20 MiB por arquivo, com cinco arquivos retidos.

Ver `.env.example`.

O lado maior usado na inferência é limitado a `2048` px (`MAX_INFERENCE_SIDE`);
imagens maiores são reduzidas e os pontos voltam em coordenadas da imagem
original. A imagem reduzida é processada em blocos de `1024` px
(`INFERENCE_TILE_SIZE`), o que limita o pico de memória a cerca de 1 megapixel
por vez. A inferência roda fora do event loop e uma de cada vez, então o
`/health` continua respondendo durante o processamento.

## API

### `POST /predict`

`multipart/form-data`:

| Campo         | Obrigatório | Descrição                                                        |
| ------------- | :---------: | -------------------------------------------------------------------- |
| `file`        | sim         | Imagem (`image/jpeg`, `image/png` ou `image/webp`).                    |
| `threshold`   | não         | Limiar de confiança (ex.: `"0.5"`). Usa o default se ausente.          |
| `weight_path` | não         | Existe por compatibilidade com o cliente do backend; **ignorado** — este serviço sempre usa o peso carregado na inicialização. |

Resposta (`200 OK`):

```json
{
  "estimatedCount": 754,
  "points": [[x1, y1], [x2, y2], "..."],
  "annotated_image_base64": "..."
}
```

`annotated_image_base64` vem sempre preenchido: a imagem original com um
ponto colorido sobre cada pessoa detectada e o total escrito no canto.

Erros: `400` (`invalid_file`) para upload ausente/inválido, `500`
(`inference_failed`) para falha na inferência.

### `GET /health`

Retorna `200 {"status": "ok"}` quando o modelo já está carregado em memória
e pronto para receber requisições, `503 {"status": "loading"}` caso
contrário.

## Estrutura do projeto

```
app/
  main.py          # cria a app FastAPI, registra rotas
  predict.py        # handler de POST /predict
  health.py          # handler de GET /health
  model_loader.py     # carrega o modelo uma única vez, na inicialização
  inference.py         # wrapper de inferência (pré-processamento, forward pass, pós-processamento)
  annotate.py            # desenha os pontos detectados sobre a imagem e codifica em base64
  settings.py               # leitura de variáveis de ambiente
vendor/p2pnet/               # código do modelo, vendorizado do repositório oficial (ver Créditos)
weights/                        # peso do modelo (não versionado)
requirements.txt
```

## Créditos

O código em `vendor/p2pnet/` é adaptado do repositório oficial
[TencentYoutuResearch/CrowdCounting-P2PNet](https://github.com/TencentYoutuResearch/CrowdCounting-P2PNet),
referente ao paper "Rethinking Counting and Localization in Crowds: A
Purely Point-Based Framework" (ICCV 2021). Ver `vendor/p2pnet/LICENSE`
para os termos de uso do modelo original.
