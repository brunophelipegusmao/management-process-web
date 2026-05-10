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

import { API_BASE_URL } from '../../core/tokens/api-url.token';
import { Pagination } from '../../components/shared/pagination/pagination';
import { type AuditLog, type ApiListResponse, ACTION_TYPE_VALUES } from '../../core/models/api.types';

@Component({
  selector: 'app-audit-logs',
  imports: [ReactiveFormsModule, RouterLink, Pagination],
  templateUrl: './audit-logs.html',
  styleUrl: './audit-logs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogs implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  private readonly destroyRef = inject(DestroyRef);

  readonly logs = signal<AuditLog[]>([]);
  readonly loading = signal(true);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);

  readonly actionTypeValues = ACTION_TYPE_VALUES;

  readonly filterForm = this.fb.group({
    processId: [''],
    userId: [''],
    actionType: [''],
    createdFrom: [''],
    createdTo: [''],
  });

  readonly isEmpty = computed(() => !this.loading() && this.logs().length === 0);

  ngOnInit(): void {
    this.loadLogs();

    this.filterForm.valueChanges
      .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page.set(1);
        this.loadLogs();
      });
  }

  loadLogs(): void {
    this.loading.set(true);
    const { processId, userId, actionType, createdFrom, createdTo } = this.filterForm.value;
    const params: Record<string, string> = {
      page: String(this.page()),
      pageSize: String(this.pageSize()),
    };
    if (processId) params['processId'] = processId;
    if (userId) params['userId'] = userId;
    if (actionType) params['actionType'] = actionType;
    if (createdFrom) params['createdFrom'] = createdFrom;
    if (createdTo) params['createdTo'] = createdTo;

    this.http
      .get<ApiListResponse<AuditLog>>(`${this.apiUrl}/audit-logs`, { params, withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.logs.set(res.data);
          this.total.set(res.meta.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPageChange(p: number): void {
    this.page.set(p);
    this.loadLogs();
  }

  formatDateTime(dt: string): string {
    return new Date(dt).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}
