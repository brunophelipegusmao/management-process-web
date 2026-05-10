import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { superadminGuard } from './core/guards/superadmin.guard';

export const routes: Routes = [
  // Rotas públicas — layout com header + footer
  {
    path: '',
    loadComponent: () => import('./public/layout/public-layout').then((m) => m.PublicLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./public/home/home').then((m) => m.Home),
        title: 'Início',
        pathMatch: 'full',
      },
      {
        path: 'about',
        loadComponent: () => import('./public/about/about').then((m) => m.About),
        title: 'Sobre',
      },
      {
        path: 'contact',
        loadComponent: () => import('./public/contact/contact').then((m) => m.Contact),
        title: 'Contato',
      },
    ],
  },

  // Auth — sem layout externo
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then((m) => m.Login),
    title: 'Login',
  },

  // Rotas privadas — protegidas por authGuard, layout com sidebar
  {
    path: 'dashboard',
    loadComponent: () => import('./private/layout/private-layout').then((m) => m.PrivateLayout),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./private/dashboard/dashboard').then((m) => m.Dashboard),
        title: 'Dashboard',
      },
      {
        path: 'processes',
        loadComponent: () =>
          import('./private/processes/list/process-list').then((m) => m.ProcessList),
        title: 'Processos',
      },
      {
        path: 'processes/add',
        loadComponent: () =>
          import('./private/processes/add/add-process').then((m) => m.AddProcess),
        title: 'Novo Processo',
      },
      {
        path: 'processes/:id',
        loadComponent: () =>
          import('./private/processes/detail/process-detail').then((m) => m.ProcessDetail),
        title: 'Processo',
      },
      {
        path: 'clients',
        loadComponent: () =>
          import('./private/clients/list/client-list').then((m) => m.ClientList),
        title: 'Clientes',
      },
      {
        path: 'clients/:id',
        loadComponent: () =>
          import('./private/clients/detail/client-detail').then((m) => m.ClientDetail),
        title: 'Cliente',
      },
      {
        path: 'witnesses',
        loadComponent: () =>
          import('./private/witnesses/list/witness-list').then((m) => m.WitnessList),
        title: 'Testemunhas',
      },
      {
        path: 'deadlines',
        loadComponent: () =>
          import('./private/deadlines/list/deadline-list').then((m) => m.DeadlineList),
        title: 'Prazos',
      },
      {
        path: 'hearings',
        loadComponent: () =>
          import('./private/hearings/list/hearing-list').then((m) => m.HearingList),
        title: 'Audiências',
      },
      {
        path: 'hearings/add',
        loadComponent: () => import('./private/hearings/add/add-hearing').then((m) => m.AddHearing),
        title: 'Nova Audiência',
      },
      {
        path: 'witnesses/assign',
        loadComponent: () =>
          import('./private/witnesses/assign/assign-witness').then((m) => m.AssignWitness),
        title: 'Designar Testemunha',
      },
      {
        path: 'hearing-schedule',
        loadComponent: () =>
          import('./private/hearing-schedule/hearing-schedule').then((m) => m.HearingSchedule),
        title: 'Agenda de Audiências',
      },
      {
        path: 'reports',
        loadComponent: () => import('./private/reports/reports').then((m) => m.Reports),
        title: 'Relatórios',
      },
      {
        path: 'kanban',
        loadComponent: () => import('./private/kanban/kanban').then((m) => m.Kanban),
        title: 'Kanban',
      },
      {
        path: 'users',
        loadComponent: () => import('./private/users/users').then((m) => m.Users),
        title: 'Usuários',
        canActivate: [superadminGuard],
      },
      {
        path: 'audit',
        loadComponent: () =>
          import('./private/audit/audit-logs').then((m) => m.AuditLogs),
        title: 'Auditoria',
        canActivate: [superadminGuard],
      },
      {
        path: 'consulta',
        loadComponent: () => import('./private/consulta/consulta').then((m) => m.Consulta),
        title: 'Consulta',
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
