import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

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
        path: 'processes/add',
        loadComponent: () =>
          import('./private/processes/add/add-process').then((m) => m.AddProcess),
        title: 'Novo Processo',
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
    ],
  },

  { path: '**', redirectTo: '' },
];
