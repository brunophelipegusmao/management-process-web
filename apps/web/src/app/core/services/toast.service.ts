import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(type: ToastType, message: string, duration = 4000): void {
    const id = crypto.randomUUID();
    this.toasts.update((ts) => [...ts, { id, type, message }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: string): void {
    this.toasts.update((ts) => ts.filter((t) => t.id !== id));
  }
}
