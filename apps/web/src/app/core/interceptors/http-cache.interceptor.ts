import { HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

const TTL_MS = 2 * 60 * 1000;

/**
 * Paths que valem cache: são listas usadas em selects de formulários,
 * raramente mudam e são requisitadas em múltiplas navegações.
 * Exclui buscas pontuais (name/cnjNumber/clientId = filtro de pesquisa).
 */
const CACHEABLE_PATHS = ['/clients', '/processes'];
const SEARCH_PARAMS = new Set(['name', 'cnjNumber', 'clientId']);

interface CacheEntry {
  body: unknown;
  at: number;
}

const store = new Map<string, CacheEntry>();

function isCacheable(req: HttpRequest<unknown>): boolean {
  if (req.method !== 'GET') return false;
  if (!CACHEABLE_PATHS.some(p => req.url.endsWith(p))) return false;
  for (const p of SEARCH_PARAMS) {
    if (req.params.has(p)) return false;
  }
  return true;
}

export const httpCacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isCacheable(req)) return next(req);

  const key = req.urlWithParams;
  const entry = store.get(key);

  if (entry && Date.now() - entry.at < TTL_MS) {
    return of(new HttpResponse({ body: entry.body, status: 200 }));
  }

  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse && event.ok) {
        store.set(key, { body: event.body, at: Date.now() });
      }
    }),
  );
};
