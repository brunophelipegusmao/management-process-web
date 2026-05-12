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
import {
  type Hearing,
  type ApiResponse,
  HEARING_TYPE_LABELS,
  HEARING_STATUS_LABELS,
} from '../../../core/models/api.types';

@Component({
  selector: 'app-hearing-detail',
  imports: [ReactiveFormsModule, RouterLink, Breadcrumb],
  templateUrl: './hearing-detail.html',
  styleUrl: './hearing-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HearingDetail implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  readonly id = this.route.snapshot.params['id'] as string;

  readonly hearing = signal<Hearing | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  // Edit mode
  readonly editMode = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);

  // Reagendar modal
  readonly showReagendarModal = signal(false);
  readonly reagendarSubmitting = signal(false);
  readonly reagendarError = signal<string | null>(null);

  readonly typeLabels = HEARING_TYPE_LABELS;
  readonly statusLabels = HEARING_STATUS_LABELS;

  readonly editForm = this.fb.group({
    type: ['', Validators.required],
    dateTime: ['', Validators.required],
    status: [''],
  });

  readonly reagendarForm = this.fb.group({
    dateTime: ['', Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.http
      .get<ApiResponse<Hearing>>(`${this.apiUrl}/hearings/${this.id}`, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ data }) => {
          this.hearing.set(data);
          this.loading.set(false);
          this.populateEditForm(data);
          this.breadcrumbSvc.set([
            { label: 'Processos', path: '/dashboard/processes' },
            { label: 'Processo', path: `/dashboard/processes/${data.processId}` },
            { label: 'Audiências', path: `/dashboard/processes/${data.processId}` },
            { label: this.typeLabels[data.type], path: null },
          ]);
        },
        error: () => {
          this.loading.set(false);
          this.loadError.set(true);
        },
      });
  }

  private populateEditForm(h: Hearing): void {
    this.editForm.patchValue({
      type: h.type,
      dateTime: h.dateTime.slice(0, 16),
      status: h.status,
    });
  }

  enableEdit(): void {
    this.submitError.set(null);
    this.editMode.set(true);
  }

  cancelEdit(): void {
    const h = this.hearing();
    if (h) this.populateEditForm(h);
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
      .patch<ApiResponse<Hearing>>(
        `${this.apiUrl}/hearings/${this.id}`,
        { type: val.type, dateTime: val.dateTime, status: val.status },
        { withCredentials: true },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.hearing.set(res.data);
          this.submitting.set(false);
          this.editMode.set(false);
          this.toastService.show('success', 'Audiência atualizada com sucesso');
        },
        error: () => {
          this.submitting.set(false);
          this.submitError.set('Erro ao salvar. Tente novamente.');
        },
      });
  }

  openReagendar(): void {
    this.reagendarForm.reset();
    this.reagendarError.set(null);
    this.showReagendarModal.set(true);
  }

  closeReagendar(): void {
    this.showReagendarModal.set(false);
    this.reagendarError.set(null);
    this.reagendarSubmitting.set(false);
  }

  submitReagendar(): void {
    if (this.reagendarForm.invalid) {
      this.reagendarForm.markAllAsTouched();
      return;
    }
    const val = this.reagendarForm.getRawValue();
    this.reagendarSubmitting.set(true);
    this.reagendarError.set(null);

    this.http
      .post<ApiResponse<Hearing>>(
        `${this.apiUrl}/hearings/${this.id}/reschedule`,
        { dateTime: val.dateTime },
        { withCredentials: true },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.hearing.set(res.data);
          this.closeReagendar();
          this.toastService.show('success', 'Audiência reagendada com sucesso');
        },
        error: (err) => {
          this.reagendarSubmitting.set(false);
          if (err.status === 422) {
            this.reagendarError.set('Esta audiência já foi cancelada e não pode ser reagendada.');
          } else {
            this.reagendarError.set('Erro ao reagendar. Tente novamente.');
          }
        },
      });
  }

  formatDateTime(dt: string): string {
    return new Date(dt).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('pt-BR');
  }
}
