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
  type Hearing,
  type ApiListResponse,
  HEARING_TYPE_LABELS,
  HEARING_STATUS_LABELS,
} from '../../../core/models/api.types';

@Component({
  selector: 'app-hearing-list',
  imports: [ReactiveFormsModule, RouterLink, Pagination],
  templateUrl: './hearing-list.html',
  styleUrl: './hearing-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HearingList implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  private readonly destroyRef = inject(DestroyRef);

  readonly hearings = signal<Hearing[]>([]);
  readonly loading = signal(true);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);

  readonly typeLabels = HEARING_TYPE_LABELS;
  readonly statusLabels = HEARING_STATUS_LABELS;

  readonly filterForm = this.fb.group({
    processId: [''],
    type: [''],
    status: [''],
    from: [''],
    to: [''],
  });

  readonly isEmpty = computed(() => !this.loading() && this.hearings().length === 0);

  ngOnInit(): void {
    this.loadHearings();

    this.filterForm.valueChanges
      .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page.set(1);
        this.loadHearings();
      });
  }

  loadHearings(): void {
    this.loading.set(true);
    const { processId, type, status, from, to } = this.filterForm.value;
    const params: Record<string, string> = {
      page: String(this.page()),
      pageSize: String(this.pageSize()),
    };
    if (processId) params['processId'] = processId;
    if (type) params['type'] = type;
    if (status) params['status'] = status;
    if (from) params['startsAt'] = from;
    if (to) params['endsAt'] = to;

    this.http
      .get<ApiListResponse<Hearing>>(`${this.apiUrl}/hearings`, {
        params,
        withCredentials: true,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.hearings.set(res.data);
          this.total.set(res.meta.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPageChange(p: number): void {
    this.page.set(p);
    this.loadHearings();
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
}
