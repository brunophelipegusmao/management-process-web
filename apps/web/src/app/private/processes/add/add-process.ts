import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { API_BASE_URL } from '../../../core/tokens/api-url.token';

interface ClientOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-add-process',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './add-process.html',
  styleUrl: './add-process.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddProcess implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = inject(API_BASE_URL);
  private destroyRef = inject(DestroyRef);

  clients = signal<ClientOption[]>([]);
  loading = signal(false);
  submitting = signal(false);
  submitError = signal<string | null>(null);

  form = this.fb.group({
    cnjNumber: ['', Validators.required],
    comarca: ['', Validators.required],
    vara: ['', Validators.required],
    courtType: ['vara', Validators.required],
    authorName: ['', Validators.required],
    defendantName: ['', Validators.required],
    clientId: ['', Validators.required],
    clientSide: ['reu'],
    status: ['citado'],
    citationDate: [null as string | null],
    mentionsWitness: [false],
  });

  ngOnInit() {
    this.loading.set(true);
    this.http
      .get<{ data: ClientOption[] }>(`${this.apiUrl}/clients`, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.clients.set(res.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  hasError(name: string): boolean {
    const ctrl = this.form.get(name)!;
    return ctrl.invalid && ctrl.touched;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.submitError.set(null);

    const raw = this.form.getRawValue();
    const payload = {
      ...raw,
      citationDate: raw.citationDate || undefined,
    };

    this.http
      .post(`${this.apiUrl}/processes`, payload, { withCredentials: true })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.submitting.set(false);
          if (err.status === 409) {
            this.submitError.set('Número CNJ já cadastrado. Verifique o número informado.');
          } else if (err.status === 404) {
            this.submitError.set('Cliente não encontrado. Selecione um cliente válido.');
          } else {
            this.submitError.set('Erro ao cadastrar processo. Tente novamente.');
          }
        },
      });
  }
}
