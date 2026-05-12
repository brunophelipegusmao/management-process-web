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
  type Client,
  type ApiListResponse,
  CLIENT_TYPE_LABELS,
} from '../../../core/models/api.types';
import { ClientStore } from '../../../core/stores/client.store';

@Component({
  selector: 'app-client-list',
  imports: [ReactiveFormsModule, RouterLink, Pagination, ConfirmDialog],
  templateUrl: './client-list.html',
  styleUrl: './client-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientList implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);
  private readonly store = inject(ClientStore);

  readonly clients = signal<Client[]>([]);
  readonly loading = signal(true);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly confirmDeleteId = signal<string | null>(null);

  readonly typeLabels = CLIENT_TYPE_LABELS;

  readonly filterForm = this.fb.group({
    name: [''],
    type: [''],
  });

  readonly isEmpty = computed(() => !this.loading() && this.clients().length === 0);

  ngOnInit(): void {
    // Restore from cache if fresh
    const cached = this.store.state();
    if (this.store.isFresh() && cached) {
      this.clients.set(cached.items);
      this.total.set(cached.total);
      this.page.set(cached.page);
      this.filterForm.patchValue(cached.filters, { emitEvent: false });
      this.loading.set(false);
    } else {
      this.loadClients();
    }

    this.filterForm.valueChanges
      .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page.set(1);
        this.loadClients();
      });
  }

  loadClients(): void {
    this.loading.set(true);
    const { name, type } = this.filterForm.value;
    const params: Record<string, string> = {
      page: String(this.page()),
      pageSize: String(this.pageSize()),
    };
    if (name) params['name'] = name;
    if (type) params['type'] = type;

    this.http
      .get<ApiListResponse<Client>>(`${this.apiUrl}/clients`, { params, withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.clients.set(res.data);
          this.total.set(res.meta.total);
          this.loading.set(false);
          this.store.set({
            items: res.data,
            total: res.meta.total,
            page: this.page(),
            pageSize: this.pageSize(),
            filters: { name: name ?? '', type: type ?? '' },
          });
        },
        error: () => this.loading.set(false),
      });
  }

  onPageChange(p: number): void {
    this.page.set(p);
    this.loadClients();
  }

  deleteClient(): void {
    const id = this.confirmDeleteId();
    if (!id) return;
    this.http
      .delete(`${this.apiUrl}/clients/${id}`, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.confirmDeleteId.set(null);
          this.store.invalidate();
          this.loadClients();
          this.toastService.show('success', 'Cliente excluído com sucesso');
        },
        error: () => {
          this.confirmDeleteId.set(null);
          this.toastService.show('error', 'Erro ao excluir cliente.');
        },
      });
  }
}
