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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

import { API_BASE_URL } from '../../../core/tokens/api-url.token';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialog } from '../../../components/shared/confirm-dialog/confirm-dialog';
import {
  type Process,
  type Hearing,
  type Witness,
  type Deadline,
  type ApiResponse,
  type ApiListResponse,
  PROCESS_STATUS_LABELS,
  COURT_TYPE_LABELS,
  CLIENT_SIDE_LABELS,
  WITNESS_STATUS_LABELS,
  HEARING_TYPE_LABELS,
  HEARING_STATUS_LABELS,
  DEADLINE_TYPE_LABELS,
  DEADLINE_STATUS_LABELS,
} from '../../../core/models/api.types';

type TabId = 'dados' | 'audiencias' | 'testemunhas' | 'prazos';
type ModalId = 'intimar' | 'resultado' | 'substituir' | 'reagendar' | 'criar-prazo' | null;

@Component({
  selector: 'app-process-detail',
  imports: [ReactiveFormsModule, RouterLink, ConfirmDialog],
  templateUrl: './process-detail.html',
  styleUrl: './process-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcessDetail implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  readonly id = this.route.snapshot.params['id'] as string;

  // State
  readonly process = signal<Process | null>(null);
  readonly hearings = signal<Hearing[]>([]);
  readonly witnesses = signal<Witness[]>([]);
  readonly deadlines = signal<Deadline[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  // Tab
  readonly activeTab = signal<TabId>('dados');

  // Edit mode
  readonly editMode = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);

  // Modal
  readonly activeModal = signal<ModalId>(null);
  readonly modalTargetId = signal<string | null>(null);
  readonly modalSubmitting = signal(false);
  readonly modalError = signal<string | null>(null);

  // Confirm cancel deadline
  readonly confirmCancelDeadlineId = signal<string | null>(null);

  // Labels
  readonly statusLabels = PROCESS_STATUS_LABELS;
  readonly courtTypeLabels = COURT_TYPE_LABELS;
  readonly clientSideLabels = CLIENT_SIDE_LABELS;
  readonly witnessStatusLabels = WITNESS_STATUS_LABELS;
  readonly hearingTypeLabels = HEARING_TYPE_LABELS;
  readonly hearingStatusLabels = HEARING_STATUS_LABELS;
  readonly deadlineTypeLabels = DEADLINE_TYPE_LABELS;
  readonly deadlineStatusLabels = DEADLINE_STATUS_LABELS;

  // Computed counts for tabs
  readonly hearingCount = computed(() => this.hearings().length);
  readonly witnessCount = computed(() => this.witnesses().length);
  readonly deadlineCount = computed(() => this.deadlines().length);

  readonly tabs: { id: TabId; label: string }[] = [
    { id: 'dados', label: 'Dados Gerais' },
    { id: 'audiencias', label: 'Audiências' },
    { id: 'testemunhas', label: 'Testemunhas' },
    { id: 'prazos', label: 'Prazos' },
  ];

  // Edit form
  readonly editForm = this.fb.group({
    cnjNumber: ['', Validators.required],
    comarca: ['', Validators.required],
    vara: ['', Validators.required],
    courtType: ['vara', Validators.required],
    authorName: ['', Validators.required],
    defendantName: ['', Validators.required],
    clientSide: ['reu'],
    status: ['citado'],
    citationDate: [null as string | null],
    mentionsWitness: [false],
  });

  // Modal forms
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

  readonly reagendarForm = this.fb.group({
    dateTime: ['', Validators.required],
  });

  readonly criarPrazoForm = this.fb.group({
    type: ['', Validators.required],
    witnessId: [''],
    referenceDate: [''],
    hearingDate: [''],
  });

  readonly needsHearingDateForDeadline = computed(() => {
    const t = this.criarPrazoForm.get('type')?.value;
    return t === 'juntada_intimacao' || t === 'desistencia_testemunha';
  });

  readonly needsHearingDateForIntimation = computed(() => {
    return this.intimarForm.get('method')?.value === 'carta_simples';
  });

  readonly needsHearingDateForOutcome = computed(() => {
    return this.resultadoForm.get('outcome')?.value === 'positive';
  });

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.loading.set(true);
    this.loadError.set(false);

    forkJoin({
      process: this.http.get<ApiResponse<Process>>(`${this.apiUrl}/processes/${this.id}`, { withCredentials: true }),
      hearings: this.http.get<ApiListResponse<Hearing>>(`${this.apiUrl}/hearings`, { params: { processId: this.id, pageSize: '100' }, withCredentials: true }),
      witnesses: this.http.get<ApiListResponse<Witness>>(`${this.apiUrl}/witnesses`, { params: { processId: this.id, pageSize: '100' }, withCredentials: true }),
      deadlines: this.http.get<ApiListResponse<Deadline>>(`${this.apiUrl}/deadlines`, { params: { processId: this.id, pageSize: '100' }, withCredentials: true }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ process, hearings, witnesses, deadlines }) => {
          this.process.set(process.data);
          this.hearings.set(hearings.data);
          this.witnesses.set(witnesses.data);
          this.deadlines.set(deadlines.data);
          this.loading.set(false);
          this.populateEditForm(process.data);
        },
        error: () => {
          this.loading.set(false);
          this.loadError.set(true);
        },
      });
  }

  private populateEditForm(p: Process): void {
    this.editForm.patchValue({
      cnjNumber: p.cnjNumber,
      comarca: p.comarca,
      vara: p.vara,
      courtType: p.courtType,
      authorName: p.authorName,
      defendantName: p.defendantName,
      clientSide: p.clientSide,
      status: p.status,
      citationDate: p.citationDate ? p.citationDate.slice(0, 10) : null,
      mentionsWitness: p.mentionsWitness,
    });
  }

  setTab(tab: TabId): void {
    this.activeTab.set(tab);
  }

  enableEdit(): void {
    this.submitError.set(null);
    this.editMode.set(true);
  }

  cancelEdit(): void {
    const p = this.process();
    if (p) this.populateEditForm(p);
    this.editMode.set(false);
    this.submitError.set(null);
  }

  hasError(form: ReturnType<FormBuilder['group']>, name: string): boolean {
    const ctrl = form.get(name)!;
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
    const payload: Record<string, unknown> = { ...val };
    if (!payload['citationDate']) delete payload['citationDate'];

    this.http
      .patch<ApiResponse<Process>>(`${this.apiUrl}/processes/${this.id}`, payload, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.process.set(res.data);
          this.submitting.set(false);
          this.editMode.set(false);
          this.toastService.show('success', 'Processo atualizado com sucesso');
        },
        error: (err) => {
          this.submitting.set(false);
          if (err.status === 409) {
            this.submitError.set('Número CNJ já cadastrado em outro processo.');
          } else {
            this.submitError.set('Erro ao salvar. Tente novamente.');
          }
        },
      });
  }

  // --- Modals ---

  openModal(modal: NonNullable<ModalId>, targetId?: string): void {
    this.activeModal.set(modal);
    this.modalTargetId.set(targetId ?? null);
    this.modalError.set(null);
    this.intimarForm.reset({ method: '', hearingDate: null, sentAt: null });
    this.resultadoForm.reset({ outcome: '', hearingDate: null, occurredAt: null });
    this.substituirForm.reset({ side: 'reu' });
    this.reagendarForm.reset();
    this.criarPrazoForm.reset({ witnessId: '' });
  }

  closeModal(): void {
    this.activeModal.set(null);
    this.modalTargetId.set(null);
    this.modalError.set(null);
    this.modalSubmitting.set(false);
  }

  submitIntimation(): void {
    if (this.intimarForm.invalid) {
      this.intimarForm.markAllAsTouched();
      return;
    }
    const id = this.modalTargetId()!;
    const val = this.intimarForm.getRawValue();
    const payload: Record<string, unknown> = { method: val.method };
    if (val.hearingDate) payload['hearingDate'] = val.hearingDate;
    if (val.sentAt) payload['sentAt'] = val.sentAt;

    this.modalSubmitting.set(true);
    this.http
      .post(`${this.apiUrl}/witnesses/${id}/intimation`, payload, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reloadWitnesses();
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
    const id = this.modalTargetId()!;
    const val = this.resultadoForm.getRawValue();
    const payload: Record<string, unknown> = { outcome: val.outcome };
    if (val.hearingDate) payload['hearingDate'] = val.hearingDate;
    if (val.occurredAt) payload['occurredAt'] = val.occurredAt;

    this.modalSubmitting.set(true);
    this.http
      .post(`${this.apiUrl}/witnesses/${id}/intimation/outcome`, payload, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reloadWitnesses();
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
    const id = this.modalTargetId()!;
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
      .post(`${this.apiUrl}/witnesses/${id}/replace`, payload, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reloadWitnesses();
          this.closeModal();
          this.toastService.show('success', 'Testemunha substituída com sucesso');
        },
        error: () => {
          this.modalSubmitting.set(false);
          this.modalError.set('Erro ao substituir testemunha.');
        },
      });
  }

  submitReagendar(): void {
    if (this.reagendarForm.invalid) {
      this.reagendarForm.markAllAsTouched();
      return;
    }
    const id = this.modalTargetId()!;
    const val = this.reagendarForm.getRawValue();

    this.modalSubmitting.set(true);
    this.http
      .post(`${this.apiUrl}/hearings/${id}/reschedule`, { dateTime: val.dateTime }, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reloadHearings();
          this.closeModal();
          this.toastService.show('success', 'Audiência reagendada com sucesso');
        },
        error: (err) => {
          this.modalSubmitting.set(false);
          if (err.status === 422) {
            this.modalError.set('Esta audiência já foi cancelada e não pode ser reagendada.');
          } else {
            this.modalError.set('Erro ao reagendar audiência.');
          }
        },
      });
  }

  submitCriarPrazo(): void {
    if (this.criarPrazoForm.invalid) {
      this.criarPrazoForm.markAllAsTouched();
      return;
    }
    const val = this.criarPrazoForm.getRawValue();
    const payload: Record<string, unknown> = {
      processId: this.id,
      type: val.type,
    };
    if (val.witnessId) payload['witnessId'] = val.witnessId;
    if (val.referenceDate) payload['referenceDate'] = val.referenceDate;
    if (val.hearingDate) payload['hearingDate'] = val.hearingDate;

    this.modalSubmitting.set(true);
    this.http
      .post(`${this.apiUrl}/deadlines`, payload, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reloadDeadlines();
          this.closeModal();
          this.toastService.show('success', 'Prazo criado com sucesso');
        },
        error: () => {
          this.modalSubmitting.set(false);
          this.modalError.set('Erro ao criar prazo.');
        },
      });
  }

  cancelDeadline(): void {
    const id = this.confirmCancelDeadlineId();
    if (!id) return;
    this.http
      .delete(`${this.apiUrl}/deadlines/${id}`, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.confirmCancelDeadlineId.set(null);
          this.reloadDeadlines();
          this.toastService.show('success', 'Prazo cancelado com sucesso');
        },
        error: () => {
          this.confirmCancelDeadlineId.set(null);
          this.toastService.show('error', 'Erro ao cancelar prazo.');
        },
      });
  }

  private reloadHearings(): void {
    this.http
      .get<ApiListResponse<Hearing>>(`${this.apiUrl}/hearings`, { params: { processId: this.id, pageSize: '100' }, withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (r) => this.hearings.set(r.data) });
  }

  private reloadWitnesses(): void {
    this.http
      .get<ApiListResponse<Witness>>(`${this.apiUrl}/witnesses`, { params: { processId: this.id, pageSize: '100' }, withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (r) => this.witnesses.set(r.data) });
  }

  private reloadDeadlines(): void {
    this.http
      .get<ApiListResponse<Deadline>>(`${this.apiUrl}/deadlines`, { params: { processId: this.id, pageSize: '100' }, withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (r) => this.deadlines.set(r.data) });
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

  formatDate(dt: string | null): string {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('pt-BR');
  }
}
