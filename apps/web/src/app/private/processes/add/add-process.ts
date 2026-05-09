import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-add-process',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold text-mulim-azul">Novo Processo</h1>
      <p class="mt-2 text-gray-500">Cadastro de processos jurídicos.</p>
    </div>
  `,
})
export class AddProcess {}
