import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { appEnv } from '../../config/app-env';
import { EmailService } from '../../infra/email/email.service';

export type ContactInput = {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  recaptchaToken: string;
};

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(private readonly emailService: EmailService) {}

  async send(input: ContactInput): Promise<void> {
    await this.verifyRecaptcha(input.recaptchaToken);

    const phone = input.phone?.trim() || 'Não informado';

    await this.emailService.sendDirect({
      to: 'contato@mulimassociados.adv.br',
      subject: `[Site] ${input.subject}`,
      html: this.buildHtml({ ...input, phone }),
      text: this.buildText({ ...input, phone }),
    });

    this.logger.log(`contact_email_sent from=${input.email}`);
  }

  private async verifyRecaptcha(token: string): Promise<void> {
    if (!appEnv.recaptcha.secretKey) {
      this.logger.warn('RECAPTCHA_SECRET_KEY not set — skipping verification');
      return;
    }

    const params = new URLSearchParams({
      secret: appEnv.recaptcha.secretKey,
      response: token,
    });

    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      body: params,
    });

    const json = (await res.json()) as { success: boolean; 'error-codes'?: string[] };

    if (!json.success) {
      this.logger.warn(`recaptcha_failed codes=${json['error-codes']?.join(',')}`);
      throw new BadRequestException('reCAPTCHA inválido. Tente novamente.');
    }
  }

  private buildHtml(v: ContactInput & { phone: string }): string {
    const row = (label: string, value: string) =>
      `<tr>
        <td style="padding:8px 12px 8px 0;font-weight:600;color:#6b7280;white-space:nowrap;vertical-align:top">${label}</td>
        <td style="padding:8px 0;color:#111827">${value}</td>
      </tr>`;

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border-top:3px solid #c8a96e">
    <div style="padding:32px 40px 24px">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#c8a96e;font-weight:700">
        Mulim Advogados Associados
      </p>
      <h1 style="margin:0 0 24px;font-size:20px;color:#1e2d3d;font-weight:700">
        Nova mensagem pelo site
      </h1>
      <table style="width:100%;border-collapse:collapse">
        ${row('Nome', v.name)}
        ${row('E-mail', `<a href="mailto:${v.email}" style="color:#c8a96e">${v.email}</a>`)}
        ${row('Telefone', v.phone)}
        ${row('Assunto', v.subject)}
      </table>
    </div>
    <div style="padding:0 40px 32px">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#6b7280;font-weight:700">
        Mensagem
      </p>
      <div style="white-space:pre-wrap;background:#f9fafb;border-left:3px solid #c8a96e;padding:16px 20px;color:#374151;font-size:14px;line-height:1.7">
${v.message}
      </div>
    </div>
    <div style="padding:16px 40px;background:#f9fafb;border-top:1px solid #e5e7eb">
      <p style="margin:0;font-size:12px;color:#9ca3af">
        Mensagem enviada pelo formulário de contato do site.
      </p>
    </div>
  </div>
</body>
</html>`;
  }

  private buildText(v: ContactInput & { phone: string }): string {
    return [
      'Nova mensagem pelo site — Mulim Advogados Associados',
      '',
      `Nome:     ${v.name}`,
      `E-mail:   ${v.email}`,
      `Telefone: ${v.phone}`,
      `Assunto:  ${v.subject}`,
      '',
      'Mensagem:',
      v.message,
    ].join('\n');
  }
}
