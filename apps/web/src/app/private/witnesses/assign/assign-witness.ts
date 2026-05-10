import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { API_BASE_URL } from '../../../core/tokens/api-url.token';

interface ProcessOption {
  id: string;
  cnjNumber: string;
  authorName: string;
  defendantName: string;
}

@Component({
  selector: 'app-assign-witness',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './assign-witness.html',
  styleUrl: './assign-witness.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignWitness implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = inject(API_BASE_URL);
  private destroyRef = inject(DestroyRef);

  processes = signal<ProcessOption[]>([]);
  loading = signal(false);
  submitting = signal(false);
  submitError = signal<string | null>(null);

  form = this.fb.group({
    processId: ['', Validators.required],
    fullName: ['', Validators.required],
    side: ['reu'],
    phone: [null as string | null],
    address: [null as string | null],
    residenceComarca: [null as string | null],
    maritalStatus: [null as string | null],
    profession: [null as string | null],
    notes: [null as string | null],
  });

  ngOnInit() {
    this.loading.set(true);
    this.http
      .get<{ data: ProcessOption[] }>(`${this.apiUrl}/processes`, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
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
    const payload: Record<string, unknown> = {
      processId: raw.processId,
      fullName: raw.fullName,
      side: raw.side,
    };
    if (raw.phone) payload['phone'] = raw.phone;
    if (raw.address) payload['address'] = raw.address;
    if (raw.residenceComarca) payload['residenceComarca'] = raw.residenceComarca;
    if (raw.maritalStatus) payload['maritalStatus'] = raw.maritalStatus;
    if (raw.profession) payload['profession'] = raw.profession;
    if (raw.notes) payload['notes'] = raw.notes;

    this.http
      .post(`${this.apiUrl}/witnesses`, payload, { withCredentials: true })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.submitting.set(false);
          if (err.status === 404) {
            this.submitError.set('Processo não encontrado. Selecione um processo válido.');
          } else if (err.status === 409) {
            this.submitError.set('Limite de testemunhas atingido para este tipo de vara.');
          } else {
            this.submitError.set('Erro ao designar testemunha. Tente novamente.');
          }
        },
      });
  }
}
