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
import {
  type Email,
  type ApiListResponse,
  EMAIL_TEMPLATE_LABELS,
} from '../../core/models/api.types';

@Component({
  selector: 'app-email-history',
  imports: [ReactiveFormsModule, RouterLink, Pagination],
  templateUrl: './email-history.html',
  styleUrl: './email-history.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailHistory implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  private readonly destroyRef = inject(DestroyRef);

  readonly emails = signal<Email[]>([]);
  readonly loading = signal(true);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);

  readonly templateLabels = EMAIL_TEMPLATE_LABELS;
  readonly templateValues = Object.keys(EMAIL_TEMPLATE_LABELS) as Email['template'][];

  readonly filterForm = this.fb.group({
    processId: [''],
    template: [''],
    recipient: [''],
  });

  readonly isEmpty = computed(() => !this.loading() && this.emails().length === 0);

  ngOnInit(): void {
    this.loadEmails();

    this.filterForm.valueChanges
      .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page.set(1);
        this.loadEmails();
      });
  }

  loadEmails(): void {
    this.loading.set(true);
    const { processId, template, recipient } = this.filterForm.value;
    const params: Record<string, string> = {
      page: String(this.page()),
      pageSize: String(this.pageSize()),
    };
    if (processId) params['processId'] = processId;
    if (template) params['template'] = template;
    if (recipient) params['recipient'] = recipient;

    this.http
      .get<ApiListResponse<Email>>(`${this.apiUrl}/emails`, { params, withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.emails.set(res.data);
          this.total.set(res.meta.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPageChange(p: number): void {
    this.page.set(p);
    this.loadEmails();
  }

  formatDateTime(dt: string | null): string {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }

  formatDate(dt: string | null): string {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('pt-BR');
  }
}
