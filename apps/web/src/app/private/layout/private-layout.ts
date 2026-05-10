import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthStore } from '../../core/stores/auth.store';
import { ThemeStore } from '../../core/stores/theme.store';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-private-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
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
    { label: 'Processos', path: '/dashboard/processes/add', icon: '📁' },
    { label: 'Audiências', path: '/dashboard/hearings/add', icon: '🎙' },
    { label: 'Testemunhas', path: '/dashboard/witnesses/assign', icon: '👤' },
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
