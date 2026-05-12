import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { API_BASE_URL } from '../../../core/tokens/api-url.token';
import { ToastService } from '../../../core/services/toast.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { Breadcrumb } from '../../../components/shared/breadcrumb/breadcrumb';
import { ConfirmDialog } from '../../../components/shared/confirm-dialog/confirm-dialog';
import {
  type Deadline,
  type ApiResponse,
  DEADLINE_TYPE_LABELS,
  DEADLINE_STATUS_LABELS,
} from '../../../core/models/api.types';

@Component({
  selector: 'app-deadline-detail',
  imports: [ReactiveFormsModule, RouterLink, ConfirmDialog, Breadcrumb],
  templateUrl: './deadline-detail.html',
  styleUrl: './deadline-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeadlineDetail implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  readonly id = this.route.snapshot.params['id'] as string;

  readonly deadline = signal<Deadline | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  // Edit mode
  readonly editMode = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);

  // Cancel confirm
  readonly confirmCancel = signal(false);
  readonly cancelling = signal(false);

  readonly typeLabels = DEADLINE_TYPE_LABELS;
  readonly statusLabels = DEADLINE_STATUS_LABELS;

  readonly editForm = this.fb.group({
    dueDate: ['', Validators.required],
    status: ['', Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.http
      .get<ApiResponse<Deadline>>(`${this.apiUrl}/deadlines/${this.id}`, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ data }) => {
          this.deadline.set(data);
          this.loading.set(false);
          this.populateEditForm(data);
          this.breadcrumbSvc.set([
            { label: 'Processos', path: '/dashboard/processes' },
            { label: 'Processo', path: `/dashboard/processes/${data.processId}` },
            { label: 'Prazos', path: `/dashboard/processes/${data.processId}` },
            { label: this.typeLabels[data.type], path: null },
          ]);
        },
        error: () => {
          this.loading.set(false);
          this.loadError.set(true);
        },
      });
  }

  private populateEditForm(d: Deadline): void {
    this.editForm.patchValue({
      dueDate: d.dueDate.slice(0, 10),
      status: d.status,
    });
  }

  enableEdit(): void {
    this.submitError.set(null);
    this.editMode.set(true);
  }

  cancelEdit(): void {
    const d = this.deadline();
    if (d) this.populateEditForm(d);
    this.editMode.set(false);
    this.submitError.set(null);
  }

  hasError(name: string): boolean {
    const ctrl = this.editForm.get(name)!;
    return ctrl.invalid && ctrl.touched;
  }

  submitEdit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.submitError.set(null);
    const val = this.editForm.getRawValue();

    this.http
      .patch<ApiResponse<Deadline>>(
        `${this.apiUrl}/deadlines/${this.id}`,
        { dueDate: val.dueDate, status: val.status },
        { withCredentials: true },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.deadline.set(res.data);
          this.submitting.set(false);
          this.editMode.set(false);
          this.toastService.show('success', 'Prazo atualizado com sucesso');
        },
        error: () => {
          this.submitting.set(false);
          this.submitError.set('Erro ao salvar. Tente novamente.');
        },
      });
  }

  cancelDeadline(): void {
    this.cancelling.set(true);

    this.http
      .delete(`${this.apiUrl}/deadlines/${this.id}`, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cancelling.set(false);
          this.confirmCancel.set(false);
          // Reload to reflect cancelled status
          this.load();
          this.toastService.show('success', 'Prazo cancelado');
        },
        error: () => {
          this.cancelling.set(false);
          this.confirmCancel.set(false);
          this.toastService.show('error', 'Erro ao cancelar prazo.');
        },
      });
  }

  formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('pt-BR');
  }

  isOverdue(d: Deadline): boolean {
    return d.status === 'aberto' && new Date(d.dueDate) < new Date();
  }
}
