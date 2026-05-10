import { HttpRequest, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { firstValueFrom } from 'rxjs';

import { httpCacheInterceptor } from '../../../../apps/web/src/app/core/interceptors/http-cache.interceptor';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGetRequest(url: string, params: Record<string, string> = {}) {
   let req = new HttpRequest<unknown>('GET', url);
   if (Object.keys(params).length > 0) {
      req = req.clone({ setParams: params });
   }
   return req;
}

function makePostRequest(url: string) {
   return new HttpRequest<unknown>('POST', url, {});
}

/**
 * Builds a mock `next` handler that returns a 200 response with the provided
 * body.  The mock is tracked by Jest so we can count calls.
 */
function makeNext(body: unknown = { data: [] }) {
   return vi.fn().mockReturnValue(of(new HttpResponse({ body, status: 200 })));
}

const CLIENTS_URL = 'http://localhost:3001/clients';
const PROCESSES_URL = 'http://localhost:3001/processes';
const HEARINGS_URL = 'http://localhost:3001/hearings';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('httpCacheInterceptor', () => {
   /**
    * The interceptor keeps an in-module Map as cache store.  Because each spec
    * file runs in its own module scope with Vitest's default isolation, the
    * cache is fresh for each file run.  However, tests within a single file
    * share state — we use distinct URLs with unique query strings where needed
    * to avoid cross-test contamination.
    */

   // -------------------------------------------------------------------------
   describe('non-GET requests — never cached', () => {
      it('passes POST requests through without caching', async () => {
         const req = makePostRequest(CLIENTS_URL);
         const next = makeNext();

         await firstValueFrom(httpCacheInterceptor(req, next));

         expect(next).toHaveBeenCalledTimes(1);
         expect(next).toHaveBeenCalledWith(req);
      });
   });

   // -------------------------------------------------------------------------
   describe('GET requests for cacheable paths without search params', () => {
      it('calls next on the first request to /clients', async () => {
         const req = makeGetRequest(
            'http://localhost:3001/clients-nocache-test-1',
         );
         const next = makeNext({ data: [{ id: '1' }] });

         await firstValueFrom(httpCacheInterceptor(req, next));

         expect(next).toHaveBeenCalledTimes(1);
      });

      it('serves /clients from cache on the second identical request', async () => {
         const url = 'http://localhost:3001/clients';
         const next = makeNext({ data: [{ id: '1' }] });

         // Warm the cache
         await firstValueFrom(httpCacheInterceptor(makeGetRequest(url), next));
         // Second request — should be served from cache
         await firstValueFrom(httpCacheInterceptor(makeGetRequest(url), next));

         expect(next).toHaveBeenCalledTimes(1);
      });

      it('serves /processes from cache on repeat requests', async () => {
         const url = PROCESSES_URL;
         const next = makeNext({ data: [] });

         await firstValueFrom(httpCacheInterceptor(makeGetRequest(url), next));
         await firstValueFrom(httpCacheInterceptor(makeGetRequest(url), next));

         expect(next).toHaveBeenCalledTimes(1);
      });
   });

   // -------------------------------------------------------------------------
   describe('GET requests NOT cached', () => {
      it('does NOT cache /hearings (not in CACHEABLE_PATHS)', async () => {
         const req = makeGetRequest(HEARINGS_URL);
         const next = makeNext();

         await firstValueFrom(httpCacheInterceptor(req, next));
         await firstValueFrom(httpCacheInterceptor(req, next));

         // Both requests hit next because /hearings is not in the cacheable list
         expect(next).toHaveBeenCalledTimes(2);
      });

      it('does NOT cache /clients requests that contain the "name" search param', async () => {
         const req = makeGetRequest(CLIENTS_URL, { name: 'Silva' });
         const next = makeNext();

         await firstValueFrom(httpCacheInterceptor(req, next));
         await firstValueFrom(httpCacheInterceptor(req, next));

         expect(next).toHaveBeenCalledTimes(2);
      });

      it('does NOT cache /clients requests with "clientId" param', async () => {
         const req = makeGetRequest(CLIENTS_URL, { clientId: 'some-id' });
         const next = makeNext();

         await firstValueFrom(httpCacheInterceptor(req, next));
         await firstValueFrom(httpCacheInterceptor(req, next));

         expect(next).toHaveBeenCalledTimes(2);
      });

      it('does NOT cache /processes requests with "cnjNumber" param', async () => {
         const req = makeGetRequest(PROCESSES_URL, { cnjNumber: '0001234' });
         const next = makeNext();

         await firstValueFrom(httpCacheInterceptor(req, next));
         await firstValueFrom(httpCacheInterceptor(req, next));

         expect(next).toHaveBeenCalledTimes(2);
      });
   });

   // -------------------------------------------------------------------------
   describe('cached response shape', () => {
      it('returns an HttpResponse with status 200 from cache', async () => {
         const url = 'http://localhost:3001/processes?__cache_shape_test=1';
         const body = { data: [{ id: 'proc-1' }] };
         const next = makeNext(body);

         // Warm the cache
         await firstValueFrom(httpCacheInterceptor(makeGetRequest(url), next));
         // Serve from cache
         const response = await firstValueFrom(
            httpCacheInterceptor(makeGetRequest(url), next),
         );

         expect(response).toBeInstanceOf(HttpResponse);
         expect((response as HttpResponse<unknown>).status).toBe(200);
         expect((response as HttpResponse<unknown>).body).toEqual(body);
      });
   });
});
