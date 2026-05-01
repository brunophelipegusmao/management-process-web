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
pnpm dev:api      # NestJS only (port 3333)

# Build
pnpm build        # build all apps

# Database (API)
pnpm db:generate  # generate Drizzle migrations
pnpm db:migrate   # run migrations
pnpm db:studio    # open Drizzle Studio

# Tests (API)
pnpm test         # unit tests
```

To run within a specific app:

```bash
pnpm --filter @mgmt/web  <script>
pnpm --filter @mgmt/api  <script>
```

## apps/web — Angular Frontend

- **Angular 21**, TypeScript (strict), Tailwind CSS v4
- Standalone components — sem NgModules
- Angular Router: rotas definidas em `apps/web/src/app/app.routes.ts`
- Lazy loading por feature (public, auth, private)
- Path alias `@/*` → `apps/web/src/*`
- Estilos globais em `apps/web/src/styles.css` (tokens OKLch dark/light)
- Fonts: Literata (sans/heading) + Google Sans Code (mono) via Google Fonts
- Dev server na porta **3000** (`ng serve`)
- Build output em `apps/web/dist/`

## apps/api — NestJS Backend

- **NestJS 11 + Fastify**, TypeScript (strict), Drizzle ORM, PostgreSQL
- Request flow: `Guard → Pipe → Controller → Service → Repository → Drizzle → PostgreSQL`
- All responses use envelope format: `{ data: T, meta?: { total, page, pageSize } }`
- `src/schema/` is the single source of truth for all DB types
- BetterAuth handles session management; every route protected except `/health` and `/auth/*`
- Swagger UI at `http://localhost:3333/docs`

### API Environment Variables (apps/api/.env)

```env
DATABASE_URL=postgres://user:pass@localhost:5432/dbname
PORT=3333
EMAIL_PROVIDER=smtp        # smtp | console
EMAIL_FROM=you@domain.com
SMTP_HOST=smtp.host.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=you@domain.com
SMTP_PASS=your_password
CORS_ALLOWED_ORIGINS=http://localhost:3000
BETTER_AUTH_SECRET=your_secret
BETTER_AUTH_URL=http://localhost:3333
```

### Critical Business Rules (API)

- **GATE-1**: CPF, RG, CNH and identity documents are **never** stored — 400 if received
- **GATE-2**: Witness hard limit — JEC (Lei 9.099) = 4 / CPC (vara comum) = 10
- **GATE-3**: `audit_logs` is **append-only** — no UPDATE or DELETE, ever
- **GATE-4**: Witness with `replaced=true` cannot receive new deadlines — 422
- **GATE-5**: `superadmin` profile cannot be deleted via API
