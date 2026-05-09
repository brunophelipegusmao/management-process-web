import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-reports',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold text-mulim-azul">Relatórios</h1>
      <p class="mt-2 text-gray-500">Geração e exportação de relatórios.</p>
    </div>
  `,
})
export class Reports {}
