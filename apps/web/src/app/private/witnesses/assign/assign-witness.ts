import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-assign-witness',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold text-mulim-azul">Designar Testemunha</h1>
      <p class="mt-2 text-gray-500">Vinculação de testemunhas a processos.</p>
    </div>
  `,
})
export class AssignWitness {}
