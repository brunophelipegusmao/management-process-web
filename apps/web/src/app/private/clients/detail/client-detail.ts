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
import { forkJoin } from 'rxjs';

import { API_BASE_URL } from '../../../core/tokens/api-url.token';
import { ToastService } from '../../../core/services/toast.service';
import {
  type Client,
  type Process,
  type ApiResponse,
  type ApiListResponse,
  CLIENT_TYPE_LABELS,
  PROCESS_STATUS_LABELS,
} from '../../../core/models/api.types';

@Component({
  selector: 'app-client-detail',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './client-detail.html',
  styleUrl: './client-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientDetail implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  readonly id = this.route.snapshot.params['id'] as string;

  readonly client = signal<Client | null>(null);
  readonly processes = signal<Process[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly editMode = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly typeLabels = CLIENT_TYPE_LABELS;
  readonly processStatusLabels = PROCESS_STATUS_LABELS;

  readonly editForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [null as string | null],
    type: ['pf', Validators.required],
  });

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.loading.set(true);
    this.loadError.set(false);

    forkJoin({
      client: this.http.get<ApiResponse<Client>>(`${this.apiUrl}/clients/${this.id}`, { withCredentials: true }),
      processes: this.http.get<ApiListResponse<Process>>(`${this.apiUrl}/processes`, {
        params: { clientId: this.id, pageSize: '100' },
        withCredentials: true,
      }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ client, processes }) => {
          this.client.set(client.data);
          this.processes.set(processes.data);
          this.loading.set(false);
          this.populateForm(client.data);
        },
        error: () => {
          this.loading.set(false);
          this.loadError.set(true);
        },
      });
  }

  private populateForm(c: Client): void {
    this.editForm.patchValue({
      name: c.name,
      email: c.email ?? '',
      phone: c.phone,
      type: c.type,
    });
  }

  enableEdit(): void {
    this.submitError.set(null);
    this.editMode.set(true);
  }

  cancelEdit(): void {
    const c = this.client();
    if (c) this.populateForm(c);
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
    const payload: Record<string, unknown> = { name: val.name, email: val.email, type: val.type };
    if (val.phone) payload['phone'] = val.phone;

    this.http
      .patch<ApiResponse<Client>>(`${this.apiUrl}/clients/${this.id}`, payload, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.client.set(res.data);
          this.submitting.set(false);
          this.editMode.set(false);
          this.toastService.show('success', 'Cliente atualizado com sucesso');
        },
        error: (err) => {
          this.submitting.set(false);
          if (err.status === 409) {
            this.submitError.set('E-mail já cadastrado em outro cliente.');
          } else {
            this.submitError.set('Erro ao salvar. Tente novamente.');
          }
        },
      });
  }

  formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('pt-BR');
  }
}
