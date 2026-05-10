import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';

import { API_BASE_URL } from '../../core/tokens/api-url.token';
import { Pagination } from '../../components/shared/pagination/pagination';
import { ConfirmDialog } from '../../components/shared/confirm-dialog/confirm-dialog';
import { ToastService } from '../../core/services/toast.service';
import {
  type User,
  type ApiListResponse,
  type ApiResponse,
  USER_PROFILE_LABELS,
} from '../../core/models/api.types';

@Component({
  selector: 'app-users',
  imports: [ReactiveFormsModule, Pagination, ConfirmDialog],
  templateUrl: './users.html',
  styleUrl: './users.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Users implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly editingUser = signal<User | null>(null);
  readonly showCreateForm = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly confirmDeleteId = signal<string | null>(null);

  readonly profileLabels = USER_PROFILE_LABELS;

  readonly filterForm = this.fb.group({
    email: [''],
    profile: [''],
    active: [''],
  });

  readonly createForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    profile: ['advogado', Validators.required],
    active: [true],
  });

  readonly editForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    profile: ['advogado', Validators.required],
    active: [true],
  });

  readonly isEmpty = computed(() => !this.loading() && this.users().length === 0);
  readonly showForm = computed(() => this.showCreateForm() || this.editingUser() !== null);

  ngOnInit(): void {
    this.loadUsers();

    this.filterForm.valueChanges
      .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page.set(1);
        this.loadUsers();
      });
  }

  loadUsers(): void {
    this.loading.set(true);
    const { email, profile, active } = this.filterForm.value;
    const params: Record<string, string> = {
      page: String(this.page()),
      pageSize: String(this.pageSize()),
    };
    if (email) params['email'] = email;
    if (profile) params['profile'] = profile;
    if (active !== '') params['active'] = active as string;

    this.http
      .get<ApiListResponse<User>>(`${this.apiUrl}/users`, { params, withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.users.set(res.data);
          this.total.set(res.meta.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPageChange(p: number): void {
    this.page.set(p);
    this.loadUsers();
  }

  openCreate(): void {
    this.editingUser.set(null);
    this.createForm.reset({ profile: 'advogado', active: true });
    this.submitError.set(null);
    this.showCreateForm.set(true);
  }

  openEdit(user: User): void {
    this.showCreateForm.set(false);
    this.submitError.set(null);
    this.editForm.patchValue({
      name: user.name,
      email: user.email,
      profile: user.profile,
      active: user.active,
    });
    this.editingUser.set(user);
  }

  closeForm(): void {
    this.showCreateForm.set(false);
    this.editingUser.set(null);
    this.submitError.set(null);
  }

  hasError(form: ReturnType<FormBuilder['group']>, name: string): boolean {
    const ctrl = form.get(name)!;
    return ctrl.invalid && ctrl.touched;
  }

  submitCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.submitError.set(null);
    this.http
      .post<ApiResponse<User>>(`${this.apiUrl}/users`, this.createForm.getRawValue(), { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeForm();
          this.loadUsers();
          this.toastService.show('success', 'Usuário criado com sucesso');
        },
        error: (err) => {
          this.submitting.set(false);
          if (err.status === 409) {
            this.submitError.set('E-mail já cadastrado.');
          } else {
            this.submitError.set('Erro ao criar usuário.');
          }
        },
      });
  }

  submitEdit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const user = this.editingUser();
    if (!user) return;

    this.submitting.set(true);
    this.submitError.set(null);
    this.http
      .patch<ApiResponse<User>>(`${this.apiUrl}/users/${user.id}`, this.editForm.getRawValue(), { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeForm();
          this.loadUsers();
          this.toastService.show('success', 'Usuário atualizado com sucesso');
        },
        error: (err) => {
          this.submitting.set(false);
          if (err.status === 409) {
            this.submitError.set('E-mail já cadastrado.');
          } else if (err.status === 422) {
            this.submitError.set('Superadmin não pode ser modificado via API.');
          } else {
            this.submitError.set('Erro ao atualizar usuário.');
          }
        },
      });
  }

  toggleActive(user: User): void {
    this.http
      .patch(`${this.apiUrl}/users/${user.id}`, { active: !user.active }, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadUsers();
          this.toastService.show('success', user.active ? 'Usuário desativado' : 'Usuário ativado');
        },
        error: (err) => {
          if (err.status === 422) {
            this.toastService.show('error', 'Superadmin não pode ser modificado.');
          } else {
            this.toastService.show('error', 'Erro ao alterar status.');
          }
        },
      });
  }

  deleteUser(): void {
    const id = this.confirmDeleteId();
    if (!id) return;
    this.http
      .delete(`${this.apiUrl}/users/${id}`, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.confirmDeleteId.set(null);
          this.loadUsers();
          this.toastService.show('success', 'Usuário excluído');
        },
        error: (err) => {
          this.confirmDeleteId.set(null);
          if (err.status === 422) {
            this.toastService.show('error', 'Superadmin não pode ser excluído.');
          } else {
            this.toastService.show('error', 'Erro ao excluir usuário.');
          }
        },
      });
  }
}
