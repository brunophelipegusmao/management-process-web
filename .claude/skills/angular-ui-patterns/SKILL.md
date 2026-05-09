---
name: padrões angulares-ui
description: "Modernos almofadas de UI Angular para estados de carga, manipulação de erros e exibição de dados. Use ao construir componentes de UI, manipuladores dados async ou gerenciar dados de componentes."
risk: seguro
source: self
date_added: "2026-02-27"
---

# Pádraos de IU angulares

## Principais

1. ** Nunca mostrar UI velha** - Carregando estados apenas quando realnente carregar
2. ** Sempre erros de superficie** Os usuários devem saber quando algo falha
3. ** Atualizações otimistas** - Faça a UI se sente instantânea
4. ** Divulgação progressiva** - Use `@defer` para mostrar o conteúdo como disponível
5. **Degradação grata** Os dados são melhores do que nenhum dado

---

## Carregando almofadas de estado

### A Regra de Ouro

**Mostrar indicador de carga SOMENTE quando não há dados para exibir.**

```typescript
@Component({
  template: `
    @if (error()) {
      <app-error-state [error]="error()" (retry)="load()" />
    } @else if (loading() && !items().length) {
      <app-skeleton-list />
    } @else if (!items().length) {
      <app-empty-state message="No items found" />
    } @else {
      <app-item-list [items]="items()" />
    }
  `,
})
export class ItemListComponent {
  private store = inject(ItemStore);

  items = this.store.items;
  loading = this.store.loading;
  error = this.store.error;
}
```

### Alvore de decisão do Estado de transporte

```
Is there an error?
  → Yes: Show error state with retry option
  → No: Continue

Is it loading AND we have no data?
  → Yes: Show loading indicator (spinner/skeleton)
  → No: Continue

Do we have data?
  → Yes, with items: Show the data
  → Yes, but empty: Show empty state
  → No: Show loading (fallback)
```

### Esqueleto vs Spinner

Usar o Esqueleto Quanto Usar o Spinner Quanto
| -------------------- | --------------------- |
□ Forma de conteúdo desconhecida
Lista/dispositivos de cartas
□ Carregamento inicial da página
□ placeholders de conteúdo

---

## Pádraos de fluxo de controle

### @ if/@ other para renderização condicional

```html
@if (user(); as user) {
<span>Welcome, {{ user.name }}</span>
} @else if (loading()) {
<app-spinner size="small" />
} @else {
<a routerLink="/login">Sign In</a>
}
```

### @ for com Faixa

```html
@for (item of items(); track item.id) {
<app-item-card [item]="item" (delete)="remove(item.id)" />
} @empty {
<app-empty-state
  icon="inbox"
  message="No items yet"
  actionLabel="Create Item"
  (action)="create()"
/>
}
```

### @defer para Carregamento Progressivo

```html
<!-- Critical content loads immediately -->
<app-header />
<app-hero-section />

<!-- Non-critical content deferred -->
@defer (on viewport) {
<app-comments [postId]="postId()" />
} @placeholder {
<div class="h-32 bg-gray-100 animate-pulse"></div>
} @loading (minimum 200ms) {
<app-spinner />
} @error {
<app-error-state message="Failed to load comments" />
}
```

---

## Erro ao manusear almofadas

### Erro ao lidar com Hierarquia

```
1. Inline error (field-level) → Form validation errors
2. Toast notification → Recoverable errors, user can retry
3. Error banner → Page-level errors, data still partially usable
4. Full error screen → Unrecoverable, needs user action
```

### Mostrar Sempre Erros

** CRÍTICA: Nunca engula erros silenciosamente.**

```typescript
// CORRECT - Error always surfaced to user
@Component({...})
export class CreateItemComponent {
  private store = inject(ItemStore);
  private toast = inject(ToastService);

  async create(data: CreateItemDto) {
    try {
      await this.store.create(data);
      this.toast.success('Item created successfully');
      this.router.navigate(['/items']);
    } catch (error) {
      console.error('createItem failed:', error);
      this.toast.error('Failed to create item. Please try again.');
    }
  }
}

// WRONG - Error silently caught
async create(data: CreateItemDto) {
  try {
    await this.store.create(data);
  } catch (error) {
    console.error(error); // User sees nothing!
  }
}
```

### Erro Padrão do Componente do Estado

```typescript
@Component({
  selector: "app-error-state",
  standalone: true,
  imports: [NgOptimizedImage],
  template: `
    <div class="error-state">
      <img ngSrc="/assets/error-icon.svg" width="64" height="64" alt="" />
      <h3>{{ title() }}</h3>
      <p>{{ message() }}</p>
      @if (retry.observed) {
        <button (click)="retry.emit()" class="btn-primary">Try Again</button>
      }
    </div>
  `,
})
export class ErrorStateComponent {
  title = input("Something went wrong");
  message = input("An unexpected error occurred");
  retry = output<void>();
}
```

---

## Pádras de estado do botão

### Botão Carregando Estado

```html
<button
  (click)="handleSubmit()"
  [disabled]="isSubmitting() || !form.valid"
  class="btn-primary"
>
  @if (isSubmitting()) {
  <app-spinner size="small" class="mr-2" />
  Saving... } @else { Save Changes }
</button>
```

### Durante Desabilitar como operações

**Critical: Desativar sempre gatilhos durante operações assync.**

```typescript
// CORRECT - Button disabled while loading
@Component({
  template: `
    <button
      [disabled]="saving()"
      (click)="save()"
    >
      @if (saving()) {
        <app-spinner size="sm" /> Saving...
      } @else {
        Save
      }
    </button>
  `
})
export class SaveButtonComponent {
  saving = signal(false);

  async save() {
    this.saving.set(true);
    try {
      await this.service.save();
    } finally {
      this.saving.set(false);
    }
  }
}

// WRONG - User can click multiple times
<button (click)="save()">
  {{ saving() ? 'Saving...' : 'Save' }}
</button>
```

---

## Estados Vazios

### Requisitos do Estado Vazio

Cada lista/colecção DEVE ter um estado vazio:

```html
@for (item of items(); track item.id) {
<app-item-card [item]="item" />
} @empty {
<app-empty-state
  icon="folder-open"
  title="No items yet"
  description="Create your first item to get started"
  actionLabel="Create Item"
  (action)="openCreateDialog()"
/>
}
```

### Estados vazios contextuais

```typescript
@Component({
  selector: "app-empty-state",
  template: `
    <div class="empty-state">
      <span class="icon" [class]="icon()"></span>
      <h3>{{ title() }}</h3>
      <p>{{ description() }}</p>
      @if (actionLabel()) {
        <button (click)="action.emit()" class="btn-primary">
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  icon = input("inbox");
  title = input.required<string>();
  description = input("");
  actionLabel = input<string | null>(null);
  action = output<void>();
}
```

---

## Padrões de Forma

### Formulário com Carga e Validação

```typescript
@Component({
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="form-field">
        <label for="name">Name</label>
        <input
          id="name"
          formControlName="name"
          [class.error]="isFieldInvalid('name')"
        />
        @if (isFieldInvalid("name")) {
          <span class="error-text">
            {{ getFieldError("name") }}
          </span>
        }
      </div>

      <div class="form-field">
        <label for="email">Email</label>
        <input id="email" type="email" formControlName="email" />
        @if (isFieldInvalid("email")) {
          <span class="error-text">
            {{ getFieldError("email") }}
          </span>
        }
      </div>

      <button type="submit" [disabled]="form.invalid || submitting()">
        @if (submitting()) {
          <app-spinner size="sm" /> Submitting...
        } @else {
          Submit
        }
      </button>
    </form>
  `,
})
export class UserFormComponent {
  private fb = inject(FormBuilder);

  submitting = signal(false);

  form = this.fb.group({
    name: ["", [Validators.required, Validators.minLength(2)]],
    email: ["", [Validators.required, Validators.email]],
  });

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return control ? control.invalid && control.touched : false;
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (control?.hasError("required")) return "This field is required";
    if (control?.hasError("email")) return "Invalid email format";
    if (control?.hasError("minlength")) return "Too short";
    return "";
  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.submitting.set(true);
    try {
      await this.service.submit(this.form.value);
      this.toast.success("Submitted successfully");
    } catch {
      this.toast.error("Submission failed");
    } finally {
      this.submitting.set(false);
    }
  }
}
```

---

## Pádras de Janela/Modal

### Janela de Confirmação

```typescript
// dialog.service.ts
@Injectable({ providedIn: 'root' })
export class DialogService {
  private dialog = inject(Dialog); // CDK Dialog or custom

  async confirm(options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
  }): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: options,
    });

    return await firstValueFrom(dialogRef.closed) ?? false;
  }
}

// Usage
async deleteItem(item: Item) {
  const confirmed = await this.dialog.confirm({
    title: 'Delete Item',
    message: `Are you sure you want to delete "${item.name}"?`,
    confirmText: 'Delete',
  });

  if (confirmed) {
    await this.store.delete(item.id);
  }
}
```

---

## Anti-Patterns

### Estados de transporte

```typescript
// WRONG - Spinner when data exists (causes flash on refetch)
@if (loading()) {
  <app-spinner />
}

// CORRECT - Only show loading without data
@if (loading() && !items().length) {
  <app-spinner />
}
```

### Tratamento de Erros

```typescript
// WRONG - Error swallowed
try {
  await this.service.save();
} catch (e) {
  console.log(e); // User has no idea!
}

// CORRECT - Error surfaced
try {
  await this.service.save();
} catch (e) {
  console.error("Save failed:", e);
  this.toast.error("Failed to save. Please try again.");
}
```

### Estados de botões

```html
<!-- WRONG - Button not disabled during submission -->
<button (click)="submit()">Submit</button>

<!-- CORRECT - Disabled and shows loading -->
<button (click)="submit()" [disabled]="loading()">
  @if (loading()) {
  <app-spinner size="sm" />
  } Submit
</button>
```

---

## Lista de Verificação do Estado da UI

Antes de completar qualquer componente UI:

### Estados da IU

- [ ] Estado de erro manipulado e revelado ao usuário
- [ ] Estado de transporte descoberto apenas quando não existem dados
- [ ] Estado vazio fornecido para as coleções (`@empty`@@ block)
- [ ] Botões desativados durante as operações de assincronização
- [ ] Botões mostram indicador de carga quando apropriado

### & Mutações de Dados

- [ ] Todas as operações assync têm tratamento de erros
- [ ] Todas as ações do usuário têm feedback (toast/visual)
- [ ] Atualizações otimistas voltam ao fracasso

### acessibilidade

- [ ] Carregando estados anunciados para os leitores de tela
- [ ] Mensagens de erros ligados aos campos de formulário
- [ ] Gerenciamento de foco após mudanças de estado

---

## Integração com outras competências

- ** Gestão do estado angular**: Usar o armamento de sinos para o estado
- **angular**: Aplicar páginas modernas (sinais, @defer)
- ** padrões de teste**: Teste todos os estados de UI

## Como Usar
Esta disponibilidade é aplicável para executar o fluxo de trabalho ou ações descritas na visão geral.

## Limitações
- Use esta habilidade apenas quando a tarefa corresponder claramente ao escopo descrito acima.
- Não trate a informação como um substituto para validação, teste ou revisão de especialistas específicos do ambiente.
- Pare e peça esclarecimentos se falam entradas, licenças, limites de segurança ou critérios de sucesso.
