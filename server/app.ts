import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { existsSync } from 'node:fs';
import { briefInputSchema } from '../shared/brief';
import { z } from 'zod';
import { AgentUnavailable, type DoorwayAgent } from './agent';
import { BriefError, buildBrief } from './brief';
import type { Qloo } from './qloo';

const noteBody = z.object({ note: z.string().trim().min(20).max(800) });

export async function buildApp(
  qloo: Qloo | null,
  staticRoot?: string,
  agent?: DoorwayAgent,
  limits: { dailyRuns?: number; concurrentRuns?: number } = {},
) {
  const app = Fastify({ logger: false, bodyLimit: 8_192, trustProxy: '127.0.0.1' });
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });
  let active = 0;
  let day = '';
  let runsToday = 0;
  app.get('/api/status', async () => ({
    qloo: qloo ? 'connected' : 'not-connected',
    agent: agent?.status ?? 'not-connected',
  }));
  app.post(
    '/api/agent',
    { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
    async (request, reply) => {
      if (!agent || agent.status !== 'configured')
        return reply.code(503).send({ error: 'The agent is not connected.' });
      const parsed = noteBody.safeParse(request.body);
      if (!parsed.success)
        return reply.code(400).send({ error: 'Write a sentence or two about the meeting.' });
      const today = new Date().toISOString().slice(0, 10);
      if (today !== day) {
        day = today;
        runsToday = 0;
      }
      if (runsToday >= (limits.dailyRuns ?? 300))
        return reply.code(429).send({ error: 'Today’s demo budget is used. Try again tomorrow.' });
      if (active >= (limits.concurrentRuns ?? 3))
        return reply.code(503).send({ error: 'The agent is busy. Try again in a moment.' });
      active++;
      runsToday++;
      reply.hijack();
      reply.raw.writeHead(200, {
        'content-type': 'application/x-ndjson; charset=utf-8',
        'cache-control': 'no-store',
        'x-accel-buffering': 'no',
      });
      const send = (value: unknown) => reply.raw.write(`${JSON.stringify(value)}\n`);
      try {
        const result = await agent.run(parsed.data.note, (step) => send({ type: 'step', step }));
        send({ type: 'result', result });
      } catch (error) {
        send({
          type: 'error',
          message:
            error instanceof AgentUnavailable ? error.message : 'The agent could not finish.',
        });
      } finally {
        active--;
        reply.raw.end();
      }
    },
  );
  const briefLimit = { config: { rateLimit: { max: 12, timeWindow: '1 minute' } } };
  app.post('/api/brief', briefLimit, async (request, reply) => {
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
