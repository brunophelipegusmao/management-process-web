import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly _isDark = signal(false);

  readonly isDark = this._isDark.asReadonly();

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.apply(saved === 'dark' || (!saved && prefersDark));
  }

  toggle(): void {
    this.apply(!this._isDark());
  }

  private apply(isDark: boolean): void {
    this._isDark.set(isDark);
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }
}
