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
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';

import { API_BASE_URL } from '../../core/tokens/api-url.token';
import { Pagination } from '../../components/shared/pagination/pagination';
import { ConfirmDialog } from '../../components/shared/confirm-dialog/confirm-dialog';
import { ToastService } from '../../core/services/toast.service';
import {
  type Holiday,
  type ApiListResponse,
  type ApiResponse,
  HOLIDAY_TYPE_LABELS,
  HOLIDAY_SOURCE_LABELS,
} from '../../core/models/api.types';

@Component({
  selector: 'app-holidays',
  imports: [ReactiveFormsModule, Pagination, ConfirmDialog],
  templateUrl: './holidays.html',
  styleUrl: './holidays.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Holidays implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  readonly holidays = signal<Holiday[]>([]);
  readonly loading = signal(true);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);

  readonly showCreateForm = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly editingHoliday = signal<Holiday | null>(null);
  readonly editSubmitting = signal(false);
  readonly editError = signal<string | null>(null);

  readonly confirmDeleteId = signal<string | null>(null);
  readonly deleting = signal(false);

  readonly typeLabels = HOLIDAY_TYPE_LABELS;
  readonly sourceLabels = HOLIDAY_SOURCE_LABELS;

  readonly filterForm = this.fb.group({
    date: [''],
    type: [''],
    state: [''],
    municipality: [''],
    source: [''],
  });

  readonly createForm = this.fb.group({
    date: ['', Validators.required],
    name: ['', Validators.required],
    type: ['nacional', Validators.required],
    state: [null as string | null],
    municipality: [null as string | null],
    source: ['manual', Validators.required],
  });

  readonly editForm = this.fb.group({
    date: ['', Validators.required],
    name: ['', Validators.required],
    type: ['nacional', Validators.required],
    state: [null as string | null],
    municipality: [null as string | null],
    source: ['manual', Validators.required],
  });

  readonly isEmpty = computed(() => !this.loading() && this.holidays().length === 0);

  ngOnInit(): void {
    this.load();

    this.filterForm.valueChanges
      .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page.set(1);
        this.load();
      });
  }

  load(): void {
    this.loading.set(true);
    const { date, type, state, municipality, source } = this.filterForm.value;
    const params: Record<string, string> = {
      page: String(this.page()),
      pageSize: String(this.pageSize()),
    };
    if (date) params['date'] = date;
    if (type) params['type'] = type;
    if (state) params['state'] = state;
    if (municipality) params['municipality'] = municipality;
    if (source) params['source'] = source;

    this.http
      .get<ApiListResponse<Holiday>>(`${this.apiUrl}/holidays`, {
        params,
        withCredentials: true,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.holidays.set(res.data);
          this.total.set(res.meta.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPageChange(p: number): void {
    this.page.set(p);
    this.load();
  }

  // --- Create ---

  openCreate(): void {
    this.createForm.reset({ type: 'nacional', source: 'manual' });
    this.submitError.set(null);
    this.showCreateForm.set(true);
  }

  closeCreate(): void {
    this.showCreateForm.set(false);
    this.submitError.set(null);
  }

  hasCreateError(name: string): boolean {
    const ctrl = this.createForm.get(name)!;
    return ctrl.invalid && ctrl.touched;
  }

  submitCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.submitError.set(null);
    const val = this.createForm.getRawValue();
    const payload: Record<string, unknown> = {
      date: val.date,
      name: val.name,
      type: val.type,
      source: val.source,
    };
    if (val.state) payload['state'] = val.state;
    if (val.municipality) payload['municipality'] = val.municipality;

    this.http
      .post<ApiResponse<Holiday>>(`${this.apiUrl}/holidays`, payload, {
        withCredentials: true,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeCreate();
          this.page.set(1);
          this.load();
          this.toastService.show('success', 'Feriado criado com sucesso');
        },
        error: (err) => {
          this.submitting.set(false);
          if (err.status === 409) {
            this.submitError.set('Já existe um feriado com esta data e nome.');
          } else {
            this.submitError.set('Erro ao criar feriado. Tente novamente.');
          }
        },
      });
  }

  // --- Edit ---

  openEdit(holiday: Holiday): void {
    this.editForm.patchValue({
      date: holiday.date,
      name: holiday.name,
      type: holiday.type,
      state: holiday.state,
      municipality: holiday.municipality,
      source: holiday.source,
    });
    this.editError.set(null);
    this.editingHoliday.set(holiday);
  }

  closeEdit(): void {
    this.editingHoliday.set(null);
    this.editError.set(null);
    this.editSubmitting.set(false);
  }

  hasEditError(name: string): boolean {
    const ctrl = this.editForm.get(name)!;
    return ctrl.invalid && ctrl.touched;
  }

  submitEdit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const id = this.editingHoliday()!.id;
    this.editSubmitting.set(true);
    this.editError.set(null);
    const val = this.editForm.getRawValue();
    const payload: Record<string, unknown> = {
      date: val.date,
      name: val.name,
      type: val.type,
      source: val.source,
    };
    if (val.state) payload['state'] = val.state;
    if (val.municipality) payload['municipality'] = val.municipality;

    this.http
      .patch<ApiResponse<Holiday>>(`${this.apiUrl}/holidays/${id}`, payload, {
        withCredentials: true,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.editSubmitting.set(false);
          this.closeEdit();
          this.holidays.update((list) => list.map((h) => (h.id === id ? res.data : h)));
          this.toastService.show('success', 'Feriado atualizado com sucesso');
        },
        error: () => {
          this.editSubmitting.set(false);
          this.editError.set('Erro ao salvar. Tente novamente.');
        },
      });
  }

  // --- Delete ---

  deleteHoliday(): void {
    const id = this.confirmDeleteId();
    if (!id) return;
    this.deleting.set(true);

    this.http
      .delete(`${this.apiUrl}/holidays/${id}`, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deleting.set(false);
          this.confirmDeleteId.set(null);
          this.load();
          this.toastService.show('success', 'Feriado removido');
        },
        error: () => {
          this.deleting.set(false);
          this.confirmDeleteId.set(null);
          this.toastService.show('error', 'Erro ao remover feriado.');
        },
      });
  }

  formatDate(dt: string): string {
    // date field from API is YYYY-MM-DD (no timezone shift needed)
    const [y, m, d] = dt.split('-');
    return `${d}/${m}/${y}`;
  }
}
