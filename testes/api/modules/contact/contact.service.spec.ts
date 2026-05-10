import { BadRequestException } from '@nestjs/common';

import { ContactService } from '../../../../apps/api/src/modules/contact/contact.service';
import type { EmailService } from '../../../../apps/api/src/infra/email/email.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildInput(
   overrides: Partial<Parameters<ContactService['send']>[0]> = {},
): Parameters<ContactService['send']>[0] {
   return {
      name: 'João da Silva',
      email: 'joao@exemplo.com',
      phone: '(11) 99999-9999',
      subject: 'Consulta sobre processo',
      message: 'Gostaria de mais informações sobre meu caso.',
      recaptchaToken: 'token-valido',
      ...overrides,
   };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ContactService', () => {
   let service: ContactService;
   let emailService: jest.Mocked<EmailService>;

   beforeEach(() => {
      emailService = {
         sendDirect: jest.fn().mockResolvedValue(undefined),
         sendTemplate: jest.fn(),
      } as unknown as jest.Mocked<EmailService>;

      service = new ContactService(emailService);
   });

   // -------------------------------------------------------------------------
   describe('send — no reCAPTCHA key configured (default in test env)', () => {
      it('sends email to the firm address when recaptcha key is absent', async () => {
         await service.send(buildInput());

         expect(emailService.sendDirect).toHaveBeenCalledTimes(1);
         expect(emailService.sendDirect).toHaveBeenCalledWith(
            expect.objectContaining({
               to: 'contato@mulimassociados.adv.br',
            }),
         );
      });

      it('prefixes the subject with [Site]', async () => {
         await service.send(buildInput({ subject: 'Urgente' }));

         expect(emailService.sendDirect).toHaveBeenCalledWith(
            expect.objectContaining({ subject: '[Site] Urgente' }),
         );
      });

      it('sends both HTML and plain-text body', async () => {
         await service.send(buildInput());

         const [call] = emailService.sendDirect.mock.calls;
         expect(call[0].html).toBeTruthy();
         expect(call[0].text).toBeTruthy();
      });

      it('replaces missing phone with "Não informado"', async () => {
         await service.send(buildInput({ phone: undefined }));

         const [call] = emailService.sendDirect.mock.calls;
         const { text, html } = call[0];
         expect((text ?? '') + (html ?? '')).toContain('Não informado');
      });

      it('trims whitespace from phone before using it', async () => {
         await service.send(buildInput({ phone: '  11 9 9999-9999  ' }));

         const [call] = emailService.sendDirect.mock.calls;
         const { text, html } = call[0];
         expect((text ?? '') + (html ?? '')).toContain('11 9 9999-9999');
      });

      it('includes the sender name and message in the email body', async () => {
         const input = buildInput({
            name: 'Maria Oliveira',
            message: 'Preciso de ajuda.',
         });

         await service.send(input);

         const [call] = emailService.sendDirect.mock.calls;
         const body = (call[0].html ?? '') + (call[0].text ?? '');
         expect(body).toContain('Maria Oliveira');
         expect(body).toContain('Preciso de ajuda.');
      });
   });

   // -------------------------------------------------------------------------
   describe('send — reCAPTCHA key is set', () => {
      /**
       * Patch appEnv to simulate a configured secret key. We mock global.fetch
       * to control the reCAPTCHA verification response.
       */
      let originalFetch: typeof global.fetch;

      beforeEach(() => {
         originalFetch = global.fetch;
      });

      afterEach(() => {
         global.fetch = originalFetch;
         // Reset the module-level secret key by restoring the original appEnv
         jest.resetModules();
      });

      it('throws BadRequestException when reCAPTCHA verification fails', async () => {
         // The service reads appEnv.recaptcha.secretKey at call time; we need to
         // simulate it being set via module-mock to avoid mutating a const object.
         jest.mock('../../../../apps/api/src/config/app-env', () => ({
            appEnv: {
               recaptcha: { secretKey: 'test-recaptcha-secret' },
               email: {
                  provider: 'console',
                  from: 'test@test.com',
                  smtp: {
                     host: 'smtp.test.com',
                     port: 465,
                     secure: true,
                     user: '',
                     pass: '',
                  },
               },
            },
         }));

         // Re-import the service module after the mock is registered
         const { ContactService: MockedService } =
            await import('../../../../apps/api/src/modules/contact/contact.service');

         const mockedEmailService = {
            sendDirect: jest.fn(),
         } as unknown as jest.Mocked<EmailService>;

         global.fetch = jest.fn().mockResolvedValue({
            json: () =>
               Promise.resolve({
                  success: false,
                  'error-codes': ['invalid-input-response'],
               }),
         } as unknown as Response);

         const serviceWithKey = new MockedService(mockedEmailService);

         await expect(
            serviceWithKey.send(buildInput({ recaptchaToken: 'bad-token' })),
         ).rejects.toBeInstanceOf(BadRequestException);

         expect(mockedEmailService.sendDirect).not.toHaveBeenCalled();
      });
   });
});
