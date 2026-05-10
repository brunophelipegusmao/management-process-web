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
  type Witness,
  type ApiListResponse,
  WITNESS_STATUS_LABELS,
} from '../../../core/models/api.types';

@Component({
  selector: 'app-witness-list',
  imports: [ReactiveFormsModule, RouterLink, Pagination],
  templateUrl: './witness-list.html',
  styleUrl: './witness-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WitnessList implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  private readonly destroyRef = inject(DestroyRef);

  readonly witnesses = signal<Witness[]>([]);
  readonly loading = signal(true);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);

  readonly statusLabels = WITNESS_STATUS_LABELS;

  readonly filterForm = this.fb.group({
    processId: [''],
    status: [''],
    replaced: [''],
  });

  readonly isEmpty = computed(() => !this.loading() && this.witnesses().length === 0);

  ngOnInit(): void {
    this.loadWitnesses();

    this.filterForm.valueChanges
      .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page.set(1);
        this.loadWitnesses();
      });
  }

  loadWitnesses(): void {
    this.loading.set(true);
    const { processId, status, replaced } = this.filterForm.value;
    const params: Record<string, string> = {
      page: String(this.page()),
      pageSize: String(this.pageSize()),
    };
    if (processId) params['processId'] = processId;
    if (status) params['status'] = status;
    if (replaced !== '') params['replaced'] = replaced as string;

    this.http
      .get<ApiListResponse<Witness>>(`${this.apiUrl}/witnesses`, {
        params,
        withCredentials: true,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.witnesses.set(res.data);
          this.total.set(res.meta.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPageChange(p: number): void {
    this.page.set(p);
    this.loadWitnesses();
  }
}
