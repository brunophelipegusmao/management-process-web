import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  readonly menuOpen = signal(false);

  toggleMenu() {
    this.menuOpen.update((v) => !v);
  }
}
