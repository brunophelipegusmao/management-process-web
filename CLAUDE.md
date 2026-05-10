# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

```
management-process-web/   ← monorepo root
├── apps/
│   ├── web/              ← Angular 21 frontend (@mgmt/web)
│   └── api/              ← NestJS + Fastify backend (@mgmt/api)
├── package.json          ← workspace root scripts
└── pnpm-workspace.yaml
```

## Commands

All commands run from the **monorepo root** using pnpm workspaces.

```bash
# Development
pnpm dev          # run web + api in parallel
pnpm dev:web      # Angular only (port 3000)
pnpm dev:api      # NestJS only (port 3001)

# Build & Lint
pnpm build        # build all apps
pnpm lint         # lint all apps

# Database (API)
pnpm db:generate  # generate Drizzle migrations
pnpm db:migrate   # run migrations
pnpm db:studio    # open Drizzle Studio

# Tests (API — Jest)
pnpm test                                             # all unit tests
pnpm --filter @mgmt/api test:watch                    # watch mode
pnpm --filter @mgmt/api test -- --testPathPattern=witnesses   # single file/module
pnpm --filter @mgmt/api test:e2e                      # end-to-end tests

# Tests (Web — Vitest)
pnpm --filter @mgmt/web test
```

To run within a specific app:

```bash
pnpm --filter @mgmt/web  <script>
pnpm --filter @mgmt/api  <script>
```

## apps/web — Angular Frontend

- **Angular 21**, TypeScript (strict), Tailwind CSS v4
- Standalone components — no NgModules; **do NOT set `standalone: true`** in decorators (it is the default since v20)
- Zone-based change detection with `provideClientHydration(withEventReplay())` — use `ChangeDetectionStrategy.OnPush` on **every** component
- SSR enabled via `app.routes.server.ts` — public routes use `RenderMode.Prerender`, private/auth routes use `RenderMode.Server`
- Angular Router: routes defined in `apps/web/src/app/app.routes.ts`
- Routing segments: `public/` (unauthenticated), `auth/login`, `private/` (guarded by `authGuard`)
- Global styles in `apps/web/src/styles.css` — OKLch design tokens for light/dark, brand tokens `--mulim-azul` / `--mulim-ouro` registered in `@theme inline` as `bg-mulim-azul` / `text-mulim-ouro` Tailwind utilities
- Fonts: **Source Sans 3** (sans) + **Anonymous Pro** (mono) via Google Fonts
- Dev server on port **3000** (`ng serve`)
- Static assets served from `apps/web/public/` — referenced as absolute paths (e.g. `/logo.svg`)

### Angular Component Rules

- Use `input()` and `output()` functions — not `@Input()`/`@Output()` decorators
- Use `inject()` for DI — not constructor injection
- Put host bindings in the `host` object of `@Component`/`@Directive` — not `@HostBinding`/`@HostListener`
- Use `[class.foo]="expr"` bindings — not `[ngClass]`
- Use `[style.prop]="expr"` bindings — not `[ngStyle]`
- Use native control flow: `@if`, `@for`, `@switch` — not `*ngIf`, `*ngFor`, `*ngSwitch`
- Use `NgOptimizedImage` for all static images — requires absolute `ngSrc` paths (e.g. `ngSrc="/logo.svg"`) since no loader is configured; does not work for inline base64 images nor for SVGs that embed base64 data internally (use a regular `<img src>` for those)
- Must pass all AXE checks and WCAG AA minimums (focus management, color contrast, ARIA)

### Angular Architecture

**State management** uses Angular Signals via injectable stores in `core/stores/`:

```ts
@Injectable({ providedIn: 'root' })
export class FooStore {
  private _data = signal<Foo | null>(null);
  readonly data = this._data.asReadonly();
  readonly derived = computed(() => ...);
}
```

**SSR + Auth Guard pattern**: `authGuard` returns `true` on the server (session is not restored during SSR) and enforces authentication only in the browser after `APP_INITIALIZER` calls `AuthService.restoreSession()`. The `Login` component redirects to `/dashboard` if already authenticated (post-hydration).

**HTTP Cache**: `httpCacheInterceptor` caches GET responses for `/clients` and `/processes` (without search params) with a 2-minute TTL to reduce round-trips during form navigation.

## apps/api — NestJS Backend

- **NestJS 11 + Fastify**, TypeScript (strict), Drizzle ORM, PostgreSQL
- Request flow: `Guard → Pipe → Controller → Service → Repository → Drizzle → PostgreSQL`
- All responses use envelope format: `{ data: T, meta?: { total, page, pageSize } }`
- BetterAuth handles session management; every route protected except `/health` and `/auth/*`
- Swagger UI at `http://localhost:3001/docs`

### API Common Layer (`src/common/`)

Global providers registered in `AppModule`:

| Provider | Class | Role |
|---|---|---|
| `APP_PIPE` | `ZodValidationPipe` | Validates DTOs with Zod schemas |
| `APP_FILTER` | `GlobalExceptionFilter` | Unified error responses |
| `APP_GUARD` | `AuthGuard` → `RolesGuard` | Session auth, then RBAC |
| `APP_INTERCEPTOR` | `ResponseEnvelopeInterceptor` | Wraps `{ data }` |
| `APP_INTERCEPTOR` | `AuditInterceptor` | Writes to `audit_logs` |

**Decorators:**
- `@Public()` — skips `AuthGuard` for a route
- `@Roles('advogado', 'paralegal')` — RBAC via `RolesGuard`
- `@CurrentUser()` — injects the BetterAuth session user into a parameter

### Validation Pattern (Zod + NestJS)

DTOs are created with `createZodDto()` from `src/common/pipes/create-zod-dto.ts`:

```ts
export class CreateClientDto extends createZodDto(clientSchemas.create) {}
```

All Zod schemas live in `src/schema/zod/index.ts`. Two guard wrappers enforce business rules at the schema level:

- `withWitnessGuards(schema)` — rejects any payload containing CPF, RG, CNH, or identity-doc fields (GATE-1)
- `withStrictUnknownFieldValidation(shape, schema)` — `.strict()` equivalent, rejects unknown keys

### Feature Module Pattern

Each domain under `src/modules/<feature>/` follows the same layout:

```
<feature>.module.ts       ← NestJS Module
<feature>.controller.ts   ← REST routes, Swagger decorators, DTOs
<feature>.service.ts      ← Business logic, throws NestJS exceptions
<feature>.repository.ts   ← Drizzle queries only, no business logic
<feature>.service.spec.ts ← Jest unit tests (service layer)
```

### Schema (`src/schema/`)

- `src/schema/index.ts` — Drizzle table definitions and TypeScript types (single source of truth for DB)
- `src/schema/zod/index.ts` — Zod validation schemas for all entities (create / update / filter shapes)

Domain tables: `users`, `sessions`, `accounts`, `verifications`, `clients`, `processes`, `hearings`, `witnesses`, `deadlines`, `holidays`, `emails`, `auditLogs`, `tasks`.

Active modules: `auth`, `clients`, `processes`, `deadlines`, `witnesses`, `hearings`, `users`, `reports`, `tasks`, `contact`.

### Scheduled Jobs (`src/jobs/`)

- `DeadlinesJob` — runs daily at 7:00 AM UTC: marks overdue deadlines, sends preventive deadline alerts and pending-acknowledgment alerts, logs results to `audit_logs`
- `HolidaySyncJob` — runs 1st of month at 6:00 AM UTC: syncs national holidays from BrasilAPI for current + next year

Both use `@nestjs/schedule` and have corresponding `.spec.ts` files.

### API Environment Variables (`apps/api/.env`)

```env
DATABASE_URL=postgres://user:pass@localhost:5432/dbname
PORT=3001
EMAIL_PROVIDER=smtp        # smtp | console
EMAIL_FROM=you@domain.com
SMTP_HOST=smtp.host.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=you@domain.com
SMTP_PASS=your_password
CORS_ALLOWED_ORIGINS=http://localhost:3000
BETTER_AUTH_SECRET=your_secret
BETTER_AUTH_URL=http://localhost:3001
BETTER_AUTH_BASE_PATH=/auth
DATABASE_POOL_MAX=10
```

### Critical Business Rules (API)

- **GATE-1**: CPF, RG, CNH and identity documents are **never** stored — 400 if received
- **GATE-2**: Witness hard limit — JEC (Lei 9.099) = 4 / CPC (vara comum) = 10
- **GATE-3**: `audit_logs` is **append-only** — no UPDATE or DELETE, ever
- **GATE-4**: Witness with `replaced=true` cannot receive new deadlines — 422
- **GATE-5**: `superadmin` profile cannot be deleted via API

---

## Estado Atual da Implementação

> Mapa de tudo que existe, o que está incompleto e o que ainda não existe.

### Backend — API (`apps/api`)

| Módulo | Endpoints | Status |
|--------|-----------|--------|
| **Auth** | `POST /auth/sign-in/email`, `POST /auth/sign-out`, `GET /auth/get-session` | ✅ Completo |
| **Users** | CRUD completo + filtros por email/perfil/ativo | ✅ Completo |
| **Clients** | CRUD completo + filtros por nome/email/tipo | ✅ Completo |
| **Processes** | CRUD completo + filtros por clientId/cnjNumber/status/courtType | ✅ Completo |
| **Hearings** | CRUD + `POST /:id/reschedule` + filtros por processId/tipo/status/dateRange | ✅ Completo |
| **Witnesses** | CRUD + `POST /:id/replace` + `POST /:id/intimation` + `POST /:id/intimation/outcome` | ✅ Completo |
| **Deadlines** | CRUD + tipos automáticos + cálculo de vencimento por tipo | ✅ Completo |
| **Holidays** | CRUD + filtros por data/tipo/estado/município/fonte | ✅ Completo |
| **Tasks** | CRUD + `PATCH /:id/status` para kanban | ✅ Completo |
| **Contact** | `POST /contact` com validação reCAPTCHA + envio de e-mail | ✅ Completo |
| **Reports** | `overview`, `deadlines-by-status`, `witnesses-by-status`, `upcoming-hearings` | ✅ Completo |
| **Emails** | Tabela `emails` existe, envio via jobs e contato | ⚠️ Sem controller/API REST exposta |
| **Audit Logs** | Tabela `audit_logs` + `AuditInterceptor` automático | ⚠️ Sem endpoint de consulta (`GET /audit-logs`) |

### Frontend — Web (`apps/web`)

| Rota | Componente | Status |
|------|-----------|--------|
| `/` | `Home` | ✅ Completo |
| `/about` | `About` | ✅ Completo |
| `/contact` | `Contact` | ✅ Completo |
| `/login` | `Login` | ✅ Completo — lembrar e-mail, redirect pós-sessão |
| `/dashboard` | `Dashboard` | ✅ Completo — KPIs, agenda da semana, status de intimações, busca global |
| `/dashboard/hearing-schedule` | `HearingSchedule` | ✅ Completo — calendário mensal + agenda em lista, filtro por tipo |
| `/dashboard/reports` | `Reports` | ✅ Completo — KPIs, gráficos de prazos e testemunhas |
| `/dashboard/kanban` | `Kanban` | ✅ Completo — 3 colunas, drag-and-drop, CRUD de tarefas |
| `/dashboard/consulta` | `Consulta` | ✅ Completo — busca por CNJ ou nome, resultados agrupados |
| `/dashboard/processes/add` | `AddProcess` | ✅ Completo — formulário com seleção de cliente |
| `/dashboard/hearings/add` | `AddHearing` | ✅ Completo — formulário com seleção de processo |
| `/dashboard/witnesses/assign` | `AssignWitness` | ✅ Completo — formulário com seleção de processo |
| `/dashboard/users` | `Users` | ❌ Placeholder — sem implementação |

### O que está **pendente** no frontend

As seguintes funcionalidades têm API pronta no backend mas **não possuem tela** no frontend:

#### Páginas de listagem (inexistentes)
- **Lista de processos** — `GET /processes` existe; não há tela `/dashboard/processes`
- **Lista de clientes** — `GET /clients` existe; não há tela `/dashboard/clients`
- **Lista de audiências** — `GET /hearings` existe; não há tela além da agenda
- **Lista de testemunhas** — `GET /witnesses` existe; não há tela `/dashboard/witnesses`
- **Lista de prazos** — `GET /deadlines` existe; não há tela `/dashboard/deadlines`
- **Lista de feriados** — `GET /holidays` existe; não há tela `/dashboard/holidays`

#### Páginas de detalhe / edição (inexistentes)
- **Detalhe e edição de processo** — `GET/PATCH /processes/:id` existe
- **Detalhe e edição de cliente** — `GET/PATCH /clients/:id` existe
- **Detalhe e edição de audiência** — `GET/PATCH /hearings/:id` + reagendamento
- **Detalhe e edição de testemunha** — `GET/PATCH /witnesses/:id` + substituição + intimação
- **Detalhe e edição de prazo** — `GET/PATCH /deadlines/:id`

#### Funcionalidades específicas (sem tela)
- **Gestão de usuários** — rota `/dashboard/users` existe mas é placeholder; CRUD completo na API
- **Intimação de testemunha** — `POST /witnesses/:id/intimation` e `/outcome` sem UI
- **Substituição de testemunha** — `POST /witnesses/:id/replace` sem UI
- **Reagendamento de audiência** — `POST /hearings/:id/reschedule` sem UI
- **Criação de prazo** — `POST /deadlines` sem UI
- **Cancelamento de prazo** — `DELETE /deadlines/:id` sem UI
- **Visualizador de logs de auditoria** — tabela preenchida automaticamente, sem tela de consulta
- **Gestão de feriados** — CRUD completo na API, sem tela

---

## Sugestões de Continuação

As prioridades abaixo seguem a ordem de valor para o usuário final (advogado/paralegal).

### Prioridade 1 — Gestão completa de processos
O processo é a entidade central do sistema. Sem uma tela de listagem e detalhe, o usuário não consegue gerenciar nada além de criar.

**Sugestão de implementação:**
- Criar `/dashboard/processes` → lista paginada com filtros (CNJ, status, tipo de vara, cliente)
- Criar `/dashboard/processes/:id` → detalhe com abas: dados gerais, audiências, testemunhas, prazos
- Adicionar ação "Editar" no detalhe (`PATCH /processes/:id`)
- Reutilizar o componente de busca já existente no `Dashboard` como ponto de entrada

### Prioridade 2 — Gestão de testemunhas (workflow completo)
A intimação de testemunhas é o fluxo principal do escritório. Hoje só é possível cadastrar; não dá para acompanhar.

**Sugestão de implementação:**
- Criar `/dashboard/witnesses` → lista com filtros de status e processo
- Criar painel de ação dentro do detalhe do processo (aba "Testemunhas"):
  - Botão "Intimar" → dispara `POST /witnesses/:id/intimation`
  - Botão "Registrar resultado" → dispara `POST /witnesses/:id/intimation/outcome`
  - Botão "Substituir" → abre formulário e dispara `POST /witnesses/:id/replace`
- Status de intimação com badge colorido (pendente, intimada, negativa)

### Prioridade 3 — Gestão de usuários
A rota `/dashboard/users` existe como placeholder. A API tem CRUD completo.

**Sugestão de implementação:**
- Tabela de usuários com nome, e-mail, perfil, status (ativo/inativo)
- Formulário de criação (perfil: advogado | paralegal | superadmin)
- Toggle de ativar/desativar usuário
- Restringir a tela ao perfil `superadmin` (usar `authStore.isSuperAdmin`)

### Prioridade 4 — Gestão de prazos
Os prazos são calculados e alertados automaticamente pelo job, mas o usuário não consegue visualizá-los ou criá-los manualmente.

**Sugestão de implementação:**
- Criar `/dashboard/deadlines` → lista de prazos com filtro por status (aberto, concluído, vencido) e processo
- Botão "Novo prazo" no contexto do processo (detalhe do processo → aba "Prazos")
- Badge de alerta no Dashboard quando houver prazos vencidos (`overview.overdueDeadlines > 0`)
- Cancelar prazo com confirmação

### Prioridade 5 — Gestão de clientes
Clientes são pré-requisito para criar processos; o escritório precisa gerenciá-los.

**Sugestão de implementação:**
- Criar `/dashboard/clients` → lista com nome, tipo (PF/PJ), e-mail
- Formulário de criação e edição
- Detalhe com processos associados

### Prioridade 6 — Consulta de audit logs
Já existe a tabela `audit_logs` preenchida automaticamente. Falta apenas expor via API e mostrar na UI.

**Sugestão de implementação (API):**
- Criar endpoint `GET /audit-logs` no `ReportsModule` ou novo `AuditModule`
- Filtros: `entityType`, `action`, `userId`, `createdAt` range
- Apenas `superadmin` pode acessar

**Sugestão de implementação (frontend):**
- Adicionar `/dashboard/audit` visível apenas para superadmin
- Tabela com paginação: data, usuário, ação, entidade, IP

### Prioridade 7 — Reagendamento de audiência na UI
O backend já tem `POST /hearings/:id/reschedule`. Falta surfaceá-lo.

**Sugestão de implementação:**
- No detalhe da audiência (dentro do detalhe do processo): botão "Reagendar"
- Modal com campo de nova data/hora
- Atualizar status para `reagendada` automaticamente

### Melhorias técnicas recomendadas

- **Stores por domínio**: criar `ProcessStore`, `WitnessStore` etc. para caching client-side entre navegações, evitando re-fetch ao voltar para a mesma lista
- **Toast/notificações**: adicionar feedback visual de sucesso/erro em operações (hoje apenas campos inline)
- **Paginação nos componentes de lista**: todos os endpoints de lista já suportam `page`/`pageSize` — o frontend precisa implementar o controle de paginação
- **Confirmação de exclusão**: modal de confirmação antes de DELETE em qualquer entidade
- **Breadcrumbs**: navegação contextual para hierarquia processo → audiência / processo → testemunha
- **Proteção de rotas por perfil**: `/dashboard/users` deve ser acessível apenas por `superadmin`; implementar guard de roles no frontend
