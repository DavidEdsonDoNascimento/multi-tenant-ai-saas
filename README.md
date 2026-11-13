# Catálogo IA — mini SaaS multi-tenant com agente de IA

Empresas se cadastram, gerenciam seus produtos e consultam o catálogo conversando com um agente de IA. O agente usa **tool calling real** (Groq por padrão, gratuito; OpenAI opcional) para consultar o MongoDB, sempre restrito à empresa do usuário autenticado.

> Teste técnico, não um produto comercial: o foco é arquitetura backend, isolamento multi-tenant, autorização e tool calling.

## Stack

| Camada | Tecnologias |
| --- | --- |
| API | Node.js, Express 5, TypeScript, Mongoose, Zod, JWT (`jsonwebtoken`), `bcryptjs`, SDK oficial `openai` (também usado para a Groq, via endpoint compatível) |
| Web | React 19, TypeScript, Vite, Tailwind CSS 4, Lucide, TanStack Query, React Router |
| Dados | MongoDB 7 (Docker Compose) |
| Testes | Vitest + Supertest, com **MongoDB real** |
| Repo | pnpm workspaces |

## Estrutura

```
.
├── docker-compose.yml        # MongoDB
├── .env.example              # variáveis da API
└── apps
    ├── api/src
    │   ├── config/env.ts     # validação das variáveis de ambiente (Zod)
    │   ├── middleware/       # authorize (role), validate (Zod), errorHandler
    │   ├── shared/           # AppError, TenantContext
    │   ├── modules/
    │   │   ├── auth/         # registro, login, middleware authenticate
    │   │   ├── companies/    # model + repository
    │   │   ├── users/        # model + repository
    │   │   ├── products/     # model, schemas, repository, service, routes
    │   │   └── chat/         # rotas, loop de tool calling, definição/execução da tool
    │   ├── seed/             # seed idempotente
    │   ├── app.ts / server.ts
    │   └── tests/            # testes de integração
    └── web/src
        ├── pages/            # Login, Register, Products, Chat
        ├── components/       # Layout, ProductCard, ProductForm, ui
        └── lib/              # cliente HTTP, auth, estado do chat
```

## Início rápido (~5 min)

Pré-requisitos: Node ≥ 20.19, pnpm, Docker.

```bash
pnpm install
cp .env.example apps/api/.env      # preencha GROQ_API_KEY para usar o chat
pnpm db:up                         # sobe o MongoDB e aguarda ficar saudável
pnpm seed                          # popula as 2 empresas de demonstração
pnpm dev                           # API em :4000 e Web em :5173
```

Abra <http://localhost:5173>.

### Variáveis de ambiente (`apps/api/.env`)

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/mini_saas` | Conexão com o MongoDB |
| `JWT_SECRET` | — (obrigatória, ≥ 32 chars) | Segredo de assinatura dos tokens |
| `JWT_EXPIRES_IN` | `1h` | Expiração do JWT |
| `CORS_ORIGIN` | `http://localhost:5173` | Origens permitidas (separadas por vírgula) |
| `LLM_PROVIDER` | `groq` | Provedor do agente: `groq` ou `openai` |
| `GROQ_API_KEY` | — | Chave da Groq (gratuita em <https://console.groq.com/keys>) |
| `GROQ_MODEL` | `openai/gpt-oss-120b` | Modelo Groq (precisa suportar tool calling) |
| `OPENAI_API_KEY` | — | Chave da OpenAI (só com `LLM_PROVIDER=openai`) |
| `OPENAI_MODEL` | `gpt-4o-mini` | Modelo OpenAI (precisa suportar tool calling) |

As chaves só são exigidas por `POST /chat`. Sem a chave do provedor selecionado, a API sobe normalmente e `POST /chat` responde `503 AI_NOT_CONFIGURED`, indicando a variável faltante. Nada é simulado.

### Provedor de LLM: Groq (padrão) ou OpenAI

A Groq oferece plano gratuito e uma API compatível com a Chat Completions da OpenAI (`https://api.groq.com/openai/v1`). Por isso a troca é só de configuração: o mesmo SDK `openai` é instanciado com `baseURL`, chave e modelo do provedor escolhido (`resolveLlmConfig` em `chat.service.ts`). O loop de tool calling, a tool e o escopo multi-tenant são idênticos nos dois provedores.

- **Modelo padrão `openai/gpt-oss-120b`**: modelo de produção da Groq com suporte a tool use. Os modelos `llama-3.x` constam como depreciados na documentação da Groq. `openai/gpt-oss-20b` é uma alternativa mais rápida (`GROQ_MODEL`).
- **Compatibilidade**: ao devolver a mensagem do assistente com `tool_calls`, o servidor reenvia só `role`, `content` e `tool_calls`. A Groq rejeita campos fora do padrão, e os modelos gpt-oss incluem um campo `reasoning` na resposta. Também não usamos `tool_choice: "none"`: com gpt-oss na Groq o modelo ainda tenta chamar a tool e a API responde `400 tool_use_failed`. Na rodada final, as tools simplesmente não são enviadas.
- **Plano gratuito**: há limites por minuto e por dia, definidos pela Groq por organização. Na validação, `openai/gpt-oss-120b` retornou limite de **8.000 tokens/minuto**; cada pergunta usa de ~1,5k a ~3k tokens (de 1 a 4 chamadas ao modelo). Rajadas de várias perguntas seguidas podem atingi-lo, e o chat então responde `503 AI_RATE_LIMITED` (a UI mostra a mensagem). Basta aguardar alguns segundos.
- Para usar a OpenAI: `LLM_PROVIDER=openai` e `OPENAI_API_KEY`.

### Usuários de demonstração (senha de todos: `Senha@123`)

| Empresa | Admin | User |
| --- | --- | --- |
| Empresa A - TechStore (eletrônicos) | `admin@empresa-a.com` | `user@empresa-a.com` |
| Empresa B - Casa Viva (casa e decoração) | `admin@empresa-b.com` | `user@empresa-b.com` |

Cada empresa tem 12 produtos com nomes, categorias e preços diferentes. O seed é idempotente (empresas por nome, usuários por e-mail, produtos por empresa + nome) e pode ser executado várias vezes.

### Comandos

```bash
pnpm test          # testes da API (exige o MongoDB no ar: pnpm db:up)
pnpm typecheck     # tsc em api e web
pnpm build         # build de produção de api e web
pnpm db:down       # derruba o MongoDB (os dados ficam no volume)
```

Os testes usam o banco `mini_saas_test` (configurável via `MONGODB_URI_TEST`; o nome deve terminar em `_test`, senão a suíte aborta) e **nunca tocam no banco de desenvolvimento**.

## Arquitetura e decisões

- **Módulos por responsabilidade**: `routes → (service) → repository → model`. Controllers ficam nas próprias rotas, finas, porque cada handler tem poucas linhas. `service` só existe onde há regra (auth, products, chat); `companies` e `users` expõem apenas repositories.
- **Validação com Zod** na borda (body, query, params). Campos desconhecidos são descartados, então `companyId`/`role` enviados pelo cliente nunca chegam à camada de dados.
- **Erros padronizados**: `{ error: { code, message, details? } }`. Zod → 400, `AppError` → status próprio, o restante → 500 sem vazar detalhes.
- **`bcryptjs` em vez de `bcrypt`**: implementação JS pura, sem build nativo; evita falhas de instalação (e prompts de build do pnpm 11) e atende ao objetivo de setup rápido. Em produção, o binding nativo é uma troca trivial.
- **E-mail único globalmente**: o login é só e-mail + senha, então o e-mail identifica o tenant.
- **Sem transações**: o MongoDB standalone do Compose não as suporta. O registro cria empresa e admin em sequência e, se a criação do usuário falhar, remove a empresa (compensação).
- **Preço como `Number`** (MVP). Em produção, inteiro em centavos.

## Estratégia de multi-tenancy

Modelo **banco compartilhado, coleção compartilhada, discriminador `companyId`**, com defesa em camadas:

1. **Origem confiável do tenant.** O JWT carrega só a identidade (`sub`). O middleware `authenticate` valida o token e **recarrega o usuário no banco**; `companyId` e `role` saem desse registro e formam o `TenantContext` (`req.tenant`). Claims forjadas dentro do token são ignoradas (há teste), e usuários removidos perdem acesso imediatamente.
2. **Repository exige o contexto.** Todos os métodos de `productRepository` recebem `TenantContext` como primeiro argumento e aplicam `companyId` no filtro (`find`, `findOne`, `findOneAndUpdate`, `findOneAndDelete`, `distinct`). Não existe método sem escopo. Na criação, `companyId` é aplicado **depois** do spread dos dados, e o PATCH usa `$set` apenas com campos validados (sem `companyId`).
3. **404 em vez de 403** para recurso de outro tenant: produto inexistente e produto alheio são indistinguíveis, o que não revela a existência de IDs.
4. **Cadastro público** sempre cria uma empresa nova e seu admin; `companyId` e `role` do body são descartados.
5. **Índices** compostos começando por `companyId`: `(companyId, createdAt)`, `(companyId, category)`, `(companyId, name)`, `(companyId, price)`.
6. **RBAC**: `requireRole("admin")` nas rotas de escrita; `user` só lê.

## Agente de IA e tool calling

`POST /chat` (JWT) com `{ "message": "..." }` (opcional: `history` com turnos `user`/`assistant`, já que o servidor não persiste conversas).

Fluxo implementado em `chat.service.ts`:

1. Recebe a mensagem autenticada e monta `system + histórico + user`.
2. Envia ao LLM junto com a definição da tool `search_products`.
3. Se o modelo responder com `tool_calls`, o servidor **executa a consulta real** no MongoDB.
4. Devolve o resultado como mensagem `tool` e chama o LLM novamente. São no máximo 4 rodadas; na última, as tools não são oferecidas e o modelo precisa responder com o que já consultou (evita falhas quando ele insiste em novas buscas, por exemplo sem resultados).
5. Retorna `{ reply, toolCalls }`; `toolCalls` lista as buscas feitas (a UI as exibe como prova de que o dado veio do banco).

Tool `search_products`: `search`, `category`, `minPrice`, `maxPrice`, `sort` (`newest | name_asc | price_asc | price_desc`), `limit` (≤ 20). Os argumentos passam por Zod antes da consulta; se forem inválidos, o erro é devolvido **ao modelo** para que ele corrija a chamada.

**Garantia de isolamento no agente:** a definição da tool **não tem `companyId`**; o executor recebe o `TenantContext` do servidor (vindo do JWT) e só usa os argumentos do modelo como filtros. Se o modelo enviar um `companyId` mesmo assim, o schema o descarta. A tool usa o mesmo `productRepository` do CRUD, então herda o mesmo escopo. O prompt de sistema também instrui o modelo a tratar textos de produto como dados e não como instruções (mitigação de prompt injection; a barreira real é o escopo no servidor).

Falhas do provedor são mapeadas: chave inválida → `502 AI_PROVIDER_AUTH`, rate limit → `503 AI_RATE_LIMITED`, demais → `502 AI_PROVIDER_ERROR`.

### Perguntas de exemplo

- "Quais produtos vocês têm?"
- "Quais são os produtos mais baratos?"
- "Mostre produtos com preço entre R$ 200 e R$ 1.000"
- "Tem algum notebook? Qual o mais caro?"
- "Quais categorias existem?" / "Tem sofá?" (Empresa A responde que não; Empresa B sim — isolamento visível)

## Testes

40 testes de integração com MongoDB real; apenas o provedor de LLM é substituído por um fake roteirizado (que também grava as chamadas, permitindo inspecionar o que o servidor enviou ao "modelo").

| Arquivo | Comprova |
| --- | --- |
| `products.test.ts` | Listagem isolada; GET/PATCH/DELETE de produto alheio → 404 e dado intacto; `companyId` do body ignorado; admin CRUD; user → 403 em escrita; validação; filtros; regex escapado; query não vira operador Mongo |
| `chat.test.ts` | Tool executa no Mongo e devolve só produtos do tenant; `companyId` do modelo ignorado; A e B recebem resultados distintos para a mesma busca; múltiplas rodadas; limite de loop; args inválidos; sem API key → 503 sem simulação; erros do provedor; seleção Groq/OpenAI; mensagem do assistente reenviada só com campos padrão; rodada final sem tools |
| `auth.test.ts` | Registro/login; senha com hash; `companyId`/`role` do cliente ignorados; sem empresa órfã em e-mail duplicado; token ausente/inválido/expirado/segredo errado; usuário removido; claims forjadas |
| `seed.test.ts` | Idempotência (2 empresas, 4 usuários, ≥ 10 produtos cada) e login com as credenciais documentadas |

## Validação manual sugerida

1. Login como `admin@empresa-a.com`: veja os 12 produtos da TechStore e os botões de criar/editar/excluir.
2. Crie, edite e exclua um produto; teste os filtros.
3. Saia e entre como `user@empresa-a.com`: só leitura, sem ações administrativas.
4. Entre como `admin@empresa-b.com`: catálogo totalmente diferente.
5. Com `GROQ_API_KEY` configurada, no chat pergunte "Tem algum notebook?" nas duas empresas e compare as respostas.
6. Registre uma nova empresa em `/register`: catálogo vazio, você é admin apenas dela.

## Limitações conscientes do MVP

- JWT guardado em `localStorage` (exposto a XSS) e sem refresh token/revogação além da checagem do usuário a cada request.
- Sem rate limit (login e chat), sem verificação de e-mail, sem recuperação de senha, sem gestão de usuários dentro da empresa (o `user` só existe via seed/banco).
- Busca por `regex` escapado, sem índice de texto: simples e previsível, mas não escala para catálogos grandes.
- Listagem sem paginação (limite máximo de 100 itens).
- O plano gratuito da Groq limita tokens por minuto/dia; sem retry com fila nem cota por tenant, rajadas de perguntas recebem `AI_RATE_LIMITED`.
- Chat sem streaming e sem persistência; o histórico vive no navegador e só os últimos 10 turnos vão ao modelo. Respostas em texto simples (sem renderizar Markdown).
- Sem transações no registro (compensação manual).
- Imagens dos produtos do seed vêm de `picsum.photos` (serviço externo); se ficar indisponível, o card mostra um ícone.
- Não há linter (ESLint) para evitar dependências extras; a checagem estática é feita por `tsc` em modo estrito.

## Melhorias para produção

**Escala:** paginação por cursor; índice de texto/Atlas Search; réplica do MongoDB (habilita transações); cache de leitura; cálculo de custo/limite por tenant nas chamadas de LLM.

**Segurança:** cookies `httpOnly` + refresh token rotativo; rate limit e lockout; política de senha e verificação de e-mail; auditoria de ações administrativas; secrets em cofre; considerar isolamento forte (banco por tenant) para clientes regulados; testes automáticos adicionais de varredura de queries sem escopo.

**Observabilidade:** logs estruturados com `requestId`, `companyId` e `userId`; métricas de latência e erro por rota; tracing das chamadas ao LLM (tokens, latência, ferramentas chamadas); health/readiness checando o Mongo; alertas.
