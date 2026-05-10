import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthStore } from '../../core/stores/auth.store';
import { ThemeStore } from '../../core/stores/theme.store';
import { Toast } from '../../components/shared/toast/toast';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-private-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Toast],
  templateUrl: './private-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivateLayout {
  private readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly themeStore = inject(ThemeStore);
  readonly user = this.authStore.user;
  readonly isSuperAdmin = this.authStore.isSuperAdmin;

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: '⊞' },
    { label: 'Processos', path: '/dashboard/processes', icon: '📁' },
    { label: 'Clientes', path: '/dashboard/clients', icon: '👥' },
    { label: 'Testemunhas', path: '/dashboard/witnesses', icon: '👤' },
    { label: 'Prazos', path: '/dashboard/deadlines', icon: '⏰' },
    { label: 'Audiências', path: '/dashboard/hearings', icon: '🎙' },
    { label: 'Agenda', path: '/dashboard/hearing-schedule', icon: '📅' },
    { label: 'Relatórios', path: '/dashboard/reports', icon: '📊' },
    { label: 'Kanban', path: '/dashboard/kanban', icon: '🗂' },
    { label: 'Consulta', path: '/dashboard/consulta', icon: '🔍' },
  ];

  async logout(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }
}
