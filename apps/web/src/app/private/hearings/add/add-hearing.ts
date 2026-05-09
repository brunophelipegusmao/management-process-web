import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-add-hearing',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold text-mulim-azul">Nova Audiência</h1>
      <p class="mt-2 text-gray-500">Agendamento de audiências.</p>
    </div>
  `,
})
export class AddHearing {}
