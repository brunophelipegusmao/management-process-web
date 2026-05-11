import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from '../../components/shared/footer/footer';
import { Header } from '../../components/shared/header/header';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, Header, Footer],
  template: `
    <div class="min-h-screen flex flex-col w-full overflow-x-hidden">
      <app-header />
      <router-outlet />
      <app-footer />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'class': 'light' },
})
export class PublicLayout {}
