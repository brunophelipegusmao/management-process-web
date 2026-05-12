# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

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
- Standalone components — no NgModules; **do NOT set `standalone: true`** in
  decorators (it is the default since v20)
- Zone-based change detection with `provideClientHydration(withEventReplay())` —
  use `ChangeDetectionStrategy.OnPush` on **every** component
- SSR enabled via `app.routes.server.ts` — public routes use
  `RenderMode.Prerender`, private/auth routes use `RenderMode.Server`
- Angular Router: routes defined in `apps/web/src/app/app.routes.ts`
- Routing segments: `public/` (unauthenticated), `auth/login`, `private/`
  (guarded by `authGuard`); `/dashboard/users` and `/dashboard/audit`
  additionally guarded by `superadminGuard`
- Global styles in `apps/web/src/styles.css` — OKLch design tokens for
  light/dark, brand tokens `--mulim-azul` / `--mulim-ouro` registered in
  `@theme inline` as `bg-mulim-azul` / `text-mulim-ouro` Tailwind utilities
- Fonts: **Source Sans 3** (sans) + **Anonymous Pro** (mono) via Google Fonts
- Dev server on port **3000** (`ng serve`)
- Static assets served from `apps/web/public/` — referenced as absolute paths
  (e.g. `/logo.svg`)

### Angular Component Rules

- Use `input()` and `output()` functions — not `@Input()`/`@Output()` decorators
- Use `inject()` for DI — not constructor injection
- Put host bindings in the `host` object of `@Component`/`@Directive` — not
  `@HostBinding`/`@HostListener`
- Use `[class.foo]="expr"` bindings — not `[ngClass]`
- Use `[style.prop]="expr"` bindings — not `[ngStyle]`
- Use native control flow: `@if`, `@for`, `@switch` — not `*ngIf`, `*ngFor`,
  `*ngSwitch`
- Use `NgOptimizedImage` for all static images — requires absolute `ngSrc` paths
  (e.g. `ngSrc="/logo.svg"`) since no loader is configured; does not work for
  inline base64 images nor for SVGs that embed base64 data internally (use a
  regular `<img src>` for those)
- Must pass all AXE checks and WCAG AA minimums (focus management, color
  contrast, ARIA)

### Angular Architecture

**State management** uses Angular Signals via injectable stores in
`core/stores/`:

```ts
@Injectable({ providedIn: 'root' })
export class FooStore {
  private _data = signal<Foo | null>(null);
  readonly data = this._data.asReadonly();
  readonly derived = computed(() => ...);
}
```

**SSR + Auth Guard pattern**: `authGuard` returns `true` on the server (session
is not restored during SSR) and enforces authentication only in the browser
after `APP_INITIALIZER` calls `AuthService.restoreSession()`. The `Login`
component redirects to `/dashboard` if already authenticated (post-hydration).

**Role guard**: `superadminGuard` (in `core/guards/superadmin.guard.ts`)
redirects non-superadmin users away from restricted routes. Used on
`/dashboard/users` and `/dashboard/audit`.

**Theme**: `ThemeStore` (in `core/stores/theme.store.ts`) manages the light/dark
theme preference via a signal and persists it in `localStorage`.

**Shared components** (in `components/shared/`):

- `ConfirmDialog` — reusable modal for destructive-action confirmation
- `Pagination` — page navigation, used across all list views
- `Toast` — visual feedback for success/error operations

**HTTP Cache**: `httpCacheInterceptor` caches GET responses for `/clients` and
`/processes` (without search params) with a 2-minute TTL to reduce round-trips
during form navigation.

## apps/api — NestJS Backend

- **NestJS 11 + Fastify**, TypeScript (strict), Drizzle ORM, PostgreSQL
- Request flow:
  `Guard → Pipe → Controller → Service → Repository → Drizzle → PostgreSQL`
- All responses use envelope format:
  `{ data: T, meta?: { total, page, pageSize } }`
- BetterAuth handles session management; every route protected except `/health`
  and `/auth/*`
- Swagger UI at `http://localhost:3001/docs`

### API Common Layer (`src/common/`)

Global providers registered in `AppModule`:

| Provider          | Class                         | Role                            |
| ----------------- | ----------------------------- | ------------------------------- |
| `APP_PIPE`        | `ZodValidationPipe`           | Validates DTOs with Zod schemas |
| `APP_FILTER`      | `GlobalExceptionFilter`       | Unified error responses         |
| `APP_GUARD`       | `AuthGuard` → `RolesGuard`    | Session auth, then RBAC         |
| `APP_INTERCEPTOR` | `ResponseEnvelopeInterceptor` | Wraps `{ data }`                |
| `APP_INTERCEPTOR` | `AuditInterceptor`            | Writes to `audit_logs`          |

**Decorators:**

- `@Public()` — skips `AuthGuard` for a route
- `@Roles('advogado', 'paralegal')` — RBAC via `RolesGuard`
- `@CurrentUser()` — injects the BetterAuth session user into a parameter

### Validation Pattern (Zod + NestJS)

DTOs are created with `createZodDto()` from
`src/common/pipes/create-zod-dto.ts`:

```ts
export class CreateClientDto extends createZodDto(clientSchemas.create) {}
```

All Zod schemas live in `src/schema/zod/index.ts`. Two guard wrappers enforce
business rules at the schema level:

- `withWitnessGuards(schema)` — rejects any payload containing CPF, RG, CNH, or
  identity-doc fields (GATE-1)
- `withStrictUnknownFieldValidation(shape, schema)` — `.strict()` equivalent,
  rejects unknown keys

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

- `src/schema/index.ts` — Drizzle table definitions and TypeScript types (single
  source of truth for DB)
- `src/schema/zod/index.ts` — Zod validation schemas for all entities (create /
  update / filter shapes)

Domain tables: `users`, `sessions`, `accounts`, `verifications`, `clients`,
`processes`, `hearings`, `witnesses`, `deadlines`, `holidays`, `emails`,
`auditLogs`, `tasks`.

Active modules: `auth`, `clients`, `processes`, `deadlines`, `witnesses`,
`hearings`, `users`, `reports`, `tasks`, `contact`, `audit-logs`, `emails`.

**Note on `deadlines` module**: contains an extracted
`DeadlineCalculatorService` (`deadline-calculator.service.ts`) with its own spec
file for isolated testing of deadline calculation logic.

### Scheduled Jobs (`src/jobs/`)

- `DeadlinesJob` — runs daily at 7:00 AM UTC: marks overdue deadlines, sends
  preventive deadline alerts and pending-acknowledgment alerts, logs results to
  `audit_logs`
- `HolidaySyncJob` — runs 1st of month at 6:00 AM UTC: syncs national holidays
  from BrasilAPI for current + next year

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

- **GATE-1**: CPF, RG, CNH and identity documents are **never** stored — 400 if
  received
- **GATE-2**: Witness hard limit — JEC (Lei 9.099) = 4 / CPC (vara comum) = 10
- **GATE-3**: `audit_logs` is **append-only** — no UPDATE or DELETE, ever
- **GATE-4**: Witness with `replaced=true` cannot receive new deadlines — 422
- **GATE-5**: `superadmin` profile cannot be deleted via API

---

## Estado Atual da Implementação

> Mapa de tudo que existe, o que está incompleto e o que ainda não existe.

### Backend — API (`apps/api`)

| Módulo         | Endpoints                                                                                                 | Status      |
| -------------- | --------------------------------------------------------------------------------------------------------- | ----------- |
| **Auth**       | `POST /auth/sign-in/email`, `POST /auth/sign-out`, `GET /auth/get-session`                                | ✅ Completo |
| **Users**      | CRUD completo + filtros por email/perfil/ativo                                                            | ✅ Completo |
| **Clients**    | CRUD completo + filtros por nome/email/tipo                                                               | ✅ Completo |
| **Processes**  | CRUD completo + filtros por clientId/cnjNumber/status/courtType                                           | ✅ Completo |
| **Hearings**   | CRUD + `POST /:id/reschedule` + filtros por processId/tipo/status/dateRange                               | ✅ Completo |
| **Witnesses**  | CRUD + `POST /:id/replace` + `POST /:id/intimation` + `POST /:id/intimation/outcome`                      | ✅ Completo |
| **Deadlines**  | CRUD + tipos automáticos + `DeadlineCalculatorService` isolado                                            | ✅ Completo |
| **Holidays**   | CRUD + filtros por data/tipo/estado/município/fonte                                                       | ✅ Completo |
| **Tasks**      | CRUD + `PATCH /:id/status` para kanban                                                                    | ✅ Completo |
| **Contact**    | `POST /contact` com validação reCAPTCHA + envio de e-mail                                                 | ✅ Completo |
| **Reports**    | `overview`, `deadlines-by-status`, `witnesses-by-status`, `upcoming-hearings`                             | ✅ Completo |
| **Audit Logs** | `GET /audit-logs` com filtros — restrito a `superadmin`                                                   | ✅ Completo |
| **Emails**     | `GET /emails` + `GET /emails/:id` + filtros por processId/template/destinatário — restrito a `superadmin` | ✅ Completo |

### Frontend — Web (`apps/web`)

| Rota                          | Componente        | Status                                                                                                                                                           |
| ----------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ------------------- | -------------- | ---------------------------------------------------------------------------------------------------- |
| `/`                           | `Home`            | ✅ Completo                                                                                                                                                      |
| `/about`                      | `About`           | ✅ Completo                                                                                                                                                      |
| `/contact`                    | `Contact`         | ✅ Completo                                                                                                                                                      |
| `/login`                      | `Login`           | ✅ Completo — lembrar e-mail, redirect pós-sessão                                                                                                                |
| `/dashboard`                  | `Dashboard`       | ✅ Completo — KPIs, agenda da semana, status de intimações, busca global                                                                                         |
| `/dashboard/hearing-schedule` | `HearingSchedule` | ✅ Completo — calendário mensal + agenda em lista, filtro por tipo                                                                                               |
| `/dashboard/reports`          | `Reports`         | ✅ Completo — KPIs, gráficos de prazos e testemunhas                                                                                                             |
| `/dashboard/kanban`           | `Kanban`          | ✅ Completo — 3 colunas, drag-and-drop, CRUD de tarefas                                                                                                          |
| `/dashboard/consulta`         | `Consulta`        | ✅ Completo — busca por CNJ ou nome, resultados agrupados                                                                                                        |
| `/dashboard/processes`        | `ProcessList`     | ✅ Completo — lista paginada com filtros                                                                                                                         |
| `/dashboard/processes/add`    | `AddProcess`      | ✅ Completo — formulário com seleção de cliente                                                                                                                  |
| `/dashboard/processes/:id`    | `ProcessDetail`   | ✅ Completo — abas: dados gerais, audiências, testemunhas, prazos; modais: intimar, registrar resultado, substituir testemunha, reagendar audiência, criar prazo |
| `/dashboard/clients`          | `ClientList`      | ✅ Completo — lista paginada com filtros                                                                                                                         |
| `/dashboard/clients/:id`      | `ClientDetail`    | ✅ Completo                                                                                                                                                      |
| `/dashboard/hearings`         | `HearingList`     | ✅ Completo — lista paginada com filtros por processo/tipo/status                                                                                                |
| `/dashboard/hearings/add`     | `AddHearing`      | ✅ Completo — formulário com seleção de processo                                                                                                                 |
| `/dashboard/witnesses`        | `WitnessList`     | ✅ Completo — lista paginada com filtros por processo/status                                                                                                     |
| `/dashboard/witnesses/assign` | `AssignWitness`   | ✅ Completo — formulário com seleção de processo                                                                                                                 |
| `/dashboard/deadlines`        | `DeadlineList`    | ✅ Completo — lista paginada com filtros por status e processo; link "Detalhe" em cada linha                                                                     |
| `/dashboard/deadlines/:id`    | `DeadlineDetail`  | ✅ Completo — exibe dados, edição inline de data/status, cancelamento com confirmação                                                                            |
| `/dashboard/hearings`         | `HearingList`     | ✅ Completo — lista paginada com filtros por processo/tipo/status; links "Detalhe" e "Processo" em cada linha                                                    |
| `/dashboard/hearings/add`     | `AddHearing`      | ✅ Completo — formulário com seleção de processo                                                                                                                 |
| `/dashboard/hearings/:id`     | `HearingDetail`   | ✅ Completo — exibe dados, edição inline, modal de reagendamento                                                                                                 |
| `/dashboard/witnesses`        | `WitnessList`     | ✅ Completo — lista paginada com filtros por processo/status; links "Detalhe" e "Processo" em cada linha                                                         |
| `/dashboard/witnesses/assign` | `AssignWitness`   | ✅ Completo — formulário com seleção de processo                                                                                                                 |
| `/dashboard/witnesses/:id`    | `WitnessDetail`   | ✅ Completo — exibe dados, edição inline, modais: intimar, registrar resultado, substituir                                                                       |
| `/dashboard/users`            | `Users`           | ✅ Completo — CRUD com paginação, confirmação de exclusão; restrito a `superadmin`                                                                               |
| `/dashboard/audit`            | `AuditLogs`       | ✅ Completo — lista paginada com filtros; restrito a `superadmin`                                                                                                |
| `/dashboard/holidays`         | `Holidays`        | ✅ Completo — lista paginada com filtros, CRUD via modais, restrito a `superadmin`                                                                               |     | `/dashboard/emails` | `EmailHistory` | ✅ Completo — lista paginada com filtros por processo/template/destinatário, restrito a `superadmin` |

### O que está **pendente** no frontend

Todas as melhorias técnicas sugeridas foram implementadas. O projeto está
completo.

---

## Melhorias Técnicas Implementadas

- **`ProcessStore` / `ClientStore`** (`core/stores/`) — caching client-side das
  listas com TTL de 2 min; restaura estado ao voltar para a lista sem re-fetch
- **`BreadcrumbService` + `Breadcrumb`** — serviço imperativo
  (`set(crumbs[])`) + componente `<app-breadcrumb>` inserido nos detalhes de
  audiência, testemunha e prazo; crumbs definidas após o fetch do objeto
- **Módulo `emails` na API** — `GET /emails` e `GET /emails/:id`, restrito a
  `superadmin`, com filtros por `processId`, `template` e `recipient`
- **Tela `/dashboard/emails`** — lista paginada do histórico de e-mails, link
  para processo

---

## Sugestões de Continuação

Todas as melhorias técnicas e telas planejadas foram implementadas. Possíveis
próximas evoluções:

- **Dashboard de e-mails avançado**: filtros por data, estatísticas de
  resposta/acuse
- **Notificações push**: webhooks ou WebSockets para alertar sobre prazos em
  tempo real
- **Exportação**: relatórios em PDF/XLSX a partir das listas existentes
