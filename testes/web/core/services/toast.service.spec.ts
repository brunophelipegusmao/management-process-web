import { ToastService } from '../../../../apps/web/src/app/core/services/toast.service';

/**
 * ToastService uses Angular Signals (signal) and native setTimeout — no
 * TestBed or injection context is needed.  We use Vitest's fake timers to
 * control the auto-dismiss timeout without waiting real wall-clock time.
 */
describe('ToastService', () => {
   let service: ToastService;

   beforeEach(() => {
      service = new ToastService();
      vi.useFakeTimers();
   });

   afterEach(() => {
      vi.useRealTimers();
   });

   // -------------------------------------------------------------------------
   describe('initial state', () => {
      it('starts with an empty toast list', () => {
         expect(service.toasts()).toEqual([]);
      });
   });

   // -------------------------------------------------------------------------
   describe('show', () => {
      it('adds a toast with the given type and message', () => {
         service.show('success', 'Operação concluída');

         const toasts = service.toasts();
         expect(toasts).toHaveLength(1);
         expect(toasts[0]).toMatchObject({
            type: 'success',
            message: 'Operação concluída',
         });
      });

      it('assigns a unique string id to each toast', () => {
         service.show('info', 'Primeira');
         service.show('info', 'Segunda');

         const [first, second] = service.toasts();
         expect(typeof first.id).toBe('string');
         expect(first.id).not.toBe(second.id);
      });

      it('supports success, error, and info types', () => {
         service.show('success', 'Sucesso');
         service.show('error', 'Erro');
         service.show('info', 'Info');

         const types = service.toasts().map(t => t.type);
         expect(types).toEqual(['success', 'error', 'info']);
      });

      it('accumulates multiple toasts', () => {
         service.show('success', 'A');
         service.show('error', 'B');

         expect(service.toasts()).toHaveLength(2);
      });
   });

   // -------------------------------------------------------------------------
   describe('dismiss', () => {
      it('removes the toast with the given id', () => {
         service.show('info', 'Mensagem');
         const [toast] = service.toasts();

         service.dismiss(toast.id);

         expect(service.toasts()).toHaveLength(0);
      });

      it('only removes the targeted toast when multiple are present', () => {
         service.show('success', 'Primeiro');
         service.show('error', 'Segundo');
         const [first] = service.toasts();

         service.dismiss(first.id);

         expect(service.toasts()).toHaveLength(1);
         expect(service.toasts()[0].message).toBe('Segundo');
      });

      it('is a no-op when the id does not match any toast', () => {
         service.show('info', 'Existe');

         service.dismiss('id-inexistente');

         expect(service.toasts()).toHaveLength(1);
      });
   });

   // -------------------------------------------------------------------------
   describe('auto-dismiss after duration', () => {
      it('auto-dismisses the toast after the default duration (4 000 ms)', () => {
         service.show('success', 'Vai sumir');

         expect(service.toasts()).toHaveLength(1);

         vi.advanceTimersByTime(4_000);

         expect(service.toasts()).toHaveLength(0);
      });

      it('auto-dismisses after a custom duration', () => {
         service.show('info', 'Curto', 1_000);

         vi.advanceTimersByTime(999);
         expect(service.toasts()).toHaveLength(1);

         vi.advanceTimersByTime(1);
         expect(service.toasts()).toHaveLength(0);
      });

      it('does not dismiss a toast before its duration elapses', () => {
         service.show('error', 'Ainda presente', 5_000);

         vi.advanceTimersByTime(4_999);

         expect(service.toasts()).toHaveLength(1);
      });
   });
});
