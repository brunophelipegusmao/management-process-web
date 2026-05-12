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
  type Witness,
  type ApiResponse,
  WITNESS_STATUS_LABELS,
} from '../../../core/models/api.types';

type ModalId = 'intimar' | 'resultado' | 'substituir' | null;

@Component({
  selector: 'app-witness-detail',
  imports: [ReactiveFormsModule, RouterLink, Breadcrumb],
  templateUrl: './witness-detail.html',
  styleUrl: './witness-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WitnessDetail implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  readonly id = this.route.snapshot.params['id'] as string;

  readonly witness = signal<Witness | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  // Edit mode
  readonly editMode = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);

  // Modal
  readonly activeModal = signal<ModalId>(null);
  readonly modalSubmitting = signal(false);
  readonly modalError = signal<string | null>(null);

  readonly statusLabels = WITNESS_STATUS_LABELS;

  readonly editForm = this.fb.group({
    fullName: ['', Validators.required],
    address: [null as string | null],
    residenceComarca: [null as string | null],
    maritalStatus: [null as string | null],
    profession: [null as string | null],
    phone: [null as string | null],
    notes: [null as string | null],
    side: ['reu', Validators.required],
  });

  readonly intimarForm = this.fb.group({
    method: ['', Validators.required],
    hearingDate: [null as string | null],
    sentAt: [null as string | null],
  });

  readonly resultadoForm = this.fb.group({
    outcome: ['', Validators.required],
    hearingDate: [null as string | null],
    occurredAt: [null as string | null],
  });

  readonly substituirForm = this.fb.group({
    fullName: ['', Validators.required],
    address: [''],
    residenceComarca: [''],
    maritalStatus: [''],
    profession: [''],
    phone: [''],
    notes: [''],
    side: ['reu'],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.http
      .get<ApiResponse<Witness>>(`${this.apiUrl}/witnesses/${this.id}`, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ data }) => {
          this.witness.set(data);
          this.loading.set(false);
          this.populateEditForm(data);
          this.breadcrumbSvc.set([
            { label: 'Processos', path: '/dashboard/processes' },
            { label: 'Processo', path: `/dashboard/processes/${data.processId}` },
            { label: 'Testemunhas', path: `/dashboard/processes/${data.processId}` },
            { label: data.fullName, path: null },
          ]);
        },
        error: () => {
          this.loading.set(false);
          this.loadError.set(true);
        },
      });
  }

  private populateEditForm(w: Witness): void {
    this.editForm.patchValue({
      fullName: w.fullName,
      address: w.address,
      residenceComarca: w.residenceComarca,
      maritalStatus: w.maritalStatus,
      profession: w.profession,
      phone: w.phone,
      notes: w.notes,
      side: w.side,
    });
  }

  enableEdit(): void {
    this.submitError.set(null);
    this.editMode.set(true);
  }

  cancelEdit(): void {
    const w = this.witness();
    if (w) this.populateEditForm(w);
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
    const payload: Record<string, unknown> = { fullName: val.fullName, side: val.side };
    if (val.address) payload['address'] = val.address;
    if (val.residenceComarca) payload['residenceComarca'] = val.residenceComarca;
    if (val.maritalStatus) payload['maritalStatus'] = val.maritalStatus;
    if (val.profession) payload['profession'] = val.profession;
    if (val.phone) payload['phone'] = val.phone;
    if (val.notes) payload['notes'] = val.notes;

    this.http
      .patch<ApiResponse<Witness>>(`${this.apiUrl}/witnesses/${this.id}`, payload, {
        withCredentials: true,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.witness.set(res.data);
          this.submitting.set(false);
          this.editMode.set(false);
          this.toastService.show('success', 'Testemunha atualizada com sucesso');
        },
        error: () => {
          this.submitting.set(false);
          this.submitError.set('Erro ao salvar. Tente novamente.');
        },
      });
  }

  // --- Modals ---

  openModal(modal: NonNullable<ModalId>): void {
    this.activeModal.set(modal);
    this.modalError.set(null);
    this.intimarForm.reset({ method: '', hearingDate: null, sentAt: null });
    this.resultadoForm.reset({ outcome: '', hearingDate: null, occurredAt: null });
    this.substituirForm.reset({ side: 'reu' });
  }

  closeModal(): void {
    this.activeModal.set(null);
    this.modalError.set(null);
    this.modalSubmitting.set(false);
  }

  submitIntimation(): void {
    if (this.intimarForm.invalid) {
      this.intimarForm.markAllAsTouched();
      return;
    }
    const val = this.intimarForm.getRawValue();
    const payload: Record<string, unknown> = { method: val.method };
    if (val.hearingDate) payload['hearingDate'] = val.hearingDate;
    if (val.sentAt) payload['sentAt'] = val.sentAt;

    this.modalSubmitting.set(true);
    this.http
      .post(`${this.apiUrl}/witnesses/${this.id}/intimation`, payload, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reloadWitness();
          this.closeModal();
          this.toastService.show('success', 'Intimação registrada com sucesso');
        },
        error: () => {
          this.modalSubmitting.set(false);
          this.modalError.set('Erro ao registrar intimação.');
        },
      });
  }

  submitOutcome(): void {
    if (this.resultadoForm.invalid) {
      this.resultadoForm.markAllAsTouched();
      return;
    }
    const val = this.resultadoForm.getRawValue();
    const payload: Record<string, unknown> = { outcome: val.outcome };
    if (val.hearingDate) payload['hearingDate'] = val.hearingDate;
    if (val.occurredAt) payload['occurredAt'] = val.occurredAt;

    this.modalSubmitting.set(true);
    this.http
      .post(`${this.apiUrl}/witnesses/${this.id}/intimation/outcome`, payload, {
        withCredentials: true,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reloadWitness();
          this.closeModal();
          this.toastService.show('success', 'Resultado registrado com sucesso');
        },
        error: () => {
          this.modalSubmitting.set(false);
          this.modalError.set('Erro ao registrar resultado.');
        },
      });
  }

  submitSubstituir(): void {
    if (this.substituirForm.invalid) {
      this.substituirForm.markAllAsTouched();
      return;
    }
    const val = this.substituirForm.getRawValue();
    const payload: Record<string, unknown> = { fullName: val.fullName, side: val.side };
    if (val.address) payload['address'] = val.address;
    if (val.residenceComarca) payload['residenceComarca'] = val.residenceComarca;
    if (val.maritalStatus) payload['maritalStatus'] = val.maritalStatus;
    if (val.profession) payload['profession'] = val.profession;
    if (val.phone) payload['phone'] = val.phone;
    if (val.notes) payload['notes'] = val.notes;

    this.modalSubmitting.set(true);
    this.http
      .post(`${this.apiUrl}/witnesses/${this.id}/replace`, payload, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reloadWitness();
          this.closeModal();
          this.toastService.show('success', 'Testemunha substituída com sucesso');
        },
        error: (err) => {
          this.modalSubmitting.set(false);
          if (err.status === 422) {
            this.modalError.set('Testemunha já substituída — não é possível substituir novamente.');
          } else {
            this.modalError.set('Erro ao substituir testemunha.');
          }
        },
      });
  }

  private reloadWitness(): void {
    this.http
      .get<ApiResponse<Witness>>(`${this.apiUrl}/witnesses/${this.id}`, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: ({ data }) => this.witness.set(data) });
  }

  formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('pt-BR');
  }
}
