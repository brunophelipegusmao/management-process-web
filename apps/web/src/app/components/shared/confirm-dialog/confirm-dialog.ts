import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="'confirm-title-' + dialogId"
        [attr.aria-describedby]="'confirm-desc-' + dialogId"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50"
          (click)="cancelled.emit()"
          aria-hidden="true"
        ></div>

        <!-- Dialog panel -->
        <div
          #panel
          class="relative bg-background border border-foreground/15 rounded-lg shadow-xl max-w-sm w-full p-6 flex flex-col gap-4"
        >
          <h2
            [id]="'confirm-title-' + dialogId"
            class="font-sans text-base font-bold"
          >
            {{ title() }}
          </h2>
          <p
            [id]="'confirm-desc-' + dialogId"
            class="font-sans text-sm text-foreground/70"
          >
            {{ message() }}
          </p>
          <div class="flex justify-end gap-3 pt-2">
            <button
              (click)="cancelled.emit()"
              class="font-mono text-[0.7rem] tracking-[0.15em] uppercase px-5 py-2.5 border border-foreground/20 hover:border-foreground/40 transition-colors focus-visible:outline-2 focus-visible:outline-mulim-ouro focus-visible:outline-offset-2"
            >
              Cancelar
            </button>
            <button
              #confirmBtn
              (click)="confirmed.emit()"
              class="font-mono text-[0.7rem] tracking-[0.15em] uppercase px-5 py-2.5 bg-destructive text-white hover:bg-destructive/90 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive"
            >
              {{ confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialog {
  readonly title = input<string>('Confirmar');
  readonly message = input<string>('Deseja prosseguir?');
  readonly confirmLabel = input<string>('Confirmar');
  readonly open = input<boolean>(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  readonly dialogId = crypto.randomUUID().slice(0, 8);
  private readonly confirmBtn = viewChild<ElementRef<HTMLButtonElement>>('confirmBtn');

  constructor() {
    effect(() => {
      if (this.open()) {
        // Focus confirm button when dialog opens
        setTimeout(() => this.confirmBtn()?.nativeElement.focus(), 0);
      }
    });
  }

  onEscape(): void {
    if (this.open()) {
      this.cancelled.emit();
    }
  }
}
