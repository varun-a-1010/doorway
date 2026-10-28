import Fastify from 'fastify';
import { existsSync } from 'node:fs';
import { briefInputSchema } from '../shared/brief';
import { BriefError, buildBrief } from './brief';
import type { Qloo } from './qloo';

export async function buildApp(qloo: Qloo | null, staticRoot?: string) {
  const app = Fastify({ logger: false, bodyLimit: 8_192 });
  app.get('/api/status', async () => ({ qloo: qloo ? 'connected' : 'not-connected' }));
  app.post('/api/brief', async (request, reply) => {
    if (!qloo) return reply.code(503).send({ error: 'Qloo is not connected.' });
    const parsed = briefInputSchema.safeParse(request.body);
    if (!parsed.success)
      return reply.code(400).send({ error: 'Enter 1–5 interests for each person.' });
    try {
      return await buildBrief(qloo, parsed.data);
    } catch (error) {
      if (error instanceof BriefError)
        return reply.code(error.status).send({ error: error.message });
      return reply.code(502).send({
        error: 'Qloo could not be reached or returned an unexpected response. Try again.',
      });
    }
  });
  if (staticRoot && existsSync(staticRoot)) {
    const { default: fastifyStatic } = await import('@fastify/static');
    await app.register(fastifyStatic, { root: staticRoot });
  }
  return app;
}
