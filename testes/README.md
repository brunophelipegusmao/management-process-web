# /testes — Suíte de Testes Unitários

Testes unitários organizados fora das apps para manter o código de produção
limpo.

```
testes/
├── api/                          ← Testes da API NestJS (Jest + ts-jest)
│   ├── jest.config.js
│   ├── jest-setup.js
│   ├── tsconfig.json
│   └── modules/
│       ├── audit-logs/audit-logs.service.spec.ts
│       ├── contact/contact.service.spec.ts
│       └── tasks/tasks.service.spec.ts
└── web/                          ← Testes do Angular (Vitest)
    ├── vitest.config.ts
    ├── tsconfig.json
    ├── setup.ts
    └── core/
        ├── guards/
        │   ├── auth.guard.spec.ts
        │   └── superadmin.guard.spec.ts
        ├── interceptors/
        │   └── http-cache.interceptor.spec.ts
        ├── services/
        │   ├── auth.service.spec.ts
        │   └── toast.service.spec.ts
        └── stores/
            └── auth.store.spec.ts
```

---

## Rodando os testes da API

Os testes da API usam **Jest + ts-jest** e precisam ser executados a partir de
`apps/api/` para que o resolvedor de módulos encontre o `node_modules` correto.

```bash
# Na raiz do monorepo:
pnpm --filter @mgmt/api exec jest --config ../../testes/api/jest.config.js

# Ou com watch mode:
pnpm --filter @mgmt/api exec jest --config ../../testes/api/jest.config.js --watch

# Ou entrando na pasta da API:
cd apps/api
./node_modules/.bin/jest --config ../../testes/api/jest.config.js
```

### O que é testado (API)

| Arquivo de spec                         | Serviço            | Cobertura                                                                                                           |
| --------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `tasks/tasks.service.spec.ts`           | `TasksService`     | findAll, findById (not found), create (defaults, overrides), update (not found, null return), updateStatus, remove  |
| `audit-logs/audit-logs.service.spec.ts` | `AuditLogsService` | paginação padrão, paginação customizada, envelope `{ items, meta }`, filtros (userId, processId, actionType, datas) |
| `contact/contact.service.spec.ts`       | `ContactService`   | envio de e-mail, formatação do assunto `[Site]`, tratamento de telefone ausente, falha no reCAPTCHA                 |

---

## Rodando os testes do Web (Angular)

Os testes do Angular usam **Vitest** e precisam ser executados a partir de
`apps/web/` para que o resolvedor de módulos encontre os pacotes Angular.

```bash
# Na raiz do monorepo:
pnpm --filter @mgmt/web exec vitest run --config ../../testes/web/vitest.config.ts

# Com watch mode:
pnpm --filter @mgmt/web exec vitest --config ../../testes/web/vitest.config.ts

# Ou entrando na pasta da web:
cd apps/web
./node_modules/.bin/vitest run --config ../../testes/web/vitest.config.ts
```

### O que é testado (Web)

| Arquivo de spec                               | Classe / função        | Cobertura                                                                                               |
| --------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------- |
| `stores/auth.store.spec.ts`                   | `AuthStore`            | estado inicial, setUser, isAuthenticated, isSuperAdmin por role                                         |
| `services/toast.service.spec.ts`              | `ToastService`         | toasts iniciais, show, dismiss, auto-dismiss com fake timers                                            |
| `services/auth.service.spec.ts`               | `AuthService`          | signIn (HTTP + store), signOut (HTTP + store, falha), getSession (user/null/erro), restoreSession       |
| `guards/auth.guard.spec.ts`                   | `authGuard`            | SSR retorna true, autenticado retorna true, não autenticado redireciona com returnUrl                   |
| `guards/superadmin.guard.spec.ts`             | `superadminGuard`      | SSR retorna true, superadmin passa, advogado/paralegal/anon redirecionam para /dashboard                |
| `interceptors/http-cache.interceptor.spec.ts` | `httpCacheInterceptor` | POST não cacheado, /clients e /processes cacheados, paths não cacheáveis, params de busca ignoram cache |

---

## Testes existentes nas apps (não duplicados aqui)

Os seguintes serviços já têm specs dentro de `apps/api/src/` e continuam sendo
executados pelo `pnpm test` padrão:

- `clients.service`, `processes.service`, `hearings.service`
- `witnesses.service`, `witnesses.schema`
- `deadlines.service`, `deadline-calculator.service`
- `holidays.service`, `reports.service`, `users.service`
- `email.service`, `deadlines.job`, `holiday-sync.job`
- `app.controller`
