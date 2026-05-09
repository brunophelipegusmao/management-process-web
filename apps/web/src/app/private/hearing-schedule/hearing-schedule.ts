import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-hearing-schedule',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold text-mulim-azul">Agenda de Audiências</h1>
      <p class="mt-2 text-gray-500">Calendário e programação de audiências.</p>
    </div>
  `,
})
export class HearingSchedule {}
