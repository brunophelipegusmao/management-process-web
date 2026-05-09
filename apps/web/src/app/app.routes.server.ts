import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Páginas públicas — pré-renderizadas para SEO
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'about', renderMode: RenderMode.Prerender },
  { path: 'contact', renderMode: RenderMode.Prerender },

  // Auth e rotas privadas — renderizado no servidor (estado de sessão)
  { path: 'login', renderMode: RenderMode.Server },
  { path: 'dashboard', renderMode: RenderMode.Server },
  { path: 'dashboard/**', renderMode: RenderMode.Server },

  { path: '**', renderMode: RenderMode.Prerender },
];
