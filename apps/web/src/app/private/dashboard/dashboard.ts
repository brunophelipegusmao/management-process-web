import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold text-mulim-azul">Dashboard</h1>
      <p class="mt-2 text-gray-500">Visão geral do escritório.</p>
    </div>
  `,
})
export class Dashboard {}
