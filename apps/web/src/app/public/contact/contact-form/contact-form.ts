import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { API_BASE_URL } from '../../../core/tokens/api-url.token';

const RECAPTCHA_SITE_KEY = '6Leb_OEsAAAAALMcTxf16mJltmGxo988tpTPtFge';

declare const grecaptcha: {
  render: (el: HTMLElement, opts: object) => number;
  reset: (widgetId?: number) => void;
};

@Component({
  selector: 'app-contact-form',
  imports: [ReactiveFormsModule],
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactForm implements OnInit {
  private fb = inject(FormBuilder);
  private el = inject(ElementRef);
  private http = inject(HttpClient);
  private apiUrl = inject(API_BASE_URL);

  readonly visible = signal(false);
  readonly submitted = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly recaptchaVerified = signal(false);
  readonly recaptchaError = signal(false);

  private recaptchaToken = '';
  private widgetId: number | null = null;

  readonly form = this.fb.group({
    name:    ['', [Validators.required, Validators.minLength(2)]],
    email:   ['', [Validators.required, Validators.email]],
    phone:   [''],
    subject: ['', Validators.required],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  constructor() {
    afterNextRender(() => this.loadRecaptchaScript());
  }

  ngOnInit() {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.visible.set(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(this.el.nativeElement);
  }

  private loadRecaptchaScript() {
    if (document.querySelector('script[src*="recaptcha/api.js"]')) {
      this.renderWidget();
      return;
    }
    const cbName = `__rcb_contact`;
    (window as unknown as Record<string, unknown>)[cbName] = () => {
      delete (window as unknown as Record<string, unknown>)[cbName];
      this.renderWidget();
    };
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=explicit&onload=${cbName}`;
    script.async = true;
    document.head.appendChild(script);
  }

  private renderWidget() {
    const container = this.el.nativeElement.querySelector('#recaptcha-widget') as HTMLElement | null;
    if (!container || typeof grecaptcha === 'undefined') return;
    this.widgetId = grecaptcha.render(container, {
      sitekey: RECAPTCHA_SITE_KEY,
      callback: (token: string) => {
        this.recaptchaToken = token;
        this.recaptchaVerified.set(true);
        this.recaptchaError.set(false);
      },
      'expired-callback': () => {
        this.recaptchaToken = '';
        this.recaptchaVerified.set(false);
      },
    });
  }

  field(name: string) {
    return this.form.get(name)!;
  }

  hasError(name: string) {
    const f = this.field(name);
    return f.invalid && f.touched;
  }

  submit() {
    this.submitError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.recaptchaVerified()) {
      this.recaptchaError.set(true);
      return;
    }

    const v = this.form.value;
    this.submitting.set(true);

    this.http
      .post(`${this.apiUrl}/contact`, {
        name:           v.name,
        email:          v.email,
        phone:          v.phone || undefined,
        subject:        v.subject,
        message:        v.message,
        recaptchaToken: this.recaptchaToken,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.submitted.set(true);
          this.form.reset();
          this.recaptchaToken = '';
          this.recaptchaVerified.set(false);
          if (this.widgetId !== null) grecaptcha.reset(this.widgetId);
        },
        error: (err) => {
          this.submitting.set(false);
          const msg: string =
            err?.error?.error ?? 'Erro ao enviar mensagem. Tente novamente.';
          this.submitError.set(msg);
        },
      });
  }
}
