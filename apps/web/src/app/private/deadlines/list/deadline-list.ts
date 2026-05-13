import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';

import { API_BASE_URL } from '../../../core/tokens/api-url.token';
import { Pagination } from '../../../components/shared/pagination/pagination';
import { ConfirmDialog } from '../../../components/shared/confirm-dialog/confirm-dialog';
import { ToastService } from '../../../core/services/toast.service';
import {
  type Deadline,
  type ApiListResponse,
  DEADLINE_TYPE_LABELS,
  DEADLINE_STATUS_LABELS,
} from '../../../core/models/api.types';

@Component({
  selector: 'app-deadline-list',
  imports: [ReactiveFormsModule, RouterLink, Pagination, ConfirmDialog],
  templateUrl: './deadline-list.html',
  styleUrl: './deadline-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeadlineList implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  readonly deadlines = signal<Deadline[]>([]);
  readonly loading = signal(true);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly confirmCancelId = signal<string | null>(null);

  readonly typeLabels = DEADLINE_TYPE_LABELS;
  readonly statusLabels = DEADLINE_STATUS_LABELS;

  readonly filterForm = this.fb.group({
    cnjNumber: [''],
    status: [''],
    type: [''],
    dueDateFrom: [''],
    dueDateTo: [''],
  });

  readonly isEmpty = computed(() => !this.loading() && this.deadlines().length === 0);

  ngOnInit(): void {
    this.loadDeadlines();

    this.filterForm.valueChanges
      .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page.set(1);
        this.loadDeadlines();
      });
  }

  loadDeadlines(): void {
    this.loading.set(true);
    const { cnjNumber, status, type, dueDateFrom, dueDateTo } = this.filterForm.value;
    const params: Record<string, string> = {
      page: String(this.page()),
      pageSize: String(this.pageSize()),
    };
    if (cnjNumber) params['cnjNumber'] = cnjNumber;
    if (status) params['status'] = status;
    if (type) params['type'] = type;
    if (dueDateFrom) params['dueDateFrom'] = dueDateFrom;
    if (dueDateTo) params['dueDateTo'] = dueDateTo;

    this.http
      .get<ApiListResponse<Deadline>>(`${this.apiUrl}/deadlines`, {
        params,
        withCredentials: true,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.deadlines.set(res.data);
          this.total.set(res.meta.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPageChange(p: number): void {
    this.page.set(p);
    this.loadDeadlines();
  }

  cancelDeadline(): void {
    const id = this.confirmCancelId();
    if (!id) return;
    this.http
      .delete(`${this.apiUrl}/deadlines/${id}`, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.confirmCancelId.set(null);
          this.loadDeadlines();
          this.toastService.show('success', 'Prazo cancelado com sucesso');
        },
        error: () => {
          this.confirmCancelId.set(null);
          this.toastService.show('error', 'Erro ao cancelar prazo.');
        },
      });
  }

  formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('pt-BR');
  }
}
