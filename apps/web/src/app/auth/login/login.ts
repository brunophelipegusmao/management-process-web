import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { AuthStore } from '../../core/stores/auth.store';

const REMEMBERED_EMAIL_KEY = 'mulim.rememberedEmail';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberEmail: [false],
  });

  ngOnInit(): void {
    // After APP_INITIALIZER restores the session, if already authenticated
    // redirect to dashboard instead of showing the login form.
    if (this.authStore.isAuthenticated()) {
      const returnUrl =
        this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
      this.router.navigateByUrl(returnUrl, { replaceUrl: true });
      return;
    }

    if (isPlatformBrowser(this.platformId)) {
      const savedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
      if (savedEmail) {
        this.form.patchValue({ email: savedEmail, rememberEmail: true });
      }
    }
  }

  isFieldInvalid(field: 'email' | 'password'): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && control.touched;
  }

  getFieldError(field: 'email' | 'password'): string {
    const control = this.form.get(field);
    if (!control) return '';
    if (control.hasError('required')) return 'Campo obrigatório.';
    if (control.hasError('email')) return 'E-mail inválido.';
    if (control.hasError('minlength')) return 'Mínimo 6 caracteres.';
    return '';
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const { email, password, rememberEmail } = this.form.getRawValue();
      await this.authService.signIn(email!, password!);

      if (isPlatformBrowser(this.platformId)) {
        if (rememberEmail && email) {
          localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
        } else {
          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }
      }

      const returnUrl =
        this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
      await this.router.navigateByUrl(returnUrl);
    } catch {
      this.errorMessage.set('E-mail ou senha inválidos.');
    } finally {
      this.loading.set(false);
    }
  }
}
