import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-kanban',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold text-mulim-azul">Kanban</h1>
      <p class="mt-2 text-gray-500">Gestão visual de processos em andamento.</p>
    </div>
  `,
})
export class Kanban {}
