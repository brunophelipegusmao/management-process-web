import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { API_BASE_URL } from '../../../core/tokens/api-url.token';

interface ProcessOption {
  id: string;
  cnjNumber: string;
  authorName: string;
  defendantName: string;
}

@Component({
  selector: 'app-add-hearing',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './add-hearing.html',
  styleUrl: './add-hearing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddHearing implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = inject(API_BASE_URL);

  processes = signal<ProcessOption[]>([]);
  loading = signal(false);
  submitting = signal(false);
  submitError = signal<string | null>(null);

  form = this.fb.group({
    processId: ['', Validators.required],
    dateTime: ['', Validators.required],
    type: ['', Validators.required],
    status: ['agendada'],
    rescheduledTo: [null as string | null],
  });

  ngOnInit() {
    this.loading.set(true);
    this.http
      .get<{ data: ProcessOption[] }>(`${this.apiUrl}/processes`, { withCredentials: true })
      .subscribe({
        next: (res) => {
          this.processes.set(res.data);
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
      rescheduledTo: raw.rescheduledTo || undefined,
    };

    this.http
      .post(`${this.apiUrl}/hearings`, payload, { withCredentials: true })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.submitting.set(false);
          if (err.status === 404) {
            this.submitError.set('Processo não encontrado. Selecione um processo válido.');
          } else {
            this.submitError.set('Erro ao agendar audiência. Tente novamente.');
          }
        },
      });
  }
}
