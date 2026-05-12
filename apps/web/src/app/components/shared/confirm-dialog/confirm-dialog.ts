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
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
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
