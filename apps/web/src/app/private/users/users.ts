import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-users',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold text-mulim-azul">Usuários</h1>
      <p class="mt-2 text-gray-500">Cadastro e edição de usuários do sistema.</p>
    </div>
  `,
})
export class Users {}
