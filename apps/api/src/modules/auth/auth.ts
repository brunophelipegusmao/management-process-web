import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { appEnv } from '../../config/app-env';
import { db } from '../../infra/database/client';
import { accounts, sessions, users, verifications } from '../../schema';

type BetterAuthInstance = Awaited<ReturnType<typeof createAuth>>;

let authPromise: Promise<BetterAuthInstance> | undefined;

async function createAuth() {
   const [{ betterAuth }, { drizzleAdapter }] = await Promise.all([
      import('better-auth'),
      import('better-auth/adapters/drizzle'),
   ]);

   return betterAuth({
      secret: appEnv.auth.secret,
      baseURL: appEnv.auth.baseUrl,
      basePath: appEnv.auth.basePath,
      trustedOrigins: [appEnv.auth.baseUrl, ...appEnv.cors.allowedOrigins],
      advanced: {
         database: {
            generateId: 'uuid',
         },
      },
      emailAndPassword: {
         enabled: true,
      },
      user: {
         additionalFields: {
            profile: {
               type: 'string',
               required: false,
               defaultValue: 'advogado',
               input: false,
            },
            active: {
               type: 'boolean',
               required: false,
               defaultValue: true,
               input: false,
            },
         },
      },
      database: drizzleAdapter(db, {
         provider: 'pg',
         schema: {
            user: users,
            session: sessions,
            account: accounts,
            verification: verifications,
         },
      }),
   });
}

export async function getAuth() {
   authPromise ??= createAuth();
   return authPromise;
}

export async function getSessionFromHeaders(headers: Headers) {
   const auth = await getAuth();
   return auth.api.getSession({ headers });
}

async function handleBetterAuthRequest(
   request: { raw: IncomingMessage; body?: unknown },
   reply: {
      raw: ServerResponse<IncomingMessage>;
      hijack: () => void;
   },
) {
   const [{ toNodeHandler }, auth] = await Promise.all([
      import('better-auth/node'),
      getAuth(),
   ]);

   // Fastify consumes the raw stream before this handler runs.
   // better-call falls back to req.body when the stream is exhausted,
   // so we copy the already-parsed body onto the raw IncomingMessage.
   if (request.body !== undefined) {
      (request.raw as IncomingMessage & { body?: unknown }).body = request.body;
   }

   // Auth routes are registered directly on Fastify (bypassing NestJS CORS
   // middleware), so we must add CORS headers manually.
   const origin = request.raw.headers['origin'];
   if (origin && appEnv.cors.allowedOrigins.includes(origin)) {
      reply.raw.setHeader('Access-Control-Allow-Origin', origin);
      reply.raw.setHeader('Access-Control-Allow-Credentials', 'true');
      reply.raw.setHeader('Vary', 'Origin');
   }

   reply.hijack();

   if (request.raw.method === 'OPTIONS') {
      reply.raw.setHeader(
         'Access-Control-Allow-Methods',
         'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      );
      reply.raw.setHeader(
         'Access-Control-Allow-Headers',
         'Content-Type, Authorization, Cookie',
      );
      reply.raw.writeHead(204);
      reply.raw.end();
      return;
   }

   const nodeHandler = toNodeHandler(auth);
   await nodeHandler(request.raw, reply.raw);
}

export async function registerAuthRoutes(app: NestFastifyApplication) {
   const fastify = app.getHttpAdapter().getInstance();
   const authPath = appEnv.auth.basePath;

   fastify.all(authPath, handleBetterAuthRequest);
   fastify.all(`${authPath}/*`, handleBetterAuthRequest);
}
