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
import {
  type Process,
  type ApiListResponse,
  PROCESS_STATUS_LABELS,
  COURT_TYPE_LABELS,
} from '../../../core/models/api.types';

@Component({
  selector: 'app-process-list',
  imports: [ReactiveFormsModule, RouterLink, Pagination],
  templateUrl: './process-list.html',
  styleUrl: './process-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcessList implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  private readonly destroyRef = inject(DestroyRef);

  readonly processes = signal<Process[]>([]);
  readonly loading = signal(true);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);

  readonly statusLabels = PROCESS_STATUS_LABELS;
  readonly courtTypeLabels = COURT_TYPE_LABELS;

  readonly filterForm = this.fb.group({
    cnjNumber: [''],
    status: [''],
    courtType: [''],
  });

  readonly isEmpty = computed(() => !this.loading() && this.processes().length === 0);

  ngOnInit(): void {
    this.loadProcesses();

    this.filterForm.valueChanges
      .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page.set(1);
        this.loadProcesses();
      });
  }

  loadProcesses(): void {
    this.loading.set(true);
    const { cnjNumber, status, courtType } = this.filterForm.value;
    const params: Record<string, string> = {
      page: String(this.page()),
      pageSize: String(this.pageSize()),
    };
    if (cnjNumber) params['cnjNumber'] = cnjNumber;
    if (status) params['status'] = status;
    if (courtType) params['courtType'] = courtType;

    this.http
      .get<ApiListResponse<Process>>(`${this.apiUrl}/processes`, {
        params,
        withCredentials: true,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.processes.set(res.data);
          this.total.set(res.meta.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPageChange(p: number): void {
    this.page.set(p);
    this.loadProcesses();
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  }
}
